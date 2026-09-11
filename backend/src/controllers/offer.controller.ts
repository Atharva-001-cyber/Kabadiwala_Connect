import { Request, Response } from 'express';
import { db } from '../db/store';
import { AuthRequest } from '../middleware/auth.middleware';
import { Offer, AnomalyFlag } from '../types';

export const createOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { lotId, offeredRatePerKg, pickupOffered = true, pickupEtaHours = 24, notes = '' } = req.body;

    const lot = db.lots.find(l => l.id === lotId);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found' });
    }

    if (!req.user || (req.user.role !== 'RECYCLER' && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only authenticated recyclers can submit offers.' });
    }

    const rec = db.recyclers.find(r => r.userId === req.user?.userId || r.contactPhone === req.user?.phone) ||
                db.recyclers.find(r => r.id === (req.user as any)?.recyclerId);
    if (!rec) {
      return res.status(403).json({ success: false, message: 'Recycler profile not found for this account.' });
    }

    if (rec.authorizationStatus === 'PENDING_VERIFICATION') {
      return res.status(403).json({
        success: false,
        authorizationStatus: 'PENDING_VERIFICATION',
        message: 'Facility authorization is pending CPCB/SPCB regulatory verification. Formal purchase offers are restricted.'
      });
    }

    if (rec.authorizationStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        authorizationStatus: 'SUSPENDED',
        message: 'Facility authorization has been suspended by regulatory authority. Bidding is blocked.'
      });
    }

    // Reject IDOR injection: If client supplies a recyclerId that does not match authenticated identity
    if (req.body.recyclerId && req.body.recyclerId !== rec.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: recyclerId mismatch with authenticated identity.'
      });
    }

    // Business validation: Lots that are already accepted, in-transit, or recycled cannot receive new offers
    const openStatuses = ['CREATED', 'OFFER_RECEIVED', 'QUOTED'];
    if (!openStatuses.includes(lot.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot submit offer: lot is already ${lot.status}`
      });
    }

    // Material compatibility: Recycler can only offer on accepted scrap categories
    if (Array.isArray(rec.acceptedMaterials) && rec.acceptedMaterials.length > 0 && !rec.acceptedMaterials.includes(lot.materialCategory)) {
      return res.status(400).json({
        success: false,
        message: `Incompatible Facility: Your facility is not authorized or equipped to process ${lot.materialCategory}.`
      });
    }

    // Duplicate check: Prevent duplicate pending offers by the same facility on the same lot
    const existingOffer = db.offers.find(o => o.lotId === lot.id && o.recyclerId === rec.id && o.status === 'PENDING');
    if (existingOffer) {
      return res.status(400).json({
        success: false,
        message: 'An active pending offer from your facility already exists for this lot.'
      });
    }

    const recyclerId = rec.id;
    const recyclerName = rec.facilityName;
    const recyclerDistrict = rec.district;
    const recyclerPhone = rec.contactPhone;

    const rateNum = parseFloat(offeredRatePerKg);
    const totalOffered = Math.round(rateNum * lot.approxWeight);

    const newOffer: Offer = {
      id: `off_${Date.now()}`,
      lotId: lot.id,
      recyclerId,
      recyclerName,
      recyclerDistrict,
      recyclerPhone,
      offeredRatePerKg: rateNum,
      totalOfferedPrice: totalOffered,
      pickupOffered,
      pickupEtaHours,
      notes,
      status: 'PENDING',
      dataSource: 'LIVE',
      createdAt: new Date().toISOString()
    };

    db.offers.push(newOffer);

    // Update lot status if it was CREATED
    if (lot.status === 'CREATED') {
      lot.status = 'OFFER_RECEIVED';
      lot.quotedPrice = totalOffered;
      lot.updatedAt = new Date().toISOString();
    }

    // Append Cryptographic Traceability Event
    db.appendTraceabilityLog({
      lotId: lot.id,
      stage: 'COLLECTED',
      title: 'Recycler Submitted Formal Purchase Offer',
      description: `Formal quote of ₹${rateNum}/kg (Total ₹${totalOffered}) submitted by registered facility ${recyclerName}.`,
      facilityLocation: `${recyclerDistrict}`,
      actorRole: 'RECYCLER',
      actorName: recyclerName,
      timestamp: new Date().toISOString(),
      dataSource: 'LIVE'
    });

    // AI/Rule Anomaly Check: Outlier price detection
    const baselinePrice = db.prices.find(p => p.materialCategory === lot.materialCategory)?.prevailingBuyPrice || 70;
    if (rateNum < baselinePrice * 0.5 || rateNum > baselinePrice * 2.0) {
      const anomaly: AnomalyFlag = {
        id: `anom_${Date.now()}`,
        lotId: lot.id,
        collectorId: lot.collectorId,
        recyclerId,
        anomalyType: 'PRICE_OUTLIER',
        severity: rateNum < baselinePrice * 0.4 ? 'HIGH' : 'MEDIUM',
        description: `Offered rate of ₹${rateNum}/kg deviates significantly from prevailing rate of ₹${baselinePrice}/kg.`,
        detectedRate: rateNum,
        expectedRate: baselinePrice,
        status: 'OPEN',
        createdAt: new Date().toISOString()
      };
      db.anomalies.push(anomaly);
    }

    db.save();

    return res.status(201).json({
      success: true,
      message: 'Offer submitted successfully to collector',
      offer: newOffer
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to create offer', error: err.message });
  }
};

export const acceptOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const offer = db.offers.find(o => o.id === id);

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    const lot = db.lots.find(l => l.id === offer.lotId);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Associated lot not found' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // IDOR protection: Collectors can only accept offers for lots they own
    if (req.user.role === 'COLLECTOR') {
      const col = db.collectors.find(c => c.userId === req.user?.userId);
      const userColId = col ? col.id : req.user.userId;
      if (lot.collectorId !== userColId) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only accept offers for your own lots.' });
      }
    }

    // Validate that the lot is currently open for bidding
    const openStatuses = ['CREATED', 'OFFER_RECEIVED', 'QUOTED'];
    if (!openStatuses.includes(lot.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot accept offer: lot is already in '${lot.status}' status.`
      });
    }

    // Validate that the offer itself is currently PENDING
    if (offer.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept offer: offer is already '${offer.status}'.`
      });
    }

    offer.status = 'ACCEPTED';
    lot.status = 'ACCEPTED';
    lot.selectedRecyclerId = offer.recyclerId;
    lot.selectedOfferId = offer.id;
    lot.quotedPrice = offer.totalOfferedPrice;
    lot.updatedAt = new Date().toISOString();

    // Reject other pending offers for this lot
    db.offers.forEach(o => {
      if (o.lotId === lot.id && o.id !== offer.id) {
        o.status = 'REJECTED';
      }
    });

    // Add Traceability Log
    db.appendTraceabilityLog({
      lotId: lot.id,
      stage: 'COLLECTED',
      title: 'Collector Accepted Recycler Offer',
      description: `Offer from ${offer.recyclerName} accepted at ₹${offer.offeredRatePerKg}/kg (Total ₹${offer.totalOfferedPrice}). Doorstep pickup requested.`,
      facilityLocation: `${lot.locationDistrict}, ${lot.locationState}`,
      actorRole: 'COLLECTOR',
      actorName: lot.collectorName,
      timestamp: new Date().toISOString(),
      dataSource: 'LIVE'
    });

    db.save();

    return res.json({
      success: true,
      message: 'Offer accepted! Recycler will schedule doorstep collection.',
      lot,
      offer
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to accept offer', error: err.message });
  }
};

export const requestRecyclerQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { lotId, recyclerId } = req.body;

    if (!lotId || !recyclerId) {
      return res.status(400).json({ success: false, message: 'lotId and recyclerId are required.' });
    }

    const lot = db.lots.find(l => l.id === lotId || l.clientLotId === lotId);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found.' });
    }

    // Reject quotes on closed or accepted lots
    const closedStatuses = ['ACCEPTED', 'PICKUP_SCHEDULED', 'RECEIVED', 'PROCESSING', 'RECYCLED'];
    if (closedStatuses.includes(lot.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request quotes on an already accepted or closed lot.'
      });
    }

    if (req.user && req.user.role === 'COLLECTOR') {
      const col = db.collectors.find(c => c.userId === req.user?.userId);
      const userColId = col ? col.id : req.user.userId;
      if (lot.collectorId !== userColId) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only request quotes for your own lots.' });
      }
    }

    const recycler = db.recyclers.find(r => r.id === recyclerId);
    if (!recycler) {
      return res.status(404).json({ success: false, message: 'Recycler not found.' });
    }

    // Authorization check: only authorized facilities can provide quotes
    if (recycler.authorizationStatus !== 'AUTHORIZED' && recycler.authorizationStatus !== 'CPCB_REGISTRY_VERIFIED') {
      return res.status(403).json({
        success: false,
        message: `Operation restricted: ${recycler.facilityName} is not authorized for formal commercial operations.`
      });
    }

    // Incompatible material check
    if (!recycler.acceptedMaterials.includes(lot.materialCategory)) {
      return res.status(400).json({
        success: false,
        message: `Incompatible Facility: ${recycler.facilityName} does not accept ${lot.materialCategory}.`
      });
    }

    // Idempotency: Return existing pending/accepted offer if already present
    const existingOffer = db.offers.find(
      o => o.lotId === lot.id && o.recyclerId === recycler.id && (o.status === 'PENDING' || o.status === 'ACCEPTED')
    );
    if (existingOffer) {
      return res.json({
        success: true,
        message: 'Existing formal offer retrieved from facility.',
        offer: existingOffer,
        isExisting: true
      });
    }

    const rateNum = recycler.baseOfferedRates[lot.materialCategory] || 85;
    const totalOffered = Math.round(rateNum * lot.approxWeight);

    const newOffer: Offer = {
      id: `off_${Date.now()}`,
      lotId: lot.id,
      recyclerId: recycler.id,
      recyclerName: recycler.facilityName,
      recyclerDistrict: recycler.district,
      recyclerPhone: recycler.contactPhone,
      offeredRatePerKg: rateNum,
      totalOfferedPrice: totalOffered,
      pickupOffered: recycler.pickupAvailable,
      pickupEtaHours: 24,
      notes: `Official quote from CPCB registered facility for ${lot.materialCategory}. Free doorstep collection available: ${recycler.pickupAvailable ? 'Yes' : 'No'}.`,
      status: 'PENDING',
      dataSource: 'LIVE',
      createdAt: new Date().toISOString()
    };

    db.offers.push(newOffer);

    if (lot.status === 'CREATED') {
      lot.status = 'OFFER_RECEIVED';
      lot.quotedPrice = totalOffered;
      lot.updatedAt = new Date().toISOString();
    }

    // Append Cryptographic Traceability Event
    db.appendTraceabilityLog({
      lotId: lot.id,
      stage: 'COLLECTED',
      title: 'Collector Requested Direct Recycler Quote',
      description: `Collector requested direct quote from ${recycler.facilityName}. Formal purchase bid created at ₹${rateNum}/kg (Total ₹${totalOffered}).`,
      facilityLocation: `${recycler.district}, ${recycler.state}`,
      actorRole: 'COLLECTOR',
      actorName: lot.collectorName,
      timestamp: new Date().toISOString(),
      dataSource: 'LIVE'
    });

    db.save();

    return res.status(201).json({
      success: true,
      message: `Formal quote of ₹${rateNum}/kg generated from ${recycler.facilityName}`,
      offer: newOffer,
      isExisting: false
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to request quote', error: err.message });
  }
};

export const compareOffersForLot = async (req: Request, res: Response) => {
  try {
    const { lotId } = req.params;

    const lot = db.lots.find(l => l.id === lotId || l.clientLotId === lotId);
    if (!lot) {
      return res.status(404).json({ success: false, message: `Lot ${lotId} not found.` });
    }

    const offers = db.offers.filter(o => o.lotId === lot.id);

    // Find best price and fastest pickup offers
    let bestPriceOffer: Offer | undefined;
    let fastestPickupOffer: Offer | undefined;

    if (offers.length > 0) {
      bestPriceOffer = [...offers].sort((a, b) => b.offeredRatePerKg - a.offeredRatePerKg)[0];
      fastestPickupOffer = [...offers]
        .filter(o => o.pickupOffered)
        .sort((a, b) => (a.pickupEtaHours || 99) - (b.pickupEtaHours || 99))[0];
    }

    const formattedOffers = offers.map(o => {
      const rec = db.recyclers.find(r => r.id === o.recyclerId);
      return {
        ...o,
        authorizationSource: rec?.authorizationSource || 'PLATFORM_MANAGED',
        authorizationStatus: rec?.authorizationStatus || 'AUTHORIZED',
        registrationNo: rec?.registrationNo || 'N/A',
        rating: rec?.rating || 4.5,
        serviceRadiusKm: rec?.serviceRadiusKm || 40,
        isBestPrice: bestPriceOffer ? o.id === bestPriceOffer.id : false,
        isFastestPickup: fastestPickupOffer ? o.id === fastestPickupOffer.id : false,
        pickupVsDelivery: {
          doorstepPickup: {
            available: o.pickupOffered,
            transportCostDeduction: 0,
            netPayout: o.totalOfferedPrice,
            notice: o.pickupOffered
              ? 'मुफ्त वाहन पिकअप - कोई कटौती नहीं (Zero Transport Cost)'
              : 'इस ऑफर में डोरस्टेप पिकअप शामिल नहीं है'
          },
          selfDelivery: {
            available: true,
            transportCostDeduction: null, // Zero fabrication: transport cost is unknown
            netPayout: null,
            notice: 'परिवहन खर्च उपलब्ध नहीं - कृपया वाहन भाड़े हेतु रीसाइक्लर से पुष्टि करें (Transport cost not recorded)'
          }
        }
      };
    });

    return res.json({
      success: true,
      lot: {
        id: lot.id,
        materialCategory: lot.materialCategory,
        subCategory: lot.subCategory,
        approxWeight: lot.approxWeight,
        condition: lot.condition,
        estimatedValueMin: lot.estimatedValueMin,
        estimatedValueMax: lot.estimatedValueMax,
        estimatedValueAvg: lot.estimatedValueAvg,
        status: lot.status,
        imageUrl: lot.imageUrl,
        district: lot.locationDistrict,
        state: lot.locationState,
        selectedRecyclerId: lot.selectedRecyclerId,
        selectedOfferId: lot.selectedOfferId
      },
      offersCount: formattedOffers.length,
      offers: formattedOffers,
      priceConceptNotice: {
        hi: 'चरण 1: अनुमानित मूल्य (मंडी बेंचमार्क) -> चरण 2: रीसाइक्लर का कोटेड ऑफर (निश्चित बोली) -> चरण 3: वास्तविक बिक्री मूल्य (डिजिटल कांटे पर तौल के बाद अंतिम भुगतान)',
        mr: 'टप्पा 1: अंदाजे मूल्य -> टप्पा 2: रिसायकलर कोटेड ऑफर -> टप्पा 3: प्रत्यक्ष विक्री मूल्य (डिजिटल वजन काट्यावर)',
        en: 'Stage A: Estimated Value (Mandi Benchmark) -> Stage B: Recycler Quoted Price (Binding Bid) -> Stage C: Final Sale Value (Electronic Weighbridge Handover)'
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to compare offers', error: err.message });
  }
};
