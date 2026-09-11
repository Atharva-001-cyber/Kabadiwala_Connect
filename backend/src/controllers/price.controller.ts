import { Request, Response } from 'express';
import { store } from '../db/store';
import { MaterialCategory, PriceRecord, PriceLogEntry } from '../types';
import { calculateEstimatedValue } from './lot.controller';

const DISTRICT_STATE_MAP: Record<string, string> = {
  'lucknow': 'Uttar Pradesh',
  'pune': 'Maharashtra',
  'nagpur': 'Maharashtra',
  'delhi ncr': 'Delhi / NCR',
  'delhi': 'Delhi / NCR',
  'bengaluru': 'Karnataka',
  'bangalore': 'Karnataka',
  'mumbai': 'Maharashtra'
};

export const getPriceBoard = async (req: Request, res: Response) => {
  try {
    const district = (req.query.district as string) || 'Lucknow';
    const normalizedDistrict = district.trim();
    const targetState = DISTRICT_STATE_MAP[normalizedDistrict.toLowerCase()] || 'Uttar Pradesh';
    
    // Filter prices for the district, fallback to Lucknow if not found
    let districtPrices = store.prices.filter(
      p => p.district.toLowerCase() === normalizedDistrict.toLowerCase()
    );

    if (districtPrices.length === 0) {
      districtPrices = store.prices.filter(
        p => p.district.toLowerCase() === 'lucknow'
      );
    }

    // Prepare multi-lingual speech audio text templates for each price
    const enrichedPrices = districtPrices.map(p => {
      const catHiNames: Record<string, string> = {
        PCB: 'पीसीबी सर्किट बोर्ड',
        BATTERY: 'बैटरी',
        CRT: 'सीआरटी टीवी मॉनिटर',
        LCD: 'एलसीडी स्क्रीन',
        CABLE: 'तांबे का तार',
        MOTOR: 'मोटर एवं कंप्रेसर',
        MAGNET: 'चुंबक एवं स्पीकर',
        MIXED_PLASTIC: 'ई-कचरा प्लास्टिक'
      };

      const catMrNames: Record<string, string> = {
        PCB: 'पीसीबी सर्किट बोर्ड',
        BATTERY: 'बॅटरी',
        CRT: 'सीआरटी मॉनिटर',
        LCD: 'एलसीडी स्क्रीन',
        CABLE: 'तांब्याची वायर',
        MOTOR: 'मोटर',
        MAGNET: 'चुंबक',
        MIXED_PLASTIC: 'प्लॅस्टिक'
      };

      const hiName = catHiNames[p.materialCategory] || p.materialCategory;
      const mrName = catMrNames[p.materialCategory] || p.materialCategory;

      const audioText = {
        hi: `${hiName} का आज का बेंचमार्क भाव ${p.prevailingBuyPrice} रुपये प्रति kg है। भाव ${p.trend === 'UP' ? 'बढ़ रहा है' : p.trend === 'DOWN' ? 'घट रहा है' : 'स्थिर है'}।`,
        mr: `${mrName} चा आजचा बेंचमार्क भाव ${p.prevailingBuyPrice} रुपये प्रति किलो आहे. भाव ${p.trend === 'UP' ? 'वाढत आहे' : p.trend === 'DOWN' ? 'कमी होत आहे' : 'स्थिर आहे'}।`,
        en: `Today's benchmark price for ${p.materialCategory} in ${normalizedDistrict} is ${p.prevailingBuyPrice} rupees per kilogram. Market trend is ${p.trend.toLowerCase()}.`
      };

      return {
        ...p,
        district: normalizedDistrict,
        state: targetState,
        audioText
      };
    });

    res.json({
      success: true,
      district,
      count: enrichedPrices.length,
      prices: enrichedPrices,
      provenance: {
        totalRealPriceLogs: store.priceHistoryLog.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPriceHistory = async (req: Request, res: Response) => {
  try {
    const category = (req.query.category as MaterialCategory) || 'PCB';
    const district = (req.query.district as string) || 'Lucknow';

    const baseRecord = store.prices.find(
      p => p.materialCategory === category && p.district.toLowerCase() === district.toLowerCase()
    ) || store.prices.find(p => p.materialCategory === category);

    const basePrice = baseRecord ? baseRecord.prevailingBuyPrice : 95;

    // Filter real persisted price observations from store
    const realLogs = store.priceHistoryLog.filter(
      l => l.materialCategory === category && l.district.toLowerCase() === district.toLowerCase()
    );

    if (realLogs.length > 0) {
      // Sort chronologically
      const sortedLogs = [...realLogs].sort(
        (a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()
      );

      const firstPrice = sortedLogs[0].ratePerKg;
      const latestPrice = sortedLogs[sortedLogs.length - 1].ratePerKg;
      const diffPercent = Number((((latestPrice - firstPrice) / firstPrice) * 100).toFixed(1));
      const trend = diffPercent > 0.5 ? 'UP' : diffPercent < -0.5 ? 'DOWN' : 'STABLE';

      const history = sortedLogs.map(l => ({
        id: l.id,
        date: l.observedAt.split('T')[0],
        price: l.ratePerKg,
        unit: '₹/kg',
        sourceType: l.sourceType,
        source: l.source,
        dataSource: l.dataSource || 'LIVE',
        validationStatus: l.validationStatus || 'VERIFIED',
        isSynthetic: false
      }));

      return res.json({
        success: true,
        category,
        district,
        basePrice,
        isSynthetic: false,
        dataSource: 'LIVE',
        observedTrend: trend,
        trendPercent: diffPercent,
        hasSufficientData: true,
        dataPoints: history.length,
        history
      });
    }

    // Honest insufficient data - ZERO mathematical sine wave synthesis
    return res.json({
      success: true,
      category,
      district,
      basePrice,
      isSynthetic: false,
      dataSource: 'INSUFFICIENT_DATA',
      observedTrend: 'INSUFFICIENT_DATA',
      trendPercent: 0,
      hasSufficientData: false,
      dataPoints: 0,
      history: []
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateObservedPrice = async (req: Request, res: Response) => {
  try {
    const {
      materialCategory,
      subCategory,
      district,
      state,
      ratePerKg,
      source,
      sourceType
    } = req.body;

    if (!materialCategory || !ratePerKg || !district) {
      return res.status(400).json({ success: false, message: 'Missing required price fields.' });
    }

    const now = new Date().toISOString();
    const cleanRate = parseFloat(ratePerKg);

    // Multi-tier validation against existing district benchmark
    const benchmarkRecord = store.prices.find(
      p => p.materialCategory === materialCategory && p.district.toLowerCase() === district.toLowerCase()
    );
    const benchmarkRate = benchmarkRecord ? benchmarkRecord.prevailingBuyPrice : 95;
    const deviationPercent = Math.abs((cleanRate - benchmarkRate) / benchmarkRate) * 100;

    let validationStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED' = 'VERIFIED';

    if (deviationPercent > 40) {
      validationStatus = 'PENDING_REVIEW';
      store.anomalies.push({
        id: `anom_price_${Date.now()}`,
        lotId: 'PRICE_UPDATE',
        collectorId: 'OPERATOR_OBSERVED',
        anomalyType: 'PRICE_OUTLIER',
        severity: deviationPercent > 70 ? 'HIGH' : 'MEDIUM',
        description: `Observed rate ₹${cleanRate}/kg for ${materialCategory} in ${district} deviates by ${deviationPercent.toFixed(1)}% from benchmark (₹${benchmarkRate}/kg). Held for administrative review.`,
        detectedRate: cleanRate,
        expectedRate: benchmarkRate,
        status: 'OPEN',
        createdAt: now
      });
    }

    // 1. Log real observation
    const logEntry: PriceLogEntry = {
      id: `plog_${Date.now()}`,
      materialCategory,
      subCategory: subCategory || 'Observed Scrap Lot',
      district,
      state: state || 'Uttar Pradesh',
      ratePerKg: cleanRate,
      source: source || 'Verified Operator Observation',
      sourceType: sourceType || 'ADMIN_BENCHMARK',
      dataSource: 'LIVE',
      validationStatus,
      observedAt: now
    };

    store.priceHistoryLog.push(logEntry);

    // 2. Update or insert into active price board only if verified or admin
    if (validationStatus === 'VERIFIED') {
      const existingIndex = store.prices.findIndex(
        p => p.materialCategory === materialCategory && p.district.toLowerCase() === district.toLowerCase()
      );

      if (existingIndex >= 0) {
        const prev = store.prices[existingIndex];
        const diffPercent = prev.prevailingBuyPrice > 0 
          ? ((cleanRate - prev.prevailingBuyPrice) / prev.prevailingBuyPrice) * 100 
          : 0;

        store.prices[existingIndex] = {
          ...prev,
          prevailingBuyPrice: cleanRate,
          minPrice: Math.round(cleanRate * 0.9),
          maxPrice: Math.round(cleanRate * 1.1),
          priceChange7DaysPercent: parseFloat(diffPercent.toFixed(1)),
          trend: cleanRate > prev.prevailingBuyPrice ? 'UP' : cleanRate < prev.prevailingBuyPrice ? 'DOWN' : 'STABLE',
          source: source || 'Live Verified Submission',
          sourceType: sourceType || 'ADMIN_BENCHMARK',
          dataSource: 'LIVE',
          updatedAt: now
        };
      } else {
        store.prices.push({
          id: `pr_${Date.now()}`,
          materialCategory,
          subCategory: subCategory || 'Verified Grade',
          district,
          state: state || 'Uttar Pradesh',
          prevailingBuyPrice: cleanRate,
          minPrice: Math.round(cleanRate * 0.9),
          maxPrice: Math.round(cleanRate * 1.1),
          priceChange7DaysPercent: 0,
          trend: 'STABLE',
          unit: '₹/kg',
          source: source || 'Live Verified Submission',
          sourceType: sourceType || 'ADMIN_BENCHMARK',
          dataSource: 'LIVE',
          updatedAt: now
        });
      }
    }

    store.save();

    res.json({
      success: true,
      message: `Price for ${materialCategory} in ${district} updated to ₹${cleanRate}/kg.`,
      logEntry
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const estimateLotValue = async (req: Request, res: Response) => {
  try {
    const { materialCategory, weight, condition = 'INTACT', district = 'Lucknow' } = req.body;
    if (!materialCategory || !weight || Number(weight) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid material category and positive weight required.' });
    }

    const weightNum = parseFloat(weight);
    const valuation = calculateEstimatedValue(materialCategory, weightNum, condition, district);

    // Concept B: Recycler Quoted Price (Genuine active recycler bids on platform)
    const activeOffers = store.offers.filter(o => {
      const lot = store.lots.find(l => l.id === o.lotId);
      return lot && lot.materialCategory === materialCategory;
    });

    const highestOffer = activeOffers.length > 0
      ? activeOffers.reduce((max, o) => o.offeredRatePerKg > max.offeredRatePerKg ? o : max, activeOffers[0])
      : null;

    // Concept C: Final Sale Value (Recent verified electronic scale settlements)
    const settledPayments = store.payments.filter(p => p.materialCategory === materialCategory && p.status === 'PAID');
    const latestSettled = settledPayments.length > 0 ? settledPayments[settledPayments.length - 1] : null;

    res.json({
      success: true,
      materialCategory,
      weight: weightNum,
      condition,
      district,
      // Stage 1: Estimated Value (Pre-buyer calculation)
      estimatedValue: {
        min: valuation.min,
        max: valuation.max,
        avg: valuation.avg,
        ratePerKg: valuation.ratePerKg,
        formula: `${weightNum} kg × ₹${valuation.ratePerKg}/kg × ${condition === 'DAMAGED' ? '0.85' : condition === 'DISMANTLED' ? '0.75' : '1.0'}`
      },
      // Stage 2: Recycler Quoted Price (Actual formal bids)
      recyclerQuotedPrice: highestOffer ? {
        offerId: highestOffer.id,
        offeredRatePerKg: highestOffer.offeredRatePerKg,
        totalQuotedAmount: Math.round(highestOffer.offeredRatePerKg * weightNum),
        recyclerName: highestOffer.recyclerName,
        status: highestOffer.status
      } : null,
      // Stage 3: Final Sale Value (Actual weighbridge verified payout)
      finalSaleBenchmark: latestSettled ? {
        settledAmount: latestSettled.amount,
        settledWeight: latestSettled.weight,
        effectiveRatePerKg: latestSettled.ratePerKg,
        transactionRef: latestSettled.transactionRef,
        timestamp: latestSettled.timestamp
      } : null,
      disclaimer: {
        hi: 'यह केवल प्रारंभिक अनुमानित मूल्य है, पक्का बिक्री भाव नहीं। वास्तविक भुगतान अधिकृत रीसाइक्लर के डिजिटल कांटे पर वजन सत्यापित होने के बाद होगा।',
        mr: 'हे केवळ अंदाजे मूल्य आहे, अंतिम विक्री किंमत नाही. प्रत्यक्ष डिजिटल काट्यावर वजन झाल्यावरच अंतिम रक्कम दिली जाईल.',
        en: 'This is an estimate only, not a guaranteed final sale price. Final settlement is confirmed after weighing on a calibrated digital scale.'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
