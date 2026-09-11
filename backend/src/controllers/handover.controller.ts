import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { store } from '../db/store';
import { HandoverRecord, PaymentLedgerEntry, PriceLogEntry, AnomalyFlag, TraceabilityLog, LocationSource } from '../types';
import { payoutService } from '../services/payout.service';
import { geocodingService } from '../services/geocoding.service';

export const verifyHandover = async (req: AuthRequest, res: Response) => {
  try {
    const {
      lotId,
      actualWeight,
      handoverOtp: rawHandoverOtp,
      paymentMethod = 'CASH',
      proofImageUrl,
      driverName = 'Suresh Yadav',
      latitude,
      longitude,
      locationSource = 'DISTRICT_FALLBACK',
      deviceAccuracyMeters,
      signatureImageUrl
    } = req.body;
    const handoverOtp = rawHandoverOtp || req.body.otp;

    if (!req.user || (req.user.role !== 'RECYCLER' && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only authenticated recyclers can verify handovers.' });
    }

    const rec = store.recyclers.find(r => r.userId === req.user?.userId || r.contactPhone === req.user?.phone) ||
                store.recyclers.find(r => r.id === (req.user as any)?.recyclerId);
    if (!rec) {
      return res.status(403).json({ success: false, message: 'Recycler profile not found.' });
    }

    if (rec.authorizationStatus === 'PENDING_VERIFICATION') {
      return res.status(403).json({ success: false, message: 'Facility authorization pending verification. Handover verification locked.' });
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

    const recyclerId = rec.id;
    const recyclerName = rec.facilityName;

    if (!lotId || actualWeight === undefined || !handoverOtp) {
      return res.status(400).json({ success: false, message: 'Lot ID, actual scale weight, and OTP are required.' });
    }

    const parsedActualWeight = parseFloat(actualWeight);
    if (isNaN(parsedActualWeight) || parsedActualWeight <= 0) {
      return res.status(400).json({ success: false, message: 'Actual scale weight must be greater than zero.' });
    }

    const lot = store.lots.find(l => l.id === lotId);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found.' });
    }

    // Ownership check: Recycler A cannot verify handover for Recycler B's accepted lot!
    if (lot.selectedRecyclerId && lot.selectedRecyclerId !== recyclerId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot verify scale handover for another facility's accepted lot."
      });
    }

    // State check: Lot must be in ACCEPTED or PICKUP_SCHEDULED
    if (lot.status !== 'ACCEPTED' && lot.status !== 'PICKUP_SCHEDULED') {
      return res.status(400).json({
        success: false,
        message: `Cannot verify handover: lot is in ${lot.status} state. Lot must be ACCEPTED or PICKUP_SCHEDULED.`
      });
    }

    // Verify OTP: NO MASTER BYPASS (Remove 4821/1234 bypass)
    const cleanOtp = String(handoverOtp).trim();
    const expectedOtp = lot.handoverOtp ? String(lot.handoverOtp).trim() : '';
    if (!expectedOtp || cleanOtp !== expectedOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Handover OTP. The 4-digit OTP provided by the collector is required to verify digital scale handover.'
      });
    }

    const weightDifference = parseFloat((parsedActualWeight - lot.approxWeight).toFixed(2));
    const diffPercent = parseFloat(((weightDifference / lot.approxWeight) * 100).toFixed(1));

    // Determine location
    const validLocationSource: LocationSource = (locationSource === 'DEVICE_GPS' && latitude && longitude)
      ? 'DEVICE_GPS'
      : 'DISTRICT_FALLBACK';

    const gpsLocation = (latitude && longitude) 
      ? { lat: parseFloat(latitude), lng: parseFloat(longitude) }
      : { lat: 26.8467, lng: 80.9462 }; // Default district centroid

    // Rate resolution
    let ratePerKg = 95;
    const acceptedOffer = store.offers.find(o => o.lotId === lot.id && o.status === 'ACCEPTED');
    if (acceptedOffer) {
      ratePerKg = acceptedOffer.offeredRatePerKg;
    } else {
      const priceRecord = store.prices.find(p => p.materialCategory === lot.materialCategory);
      if (priceRecord) ratePerKg = priceRecord.prevailingBuyPrice;
    }

    const finalPaymentAmount = Math.round(parsedActualWeight * ratePerKg);
    const now = new Date().toISOString();

    // 1. Process Settlement via Payout Service
    const collector = store.collectors.find(c => c.id === lot.collectorId);
    const payoutResult = await payoutService.processHandoverSettlement({
      lotId: lot.id,
      collectorId: lot.collectorId,
      collectorName: collector?.name || lot.collectorName,
      collectorPhone: collector?.phone || lot.collectorPhone,
      amount: finalPaymentAmount,
      paymentMethod
    });

    // 2. Create Handover Record
    const handoverRecord: HandoverRecord = {
      id: `HO-${new Date().getFullYear()}-${String(store.handovers.length + 101).padStart(6, '0')}`,
      lotId: lot.id,
      collectorId: lot.collectorId,
      recyclerId,
      recyclerName,
      approxWeight: lot.approxWeight,
      initialEstimatedWeight: lot.approxWeight,
      actualWeight: parsedActualWeight,
      weightDifference,
      weightDiffPercentage: diffPercent,
      proofImageUrl: proofImageUrl || '/uploads/scale_proof_default.jpg',
      signatureImageUrl: signatureImageUrl || undefined,
      handoverOtp,
      gpsLocation,
      locationSource: validLocationSource,
      deviceAccuracyMeters: deviceAccuracyMeters ? parseFloat(deviceAccuracyMeters) : undefined,
      verifiedByRecyclerName: driverName,
      paymentMethod,
      paymentRecordType: payoutResult.recordType,
      externalGatewayStatus: payoutResult.externalGatewayStatus,
      finalPaymentAmount,
      timestamp: now
    };

    store.handovers.push(handoverRecord);

    // 3. Update Lot
    lot.selectedRecyclerId = recyclerId;
    lot.actualWeight = parsedActualWeight;
    lot.finalSaleValue = finalPaymentAmount;
    lot.status = 'RECEIVED';
    lot.updatedAt = now;

    // 4. Create Payment Ledger Voucher
    const paymentEntry: PaymentLedgerEntry = {
      id: `pay_${Date.now()}`,
      lotId: lot.id,
      collectorId: lot.collectorId,
      recyclerId,
      recyclerName,
      materialCategory: lot.materialCategory,
      weight: parsedActualWeight,
      ratePerKg,
      amount: finalPaymentAmount,
      paymentMethod,
      recordType: payoutResult.recordType,
      payoutStatus: payoutResult.payoutStatus as any,
      externalGatewayStatus: payoutResult.externalGatewayStatus,
      status: 'PAID',
      transactionRef: `${paymentMethod === 'UPI' ? 'UPI' : 'CSH'}-${lot.locationDistrict.slice(0, 3).toUpperCase()}-2026-${String(store.payments.length + 1).padStart(4, '0')}`,
      dataSource: 'LIVE',
      timestamp: now
    };

    store.payments.push(paymentEntry);

    // 5. Update Collector Metrics
    if (collector) {
      collector.totalEarnings += finalPaymentAmount;
      collector.totalWeightCollected = parseFloat((collector.totalWeightCollected + parsedActualWeight).toFixed(1));
    }

    // 5. Append Real Price Observation
    const priceLog: PriceLogEntry = {
      id: `plog_tx_${Date.now()}`,
      materialCategory: lot.materialCategory,
      subCategory: lot.subCategory,
      district: lot.locationDistrict,
      state: lot.locationState,
      ratePerKg,
      source: `Settled Lot Transaction (${lot.id})`,
      sourceType: 'TRANSACTION_SETTLED',
      dataSource: 'LIVE',
      lotId: lot.id,
      observedAt: now
    };
    store.priceHistoryLog.push(priceLog);

    // 6. Statistical & Rule-Based Anomaly Detection (Z-Score Outlier Engine)
    const pastHandovers = store.handovers.filter(h => {
      const l = store.lots.find(lotRecord => lotRecord.id === h.lotId);
      return l?.materialCategory === lot.materialCategory;
    });

    const historicalVariances = pastHandovers.map(h => Math.abs(h.weightDiffPercentage));
    let sampleMean = 1.2;
    let sampleStdDev = 1.5;

    if (historicalVariances.length >= 3) {
      sampleMean = historicalVariances.reduce((a, b) => a + b, 0) / historicalVariances.length;
      const sumSquareDiffs = historicalVariances.reduce((acc, v) => acc + Math.pow(v - sampleMean, 2), 0);
      sampleStdDev = Math.sqrt(sumSquareDiffs / historicalVariances.length) || 1.0;
    }

    const statisticalZScore = parseFloat((Math.abs(Math.abs(diffPercent) - sampleMean) / sampleStdDev).toFixed(2));

    if (Math.abs(diffPercent) >= 30 || statisticalZScore >= 2.5) {
      const anomaly: AnomalyFlag = {
        id: `anom_weight_${Date.now()}`,
        lotId: lot.id,
        collectorId: lot.collectorId,
        recyclerId: lot.selectedRecyclerId,
        anomalyType: 'WEIGHT_MISMATCH',
        severity: (Math.abs(diffPercent) > 50 || statisticalZScore >= 3.5) ? 'HIGH' : 'MEDIUM',
        description: `Weight mismatch of ${diffPercent}% detected during scale handover. Quoted: ${lot.approxWeight}kg, Actual: ${parsedActualWeight}kg. Statistical Z-Score: ${statisticalZScore}σ (μ=${sampleMean.toFixed(1)}%, σ=${sampleStdDev.toFixed(1)}%).`,
        weightDiffPercent: diffPercent,
        statisticalZScore,
        sampleMean: parseFloat(sampleMean.toFixed(2)),
        sampleStdDev: parseFloat(sampleStdDev.toFixed(2)),
        status: 'OPEN',
        createdAt: now
      };
      store.anomalies.push(anomaly);
    }

    // 7. Append Cryptographic Traceability Event
    store.appendTraceabilityLog({
      lotId: lot.id,
      stage: 'RECYCLER_RECEIVED',
      title: 'Digital Handover & Payment Verified',
      description: `Physical electronic scale weight recorded: ${parsedActualWeight} kg (${weightDifference > 0 ? '+' : ''}${weightDifference} kg diff). Collector OTP ${handoverOtp} verified. Digital ledger voucher ₹${finalPaymentAmount} settled via ${paymentMethod}.`,
      facilityLocation: `${lot.locationDistrict} Collection Point (${validLocationSource === 'DEVICE_GPS' ? 'Device GPS' : 'District Centroid'})`,
      actorRole: 'RECYCLER',
      actorName: driverName,
      timestamp: now,
      dataSource: 'LIVE'
    });

    store.save();

    res.json({
      success: true,
      message: 'Handover verified and payment voucher logged.',
      handover: handoverRecord,
      payment: paymentEntry,
      lot
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHandoverByLotId = async (req: AuthRequest, res: Response) => {
  try {
    const lotId = req.params.lotId;
    const handover = store.handovers.find(h => h.lotId === lotId);
    const lot = store.lots.find(l => l.id === lotId);

    if (!handover && !lot) {
      return res.status(404).json({ success: false, message: 'Handover details not found.' });
    }

    if (req.user && req.user.role === 'RECYCLER') {
      const rec = store.recyclers.find(r => r.userId === req.user?.userId || r.contactPhone === req.user?.phone) ||
                  store.recyclers.find(r => r.id === (req.user as any)?.recyclerId);
      const recId = rec ? rec.id : ((req.user as any)?.recyclerId || req.user.userId);
      if (lot && lot.selectedRecyclerId && lot.selectedRecyclerId !== recId) {
        return res.status(403).json({ success: false, message: "Forbidden: Cannot access handover of another facility's lot." });
      }
      if (handover && handover.recyclerId !== recId) {
        return res.status(403).json({ success: false, message: "Forbidden: Cannot access handover of another facility." });
      }
    } else if (req.user && req.user.role === 'COLLECTOR') {
      const col = store.collectors.find(c => c.userId === req.user?.userId);
      const colId = col ? col.id : req.user.userId;
      if (lot && lot.collectorId !== colId) {
        return res.status(403).json({ success: false, message: "Forbidden: Cannot access handover of another collector's lot." });
      }
    }

    res.json({
      success: true,
      handover,
      lot
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
