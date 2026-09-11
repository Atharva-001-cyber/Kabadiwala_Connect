import { Response } from 'express';
import { db } from '../db/store';
import { AuthRequest } from '../middleware/auth.middleware';
import { Pickup } from '../types';

export const schedulePickup = async (req: AuthRequest, res: Response) => {
  try {
    const {
      lotId,
      scheduledDate,
      timeSlot = '10:00 AM - 01:00 PM',
      driverName = 'Suresh Yadav',
      driverContact = '9871122334',
      vehicleNumber = 'UP-32-BZ-4412',
      notes = ''
    } = req.body;

    if (!req.user || (req.user.role !== 'RECYCLER' && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only authenticated recyclers can schedule pickups.' });
    }

    const rec = db.recyclers.find(r => r.userId === req.user?.userId || r.contactPhone === req.user?.phone) ||
                db.recyclers.find(r => r.id === (req.user as any)?.recyclerId);
    if (!rec) {
      return res.status(403).json({ success: false, message: 'Recycler profile not found.' });
    }

    if (rec.authorizationStatus === 'PENDING_VERIFICATION') {
      return res.status(403).json({ success: false, message: 'Facility authorization pending verification. Pickup scheduling locked.' });
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

    const lot = db.lots.find(l => l.id === lotId);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found' });
    }

    // Ownership check: Recycler A cannot schedule pickup for Recycler B's accepted lot!
    if (lot.selectedRecyclerId && lot.selectedRecyclerId !== recyclerId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot schedule pickup for another recycler's accepted lot."
      });
    }

    // State validation: Lot must be in ACCEPTED or PICKUP_SCHEDULED
    if (lot.status !== 'ACCEPTED' && lot.status !== 'PICKUP_SCHEDULED') {
      return res.status(400).json({
        success: false,
        message: `Cannot schedule pickup: lot status is ${lot.status}. An accepted offer is required.`
      });
    }

    const pickup: Pickup = {
      id: `pk_${Date.now()}`,
      lotId: lot.id,
      recyclerId,
      collectorId: lot.collectorId,
      scheduledDate: scheduledDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      timeSlot,
      driverName,
      driverContact,
      vehicleNumber,
      status: 'SCHEDULED',
      notes,
      createdAt: new Date().toISOString()
    };

    db.pickups.push(pickup);

    lot.status = 'PICKUP_SCHEDULED';
    lot.selectedRecyclerId = recyclerId;
    lot.updatedAt = new Date().toISOString();

    const recyclerName = rec.facilityName || 'Authorized Recycler';

    // Traceability Log
    db.appendTraceabilityLog({
      lotId: lot.id,
      stage: 'COLLECTED',
      title: 'Doorstep Pickup Scheduled',
      description: `Pickup booked for ${pickup.scheduledDate} (${pickup.timeSlot}). Driver: ${driverName} (${vehicleNumber}).`,
      facilityLocation: `${lot.locationDistrict}, ${lot.locationState}`,
      actorRole: 'RECYCLER',
      actorName: recyclerName,
      timestamp: new Date().toISOString(),
      dataSource: 'LIVE'
    });

    db.save();

    return res.status(201).json({
      success: true,
      message: 'Pickup scheduled successfully',
      pickup,
      lot
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to schedule pickup', error: err.message });
  }
};

export const getPickups = async (req: AuthRequest, res: Response) => {
  try {
    const { recyclerId, collectorId, status } = req.query;
    let list = [...db.pickups];

    if (req.user && req.user.role === 'RECYCLER') {
      const rec = db.recyclers.find(r => r.userId === req.user?.userId || r.contactPhone === req.user?.phone) ||
                  db.recyclers.find(r => r.id === (req.user as any)?.recyclerId);
      const callerRecyclerId = rec ? rec.id : ((req.user as any)?.recyclerId || req.user.userId);

      // IDOR protection: A recycler cannot query another recycler's pickups!
      if (recyclerId && recyclerId !== callerRecyclerId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Cannot access pickups of another recycler facility.'
        });
      }
      list = list.filter(p => p.recyclerId === callerRecyclerId);
    } else if (req.user && req.user.role === 'COLLECTOR') {
      const col = db.collectors.find(c => c.userId === req.user?.userId);
      const callerCollectorId = col ? col.id : req.user.userId;

      if (collectorId && collectorId !== callerCollectorId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Cannot access pickups of another collector.'
        });
      }
      list = list.filter(p => p.collectorId === callerCollectorId);
    } else if (req.user && req.user.role === 'ADMIN') {
      if (recyclerId) {
        list = list.filter(p => p.recyclerId === recyclerId);
      }
      if (collectorId) {
        list = list.filter(p => p.collectorId === collectorId);
      }
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied.' });
    }

    if (status) {
      list = list.filter(p => p.status === status);
    }

    return res.json({
      success: true,
      count: list.length,
      pickups: list
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch pickups', error: err.message });
  }
};
