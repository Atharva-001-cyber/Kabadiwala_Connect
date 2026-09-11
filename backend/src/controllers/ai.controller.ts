import { Request, Response } from 'express';
import { MaterialCategory, MLTrainingSample } from '../types';
import { store } from '../db/store';

export const classifyImage = async (req: Request, res: Response) => {
  try {
    const filename = (req.file?.originalname || req.body.imageName || '').toLowerCase();
    
    // Transparent Heuristic Simulation based on keywords & image characteristics
    let predictedCategory: MaterialCategory = 'PCB';
    let confidence = 0.88;

    if (filename.includes('pcb') || filename.includes('board') || filename.includes('circuit') || filename.includes('motherboard')) {
      predictedCategory = 'PCB';
      confidence = 0.94;
    } else if (filename.includes('battery') || filename.includes('cell') || filename.includes('li-ion')) {
      predictedCategory = 'BATTERY';
      confidence = 0.92;
    } else if (filename.includes('crt') || filename.includes('tube') || filename.includes('tv')) {
      predictedCategory = 'CRT';
      confidence = 0.96;
    } else if (filename.includes('lcd') || filename.includes('screen') || filename.includes('display') || filename.includes('monitor')) {
      predictedCategory = 'LCD';
      confidence = 0.91;
    } else if (filename.includes('cable') || filename.includes('wire') || filename.includes('copper')) {
      predictedCategory = 'CABLE';
      confidence = 0.95;
    } else if (filename.includes('motor') || filename.includes('compressor') || filename.includes('winding')) {
      predictedCategory = 'MOTOR';
      confidence = 0.89;
    } else if (filename.includes('magnet') || filename.includes('speaker') || filename.includes('neodymium')) {
      predictedCategory = 'MAGNET';
      confidence = 0.87;
    } else if (filename.includes('plastic') || filename.includes('casing') || filename.includes('body')) {
      predictedCategory = 'MIXED_PLASTIC';
      confidence = 0.85;
    } else {
      // Deterministic cycle among standard categories for demo
      const categories: MaterialCategory[] = ['PCB', 'BATTERY', 'CABLE', 'MOTOR', 'LCD'];
      predictedCategory = categories[filename.length % categories.length];
      confidence = 0.86;
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    res.json({
      success: true,
      imageUrl: fileUrl,
      classification: {
        category: predictedCategory,
        confidence,
        confidencePercent: Math.round(confidence * 100),
        engine: 'RULE_BASED_HEURISTIC_FALLBACK',
        modelReady: false,
        requiresHumanConfirmation: true,
        disclaimer: 'Prototype Heuristic Fallback: Not an onboard deep neural net. Collector manual confirmation is required.'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordMLFeedback = async (req: Request, res: Response) => {
  try {
    const {
      lotId,
      imagePath,
      initialHeuristicPrediction,
      userConfirmedCategory,
      collectorId,
      district
    } = req.body;

    if (!userConfirmedCategory || !imagePath) {
      return res.status(400).json({ success: false, message: 'Missing required training feedback fields.' });
    }

    const isOverride = initialHeuristicPrediction !== userConfirmedCategory;

    const sample: MLTrainingSample = {
      id: `sample_${Date.now()}`,
      lotId,
      imagePath,
      initialHeuristicPrediction: initialHeuristicPrediction || 'PCB',
      userConfirmedCategory,
      isOverride,
      collectorId: collectorId || 'anonymous_collector',
      district: district || 'Lucknow',
      timestamp: new Date().toISOString()
    };

    store.mlTrainingSamples.push(sample);
    store.save();

    res.json({
      success: true,
      message: 'Training sample recorded in persistent dataset pipeline.',
      sampleId: sample.id,
      totalSamplesCollected: store.mlTrainingSamples.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const predictValuation = async (req: Request, res: Response) => {
  try {
    const { category, weightKg, condition, district = 'Lucknow' } = req.body;

    if (!category || !weightKg) {
      return res.status(400).json({ success: false, message: 'Category and weight are required.' });
    }

    const priceRecord = store.prices.find(
      p => p.materialCategory === category && p.district.toLowerCase() === district.toLowerCase()
    ) || store.prices[0];

    const benchmarkPrice = priceRecord ? priceRecord.prevailingBuyPrice : 95;

    let conditionMultiplier = 1.0;
    if (condition === 'DAMAGED') conditionMultiplier = 0.85;
    if (condition === 'DISMANTLED') conditionMultiplier = 0.75;

    const baseValue = parseFloat(weightKg) * benchmarkPrice * conditionMultiplier;
    const min = Math.round(baseValue * 0.9);
    const max = Math.round(baseValue * 1.1);
    const avg = Math.round(baseValue);

    res.json({
      success: true,
      valuation: {
        category,
        weightKg: parseFloat(weightKg),
        benchmarkPricePerKg: benchmarkPrice,
        conditionMultiplier,
        formula: 'Weight * BenchmarkRate * ConditionMultiplier (±10% range)',
        estimatedValueMin: min,
        estimatedValueMax: max,
        estimatedValueAvg: avg
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
