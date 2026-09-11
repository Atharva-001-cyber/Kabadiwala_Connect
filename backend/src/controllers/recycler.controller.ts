import { Request, Response } from 'express';
import { db } from '../db/store';
import { AuthRequest } from '../middleware/auth.middleware';
import { MaterialCategory, RecyclerAuthStatus, RecyclerRankingExplanation, PickupVsDeliveryEconomics } from '../types';

// Haversine formula to compute great-circle distance between two GPS coordinates
const calculateHaversineDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

export const getRecyclers = async (req: Request, res: Response) => {
  try {
    const {
      materialCategory,
      district,
      lotId,
      collectorLat,
      collectorLng,
      onlyAuthorized = 'true'
    } = req.query;

    let targetCategory = materialCategory as MaterialCategory | undefined;
    let targetWeight = 15; // default benchmark weight in kg for gross estimate if not given
    let cLat = collectorLat ? parseFloat(String(collectorLat)) : undefined;
    let cLng = collectorLng ? parseFloat(String(collectorLng)) : undefined;

    // If lotId is passed, use lot's category, weight, and coordinates if available
    if (lotId) {
      const lot = db.lots.find(l => l.id === lotId || l.clientLotId === lotId);
      if (lot) {
        if (!targetCategory) targetCategory = lot.materialCategory;
        if (lot.approxWeight) targetWeight = lot.approxWeight;
        if (!cLat && lot.latitude) cLat = lot.latitude;
        if (!cLng && lot.longitude) cLng = lot.longitude;
      }
    }

    let results = [...db.recyclers];

    // 1. Authorization Filter
    if (onlyAuthorized === 'true') {
      results = results.filter(
        r => r.authorizationStatus === 'AUTHORIZED' || r.authorizationStatus === 'CPCB_REGISTRY_VERIFIED'
      );
    }

    // 2. Strict Incompatible Recycler Exclusion
    if (targetCategory) {
      results = results.filter(r => r.acceptedMaterials.includes(targetCategory as MaterialCategory));
    }

    // 3. District Filter (if specified and not 'all')
    if (district && String(district).toLowerCase() !== 'all') {
      const targetDist = String(district).toLowerCase();
      results = results.filter(r => r.district.toLowerCase() === targetDist);
    }

    // If no compatible recyclers found after strict filtering, return honest empty state
    if (results.length === 0) {
      return res.json({
        success: true,
        count: 0,
        recyclers: [],
        message: targetCategory
          ? `No authorized recycler found accepting ${targetCategory} in the selected area.`
          : 'No authorized recyclers available.',
        method: 'EXPLAINABLE_MULTI_CRITERIA_SCORING'
      });
    }

    // 3. Compute benchmark prevailing rate for comparison
    const benchmarkPrice = targetCategory
      ? db.prices.find(p => p.materialCategory === targetCategory)?.prevailingBuyPrice || 80
      : 80;

    // 4. Multi-Criteria Decision Analysis (MCDA) Scoring & Ranking
    const matched = results.map(rec => {
      // Distance calculation
      let distanceKm = 6.5; // District centroid fallback
      let distanceSource: 'DEVICE_GPS' | 'DISTRICT_CENTROID' = 'DISTRICT_CENTROID';

      if (typeof cLat === 'number' && typeof cLng === 'number' && !isNaN(cLat) && !isNaN(cLng) && rec.latitude && rec.longitude) {
        distanceKm = calculateHaversineDistanceKm(cLat, cLng, rec.latitude, rec.longitude);
        distanceSource = 'DEVICE_GPS';
      } else if (district) {
        const isSameDistrict = rec.district.toLowerCase() === String(district).toLowerCase();
        distanceKm = isSameDistrict ? 6.5 : 42.0;
      }

      // Offered rate for target category
      const offeredRate = targetCategory
        ? (rec.baseOfferedRates[targetCategory] || benchmarkPrice)
        : (rec.baseOfferedRates['PCB'] || benchmarkPrice);

      const estimatedGrossValue = Math.round(targetWeight * offeredRate);

      // --- MCDA SCORING FACTORS (Total 100) ---
      // Factor 1: Material Compatibility (Max 30)
      const materialScore = targetCategory && rec.acceptedMaterials.includes(targetCategory) ? 30 : 15;

      // Factor 2: Authorization Level (Max 25)
      let authScore = 15;
      if (rec.authorizationSource === 'CPCB_GAZETTE_VERIFIED') {
        authScore = 25;
      } else if (rec.authorizationStatus === 'AUTHORIZED') {
        authScore = 20;
      } else if (rec.authorizationStatus === 'PENDING_VERIFICATION') {
        authScore = 5;
      }

      // Factor 3: Rate Competitiveness vs Benchmark (Max 20)
      const rateRatio = offeredRate / benchmarkPrice;
      let rateScore = 14;
      if (rateRatio >= 1.05) rateScore = 20;
      else if (rateRatio >= 1.0) rateScore = 18;
      else if (rateRatio >= 0.9) rateScore = 14;
      else rateScore = 8;

      // Factor 4: Logistics & Doorstep Collection (Max 15)
      const pickupScore = rec.pickupAvailable ? 15 : 7;

      // Factor 5: Distance & Service Area Proximity (Max 10)
      let distanceScore = 3;
      if (distanceKm <= 10) distanceScore = 10;
      else if (distanceKm <= 25) distanceScore = 8;
      else if (distanceKm <= 50) distanceScore = 5;

      const compositeScore = Math.min(
        100,
        materialScore + authScore + rateScore + pickupScore + distanceScore
      );

      // Localized explainable reasons
      const reasons = [
        {
          hi: `स्वीकृत सामग्री: ${targetCategory || 'ई-कचरा'} (+${materialScore} अंक)`,
          mr: `स्वीकृत साहित्य: ${targetCategory || 'ई-कचरा'} (+${materialScore} गुण)`,
          en: `Accepted Material: ${targetCategory || 'E-Waste'} (+${materialScore} pts)`
        },
        {
          hi: rec.authorizationSource === 'CPCB_GAZETTE_VERIFIED'
            ? 'केंद्रीय प्रदूषण नियंत्रण बोर्ड (CPCB) राष्ट्रीय राजपत्र सत्यापित (+25 अंक)'
            : 'राज्य प्रदूषण नियंत्रण बोर्ड अधिकृत केंद्र (+20 अंक)',
          mr: rec.authorizationSource === 'CPCB_GAZETTE_VERIFIED'
            ? 'केंद्रीय प्रदूषण नियंत्रण मंडळ (CPCB) राजपत्र सत्यापित (+25 गुण)'
            : 'प्रदूषण नियंत्रण मंडळ अधिकृत (+20 गुण)',
          en: rec.authorizationSource === 'CPCB_GAZETTE_VERIFIED'
            ? 'CPCB National Gazette Verified Facility (+25 pts)'
            : 'SPCB Platform Authorized Facility (+20 pts)'
        },
        {
          hi: `प्रतिस्पर्धी दर: ₹${offeredRate}/kg (मंडी बेंचमार्क ₹${benchmarkPrice}) (+${rateScore} अंक)`,
          mr: `स्पर्धात्मक दर: ₹${offeredRate}/किलो (मंडी भाव ₹${benchmarkPrice}) (+${rateScore} गुण)`,
          en: `Competitive Rate: ₹${offeredRate}/kg (Mandi benchmark ₹${benchmarkPrice}) (+${rateScore} pts)`
        },
        {
          hi: rec.pickupAvailable
            ? 'मुफ्त वाहन डोरस्टेप पिकअप उपलब्ध (+15 अंक)'
            : 'स्वयं डिलीवरी केंद्र (+7 अंक)',
          mr: rec.pickupAvailable
            ? 'मोफत डोअरस्टेप पिकअप उपलब्ध (+15 गुण)'
            : 'स्वतः डिलिव्हरी केंद्र (+7 गुण)',
          en: rec.pickupAvailable
            ? 'Free Doorstep Vehicle Collection (+15 pts)'
            : 'Facility Self-Delivery (+7 pts)'
        },
        {
          hi: `दूरी: ~${distanceKm} km (${distanceSource === 'DEVICE_GPS' ? 'डिवाइस GPS' : 'जिला केंद्र'}) (+${distanceScore} अंक)`,
          mr: `अंतर: ~${distanceKm} किमी (+${distanceScore} गुण)`,
          en: `Distance: ~${distanceKm} km (${distanceSource === 'DEVICE_GPS' ? 'Device GPS' : 'District Centroid'}) (+${distanceScore} pts)`
        }
      ];

      const rankingExplanation: RecyclerRankingExplanation = {
        materialScore,
        authScore,
        rateScore,
        pickupScore,
        distanceScore,
        compositeScore,
        method: 'EXPLAINABLE_MULTI_CRITERIA_SCORING',
        reasons
      };

      // Doorstep Pickup vs Self-Delivery Economics
      const pickupVsSelfDelivery: PickupVsDeliveryEconomics = {
        doorstepPickup: {
          available: rec.pickupAvailable,
          transportCostDeduction: 0,
          netRatePerKg: offeredRate,
          estimatedNetAmount: estimatedGrossValue,
          notice: rec.pickupAvailable
            ? 'मुफ्त डोरस्टेप पिकअप - वाहन खर्च रीसाइक्लर वहन करेगा (Zero Transport Deduction)'
            : 'इस केंद्र पर डोरस्टेप पिकअप उपलब्ध नहीं है'
        },
        selfDelivery: {
          available: true,
          transportCostDeduction: null, // Transparent: transport cost is NOT fabricated
          netRatePerKg: null,
          estimatedNetAmount: null,
          notice: 'परिवहन खर्च उपलब्ध नहीं - कृपया वाहन भाड़े हेतु रीसाइक्लर से पुष्टि करें (Transport cost not recorded)'
        }
      };

      return {
        ...rec,
        offeredRate,
        estimatedGrossValue,
        targetWeightKg: targetWeight,
        matchScore: compositeScore,
        estimatedDistanceKm: distanceKm,
        distanceSource,
        rankingExplanation,
        pickupVsSelfDelivery
      };
    });

    // Sort descending by matchScore (explainable ranking order)
    matched.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return res.json({
      success: true,
      count: matched.length,
      method: 'EXPLAINABLE_MULTI_CRITERIA_SCORING',
      materialCategory: targetCategory,
      district: district || 'All',
      recyclers: matched
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch recyclers', error: err.message });
  }
};

export const getRecyclerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recycler = db.recyclers.find(r => r.id === id || r.userId === id);

    if (!recycler) {
      return res.status(404).json({ success: false, message: 'Recycler not found' });
    }

    return res.json({
      success: true,
      recycler
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch recycler profile', error: err.message });
  }
};

export const searchCpcbRegistry = async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q || '').toLowerCase();
    const results = db.cpcbMasterRegistry.filter(r =>
      r.registrationNo.toLowerCase().includes(query) ||
      r.facilityName.toLowerCase().includes(query) ||
      r.district.toLowerCase().includes(query) ||
      r.state.toLowerCase().includes(query)
    );

    return res.json({
      success: true,
      count: results.length,
      gazetteSource: 'CPCB National Register of E-Waste Dismantlers & Recyclers (Schedule I, E-Waste Rules 2022)',
      records: results
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'CPCB registry search failed', error: err.message });
  }
};

export const updateRecyclerAuthStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { authorizationStatus, authValidUntil, registrationNo } = req.body;

    const recycler = db.recyclers.find(r => r.id === id || r.userId === id || r.contactPhone === id || r.registrationNo === id);
    if (!recycler) {
      return res.status(404).json({ success: false, message: 'Recycler not found' });
    }

    if (registrationNo) {
      recycler.registrationNo = registrationNo;
    }

    // Automated CPCB Gazette Cross-Referencing
    const gazetteMatch = db.cpcbMasterRegistry.find(
      g => g.registrationNo.trim().toLowerCase() === recycler.registrationNo.trim().toLowerCase()
    );

    if (authorizationStatus === 'SUSPENDED') {
      recycler.authorizationStatus = 'SUSPENDED';
      recycler.authorizationSource = 'PLATFORM_MANAGED';
    } else if (authorizationStatus === 'AUTHORIZED') {
      recycler.authorizationStatus = 'AUTHORIZED';
      recycler.authorizationSource = gazetteMatch ? 'CPCB_GAZETTE_VERIFIED' : 'PLATFORM_MANAGED';
      if (gazetteMatch) {
        recycler.authValidUntil = gazetteMatch.validUntil;
      }
    } else if (gazetteMatch) {
      recycler.authorizationSource = 'CPCB_GAZETTE_VERIFIED';
      recycler.authorizationStatus = 'AUTHORIZED';
      recycler.authValidUntil = gazetteMatch.validUntil;
    } else {
      recycler.authorizationSource = 'PLATFORM_MANAGED';
      if (authorizationStatus) {
        recycler.authorizationStatus = authorizationStatus as RecyclerAuthStatus;
      }
      if (authValidUntil) {
        recycler.authValidUntil = authValidUntil;
      }
    }

    db.save();

    return res.json({
      success: true,
      message: `Recycler authorization updated to ${recycler.authorizationStatus} (${recycler.authorizationSource})`,
      recycler,
      isGazetteVerified: !!gazetteMatch
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update recycler status', error: err.message });
  }
};
