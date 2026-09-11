import { Request, Response } from 'express';
import { db } from '../db/store';
import { AuthRequest } from '../middleware/auth.middleware';
import { TraceabilityLog, LotStatus } from '../types';

export const getTraceabilityByLotId = async (req: Request, res: Response) => {
  try {
    const { lotId } = req.params;
    const lot = db.lots.find(l => l.id.toLowerCase() === lotId.toLowerCase() || l.clientLotId === lotId);

    if (!lot) {
      return res.status(404).json({ success: false, message: `Lot ${lotId} not found.` });
    }

    const logs = db.traceabilityLogs
      .filter(t => t.lotId === lot.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const handover = db.handovers.find(h => h.lotId === lot.id);
    const recycler = db.recyclers.find(r => r.id === lot.selectedRecyclerId);

    return res.json({
      success: true,
      lot,
      recycler,
      handover,
      timeline: logs,
      currentStage: lot.status
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch traceability', error: err.message });
  }
};

export const updateProcessingStage = async (req: AuthRequest, res: Response) => {
  try {
    const {
      lotId,
      stage, // 'RECYCLER_RECEIVED' | 'SORTED' | 'PROCESSING' | 'RECOVERED' | 'RECYCLED'
      title,
      description,
      recoveredDetails
    } = req.body;

    if (!req.user || (req.user.role !== 'RECYCLER' && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only authenticated recyclers can update processing stage.' });
    }

    const rec = db.recyclers.find(r => r.userId === req.user?.userId || r.contactPhone === req.user?.phone) ||
                db.recyclers.find(r => r.id === (req.user as any)?.recyclerId);
    if (!rec) {
      return res.status(403).json({ success: false, message: 'Recycler profile not found.' });
    }

    if (rec.authorizationStatus === 'PENDING_VERIFICATION') {
      return res.status(403).json({ success: false, message: 'Facility authorization pending verification. Operations restricted.' });
    }
    if (rec.authorizationStatus === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Facility authorization suspended. Operations blocked.' });
    }

    // IDOR protection: Reject client-supplied recyclerId mismatches
    if (req.body.recyclerId && req.body.recyclerId !== rec.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: recyclerId mismatch with authenticated identity.'
      });
    }

    const lot = db.lots.find(l => l.id === lotId);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found' });
    }

    const recyclerId = rec.id;
    const actorName = rec.contactPerson || rec.facilityName;
    const facilityLocation = req.body.facilityLocation || (rec.address ? `${rec.address}, ${rec.district}` : `${rec.facilityName}, ${rec.district}, ${rec.state}`);

    // Ownership check: Recycler A cannot update processing stages on Recycler B's lot!
    if (lot.selectedRecyclerId && lot.selectedRecyclerId !== recyclerId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot update processing stage for another facility's lot."
      });
    }

    // State check: Lot must be in RECEIVED or PROCESSING state to advance stages
    if (lot.status !== 'RECEIVED' && lot.status !== 'PROCESSING') {
      return res.status(400).json({
        success: false,
        message: `Cannot update processing stage: lot status is ${lot.status}. Lot must be physically RECEIVED before processing.`
      });
    }

    const now = new Date().toISOString();

    const stageTitles: Record<string, string> = {
      RECYCLER_RECEIVED: 'Material Received at Facility',
      SORTED: 'Component Depopulation & Sorting Completed',
      PROCESSING: 'Physical Treatment & Mechanical Processing Active',
      RECOVERED: 'Material Recovery & Fractions Segregated',
      RECYCLED: 'E-Waste Recycling Operations Completed'
    };

    const stageDescriptions: Record<string, string> = {
      RECYCLER_RECEIVED: `Material batch received at facility warehouse and logged into digital inventory.`,
      SORTED: `Components sorted. High-grade circuit boards, wiring, and metallic fractions segregated for physical treatment.`,
      PROCESSING: `Regulated physical dismantling and mechanical separation underway in accordance with facility standard operating procedures.`,
      RECOVERED: recoveredDetails || `Recovered material fractions (ferrous, non-ferrous metals, engineering plastics) quantified.`,
      RECYCLED: `Formal recycling operations completed. Platform digital handover and processing records archived.`
    };

    const newLog = db.appendTraceabilityLog({
      lotId: lot.id,
      stage: stage as any,
      title: title || stageTitles[stage] || `Stage updated to ${stage}`,
      description: description || stageDescriptions[stage] || `Recycling stage processed.`,
      facilityLocation,
      actorRole: 'RECYCLER',
      actorName,
      timestamp: now,
      dataSource: 'LIVE'
    });

    // Update lot status
    lot.selectedRecyclerId = recyclerId;
    if (stage === 'RECYCLED') {
      lot.status = 'RECYCLED';
      // Add to recycler total processed kg
      const weightToAdd = lot.actualWeight || lot.approxWeight || 0;
      rec.totalProcessedKg = parseFloat((rec.totalProcessedKg + weightToAdd).toFixed(1));
    } else if (stage === 'PROCESSING' || stage === 'SORTED' || stage === 'RECOVERED') {
      lot.status = 'PROCESSING';
    } else if (stage === 'RECYCLER_RECEIVED') {
      lot.status = 'RECEIVED';
    }

    lot.updatedAt = now;
    db.save();

    return res.status(201).json({
      success: true,
      message: `Processing stage updated to ${stage}`,
      lot,
      log: newLog
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update stage', error: err.message });
  }
};

export const verifyTraceabilityIntegrity = async (req: Request, res: Response) => {
  try {
    const { lotId } = req.params;
    const lot = db.lots.find(l => l.id.toLowerCase() === lotId.toLowerCase() || l.clientLotId === lotId);

    if (!lot) {
      return res.status(404).json({ success: false, message: `Lot ${lotId} not found.` });
    }

    const logs = db.traceabilityLogs
      .filter(t => t.lotId === lot.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let isTamperFree = true;
    let compromisedEventId: string | null = null;
    let failureReason: string | null = null;
    const auditChain: any[] = [];

    let expectedPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const recalculated = (await import('../db/store')).computeTraceabilityHashes(log, expectedPrevHash);

      const prevMatches = (log.previousEventHash || expectedPrevHash) === expectedPrevHash;
      const hashMatches = log.eventHash === recalculated.eventHash;

      auditChain.push({
        index: i,
        eventId: log.id,
        stage: log.stage,
        timestamp: log.timestamp,
        storedHash: log.eventHash,
        recomputedHash: recalculated.eventHash,
        valid: prevMatches && hashMatches
      });

      if (!prevMatches || !hashMatches) {
        isTamperFree = false;
        compromisedEventId = log.id;
        failureReason = !prevMatches ? 'Chain broken: previousEventHash mismatch.' : 'Payload altered: eventHash mismatch.';
        break;
      }

      expectedPrevHash = log.eventHash || recalculated.eventHash;
    }

    const genesisHash = auditChain[0]?.storedHash || null;
    const terminalHash = auditChain[auditChain.length - 1]?.storedHash || null;

    return res.json({
      success: true,
      lotId: lot.id,
      totalEvents: logs.length,
      eventsAudited: logs.length,
      isTamperFree,
      compromisedEventId,
      failureReason,
      algorithm: 'SHA-256 (Merkle DAG Hash Chaining)',
      genesisHash,
      terminalHash,
      auditChain
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Verification failed', error: err.message });
  }
};
