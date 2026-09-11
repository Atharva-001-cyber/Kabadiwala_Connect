import { Response } from 'express';
import { db } from '../db/store';
import { AuthRequest } from '../middleware/auth.middleware';
import { Lot, MaterialCategory, LotCondition, SourceType, TraceabilityLog, LocationSource } from '../types';
import { geocodingService } from '../services/geocoding.service';

export const calculateEstimatedValue = (
  category: MaterialCategory,
  weight: number,
  condition: LotCondition,
  district: string = 'Lucknow'
) => {
  const priceRecord = db.prices.find(p => p.materialCategory === category && p.district.toLowerCase() === district.toLowerCase())
    || db.prices.find(p => p.materialCategory === category)
    || { prevailingBuyPrice: 70, minPrice: 60, maxPrice: 85 };

  let conditionMultiplier = 1.0;
  if (condition === 'DAMAGED') conditionMultiplier = 0.85;
  if (condition === 'DISMANTLED') conditionMultiplier = 0.75;

  const minVal = Math.round(weight * priceRecord.minPrice * conditionMultiplier);
  const maxVal = Math.round(weight * priceRecord.maxPrice * conditionMultiplier);
  const avgVal = Math.round(weight * priceRecord.prevailingBuyPrice * conditionMultiplier);

  return {
    min: Math.max(minVal, 10),
    max: Math.max(maxVal, 20),
    avg: Math.max(avgVal, 15),
    ratePerKg: priceRecord.prevailingBuyPrice
  };
};

const generateLotId = (district: string = 'LKO') => {
  const cleanDist = district.slice(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  const existingCount = db.lots.length + 101;
  const pad = String(existingCount).padStart(6, '0');
  return `EW-${cleanDist}-${year}-${pad}`;
};

export const createLot = async (req: AuthRequest, res: Response) => {
  try {
    const {
      clientLotId,
      materialCategory,
      subCategory = '',
      description = '',
      imageUrl = '',
      imageUrls = [],
      approxWeight,
      condition = 'INTACT',
      sourceType = 'HOUSEHOLD',
      locationDistrict = 'Lucknow',
      locationState = 'Uttar Pradesh',
      latitude,
      longitude,
      locationSource = 'DISTRICT_FALLBACK'
    } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required to create a lot.' });
    }

    if (!materialCategory || !approxWeight || Number(approxWeight) <= 0) {
      return res.status(400).json({ success: false, message: 'Material category and positive weight required.' });
    }

    const rawPhotoList = (Array.isArray(imageUrls) && imageUrls.length > 0)
      ? imageUrls
      : (Array.isArray(req.body.photoUrls) && req.body.photoUrls.length > 0)
        ? req.body.photoUrls
        : (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0 ? [imageUrl.trim()] : []);
    const photoUrls: string[] = rawPhotoList.filter((u: any) => typeof u === 'string' && u.trim().length > 0);
    const primaryImageUrl = photoUrls[0] || '';

    if (photoUrls.length === 0 || !primaryImageUrl) {
      return res.status(400).json({
        success: false,
        message: 'E-waste scrap photograph is required. Please capture or upload a clear photo of the material.'
      });
    }

    // Check idempotency if clientLotId provided
    if (clientLotId) {
      const existing = db.lots.find(l => l.clientLotId === clientLotId);
      if (existing) {
        return res.json({ success: true, message: 'Lot already synced', lot: existing, synced: true });
      }
    }

    const weightNum = parseFloat(approxWeight);
    const valuation = calculateEstimatedValue(materialCategory, weightNum, condition, locationDistrict);

    let collectorId = req.user.userId;
    let collectorName = req.user.name || 'Authorized Collector';
    let collectorPhone = req.user.phone || '';

    const colProfile = db.collectors.find(c => c.userId === req.user?.userId);
    if (colProfile) {
      collectorId = colProfile.id;
      collectorName = colProfile.name;
      collectorPhone = colProfile.phone;
    }

    const lotId = generateLotId(locationDistrict);
    const now = new Date().toISOString();

    const hasRealGps = typeof latitude === 'number' && typeof longitude === 'number';

    const newLot: Lot = {
      id: lotId,
      clientLotId,
      collectorId,
      collectorName,
      collectorPhone,
      materialCategory,
      subCategory: subCategory || `${materialCategory} Scrap Item`,
      description,
      imageUrl: primaryImageUrl,
      imageUrls: photoUrls,
      approxWeight: weightNum,
      condition,
      sourceType,
      locationDistrict,
      locationState,
      latitude: hasRealGps ? latitude : undefined,
      longitude: hasRealGps ? longitude : undefined,
      locationSource: hasRealGps ? 'DEVICE_GPS' : (locationSource || 'DISTRICT_FALLBACK'),
      estimatedValueMin: valuation.min,
      estimatedValueMax: valuation.max,
      estimatedValueAvg: valuation.avg,
      handoverOtp: Math.floor(1000 + Math.random() * 9000).toString(),
      status: 'CREATED',
      dataSource: 'LIVE',
      createdAt: now,
      updatedAt: now
    };

    db.lots.unshift(newLot);

    // Initial Traceability Record with reverse geocoding if GPS provided
    let locLabel = `${locationDistrict}, ${locationState}`;
    if (hasRealGps) {
      try {
        const geo = await geocodingService.reverseGeocode(latitude, longitude, locationDistrict);
        if (geo.locality) {
          locLabel = `${geo.locality}, ${locationDistrict}, ${locationState}`;
        }
      } catch (e) {
        // Graceful fallback to district name
      }
    }

    const traceLog: TraceabilityLog = {
      id: `tr_${Date.now()}`,
      lotId: newLot.id,
      stage: 'COLLECTED',
      title: 'Digital Lot Created & Cataloged',
      description: `Collector ${collectorName} registered ${weightNum} kg of ${materialCategory} (${condition.toLowerCase()} condition). Estimated market value: ₹${valuation.min} - ₹${valuation.max}.`,
      facilityLocation: locLabel,
      actorRole: 'COLLECTOR',
      actorName: collectorName,
      timestamp: now,
      proofUrl: newLot.imageUrl,
      dataSource: 'LIVE'
    };
    db.appendTraceabilityLog(traceLog);

    // Update collector profile stats
    const colProf = db.collectors.find(c => c.id === collectorId);
    if (colProf) {
      colProf.lotsCount += 1;
      colProf.totalWeightCollected += weightNum;
    }

    db.save();

    return res.status(201).json({
      success: true,
      message: `Lot ${newLot.id} created successfully`,
      lot: newLot,
      valuation
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to create lot', error: err.message });
  }
};

export const batchSyncLots = async (req: AuthRequest, res: Response) => {
  try {
    const { lots } = req.body;
    if (!Array.isArray(lots)) {
      return res.status(400).json({ success: false, message: 'Array of lots required.' });
    }

    const syncedLots: Lot[] = [];

    for (const lotData of lots) {
      const {
        clientLotId,
        materialCategory,
        subCategory,
        description,
        approxWeight,
        condition = 'INTACT',
        sourceType = 'HOUSEHOLD',
        locationDistrict = 'Lucknow',
        locationState = 'Uttar Pradesh',
        latitude,
        longitude,
        locationSource,
        imageUrl,
        imageUrls
      } = lotData;
      
      if (!materialCategory || !approxWeight) continue;

      // Idempotency check: avoid duplicate lot if clientLotId already synced
      const existing = db.lots.find(l => l.clientLotId === clientLotId);
      if (existing) {
        syncedLots.push(existing);
        continue;
      }

      const weightNum = parseFloat(approxWeight);
      const valuation = calculateEstimatedValue(materialCategory, weightNum, condition, locationDistrict);
      const lotId = generateLotId(locationDistrict);
      const now = new Date().toISOString();

      let collectorId = req.user?.userId || 'col_1';
      let collectorName = req.user?.name || 'Authorized Collector';
      let collectorPhone = req.user?.phone || '9876543210';
      if (req.user) {
        const col = db.collectors.find(c => c.userId === req.user?.userId);
        if (col) {
          collectorId = col.id;
          collectorName = col.name;
          collectorPhone = col.phone;
        } else {
          collectorId = req.user.userId;
          collectorName = req.user.name;
          collectorPhone = req.user.phone;
        }
      }

      const photoUrls: string[] = Array.isArray(imageUrls) && imageUrls.length > 0
        ? imageUrls.filter((u: any) => typeof u === 'string' && u.length > 0)
        : (imageUrl ? [imageUrl] : []);
      const primaryImageUrl = photoUrls[0] || imageUrl || '';

      const newLot: Lot = {
        id: lotId,
        clientLotId,
        collectorId,
        collectorName,
        collectorPhone,
        materialCategory,
        subCategory: subCategory || `${materialCategory} Scrap Item`,
        description: description || '',
        approxWeight: weightNum,
        condition,
        sourceType,
        locationDistrict,
        locationState,
        latitude: latitude ? parseFloat(String(latitude)) : undefined,
        longitude: longitude ? parseFloat(String(longitude)) : undefined,
        locationSource: (locationSource as LocationSource) || (latitude ? 'DEVICE_GPS' : 'OFFLINE_SAVED'),
        imageUrl: primaryImageUrl,
        imageUrls: photoUrls,
        status: 'CREATED',
        estimatedValueMin: valuation.min,
        estimatedValueMax: valuation.max,
        estimatedValueAvg: valuation.avg,
        handoverOtp: Math.floor(1000 + Math.random() * 9000).toString(),
        createdAt: now,
        updatedAt: now,
        dataSource: 'LIVE'
      };

      db.lots.push(newLot);

      db.appendTraceabilityLog({
        lotId: newLot.id,
        stage: 'COLLECTED',
        title: 'Offline Lot Synchronized with Cloud Server',
        description: `Lot recorded locally on collector device and successfully synced to national database.`,
        facilityLocation: `${locationDistrict}, ${locationState}`,
        actorRole: 'COLLECTOR',
        actorName: collectorName,
        timestamp: now,
        dataSource: 'LIVE'
      });

      syncedLots.push(newLot);
    }

    db.save();

    return res.json({
      success: true,
      message: `Successfully synchronized ${syncedLots.length} lots`,
      syncedCount: syncedLots.length,
      lots: syncedLots
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Batch sync failed', error: err.message });
  }
};

export const getLots = async (req: AuthRequest, res: Response) => {
  try {
    const { collectorId, status, materialCategory, district, search } = req.query;

    let results = [...db.lots];

    // IDOR protection & data isolation
    if (req.user && req.user.role === 'COLLECTOR') {
      const col = db.collectors.find(c => c.userId === req.user?.userId);
      const userColId = col ? col.id : req.user.userId;
      results = results.filter(l => l.collectorId === userColId);
    } else if (req.user && req.user.role === 'RECYCLER') {
      const rec = db.recyclers.find(r => r.userId === req.user?.userId || r.contactPhone === req.user?.phone) ||
                  db.recyclers.find(r => r.id === (req.user as any)?.recyclerId);
      const callerRecyclerId = rec ? rec.id : ((req.user as any)?.recyclerId || req.user.userId);

      // Reject query recyclerId mismatch with HTTP 403
      if (req.query.recyclerId && req.query.recyclerId !== callerRecyclerId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Cannot query lots of another recycler facility.'
        });
      }

      // Recyclers can see:
      // 1. Open market lots available for offers (CREATED, OFFER_RECEIVED, QUOTED) compatible with acceptedMaterials
      // 2. Lots specifically accepted by/assigned to THIS recycler
      // They MUST NOT see lots accepted/in-transit/recycled by competing recyclers!
      const closedStatuses = ['ACCEPTED', 'PICKUP_SCHEDULED', 'RECEIVED', 'PROCESSING', 'RECYCLED'];
      results = results.filter(l => {
        if (l.selectedRecyclerId) {
          return l.selectedRecyclerId === callerRecyclerId;
        }
        if (closedStatuses.includes(l.status)) {
          return false;
        }
        if (rec && Array.isArray(rec.acceptedMaterials) && rec.acceptedMaterials.length > 0) {
          return rec.acceptedMaterials.includes(l.materialCategory);
        }
        return true;
      });

      // Attach caller facility's active offer metadata to open lots for UI state synchronization
      results = results.map(l => {
        const myOffer = db.offers.find(o => o.lotId === l.id && o.recyclerId === callerRecyclerId && o.status !== 'REJECTED');
        return {
          ...l,
          myOffer: myOffer ? {
            id: myOffer.id,
            status: myOffer.status,
            offeredRatePerKg: myOffer.offeredRatePerKg,
            totalOfferedPrice: myOffer.totalOfferedPrice,
            pickupOffered: myOffer.pickupOffered,
            createdAt: myOffer.createdAt
          } : undefined
        };
      });
    } else if (collectorId) {
      results = results.filter(l => l.collectorId === collectorId);
    }

    if (status) {
      results = results.filter(l => l.status === status);
    }

    if (materialCategory) {
      results = results.filter(l => l.materialCategory === materialCategory);
    }

    if (district) {
      results = results.filter(l => l.locationDistrict.toLowerCase() === String(district).toLowerCase());
    }

    if (search) {
      const s = String(search).toLowerCase();
      results = results.filter(l => 
        l.id.toLowerCase().includes(s) ||
        l.materialCategory.toLowerCase().includes(s) ||
        l.description.toLowerCase().includes(s) ||
        l.collectorName.toLowerCase().includes(s)
      );
    }

    return res.json({
      success: true,
      count: results.length,
      lots: results
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch lots', error: err.message });
  }
};

export const getLotById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lot = db.lots.find(l => l.id.toLowerCase() === id.toLowerCase() || l.clientLotId === id);

    if (!lot) {
      return res.status(404).json({ success: false, message: `Lot ${id} not found.` });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
    }

    // Object-level authorization: If requester is authenticated as a collector, they can only view their own lots
    if (req.user.role === 'COLLECTOR') {
      const col = db.collectors.find(c => c.userId === req.user?.userId);
      const userColId = col ? col.id : req.user.userId;
      if (lot.collectorId !== userColId) {
        return res.status(403).json({ success: false, message: 'Forbidden: Access denied to another collector\'s private lot.' });
      }
    } else if (req.user.role === 'RECYCLER') {
      const rec = db.recyclers.find(r => r.userId === req.user?.userId || r.contactPhone === req.user?.phone) ||
                  db.recyclers.find(r => r.id === (req.user as any)?.recyclerId);
      const callerRecyclerId = rec ? rec.id : ((req.user as any)?.recyclerId || req.user.userId);

      // If lot is accepted by or assigned to another facility, reject access
      const closedStatuses = ['ACCEPTED', 'PICKUP_SCHEDULED', 'RECEIVED', 'PROCESSING', 'RECYCLED'];
      if (lot.selectedRecyclerId && lot.selectedRecyclerId !== callerRecyclerId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Access denied to another facility\'s accepted lot.'
        });
      }
      if (closedStatuses.includes(lot.status) && lot.selectedRecyclerId !== callerRecyclerId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: This lot has already been accepted by another facility.'
        });
      }
    }

    let offers = db.offers.filter(o => o.lotId === lot.id);
    let pickup = db.pickups.find(p => p.lotId === lot.id);
    let handover = db.handovers.find(h => h.lotId === lot.id);
    const traceability = db.traceabilityLogs
      .filter(t => t.lotId === lot.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Commercial confidentiality: A recycler should only see their own offers, not competing facilities' bids
    if (req.user.role === 'RECYCLER') {
      const rec = db.recyclers.find(r => r.userId === req.user?.userId || r.contactPhone === req.user?.phone) ||
                  db.recyclers.find(r => r.id === (req.user as any)?.recyclerId);
      const callerRecyclerId = rec ? rec.id : ((req.user as any)?.recyclerId || req.user.userId);

      offers = offers.filter(o => o.recyclerId === callerRecyclerId);
      if (pickup && pickup.recyclerId !== callerRecyclerId) pickup = undefined;
      if (handover && handover.recyclerId !== callerRecyclerId) handover = undefined;
    }

    return res.json({
      success: true,
      lot,
      offers,
      pickup,
      handover,
      traceability
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch lot details', error: err.message });
  }
};
