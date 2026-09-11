/**
 * ML Dataset Validator & Stratified Train/Val Split Service
 * SIH 2026 Problem Statement #229
 * 
 * Provides:
 * - Dataset validation & class distribution audit
 * - Stratified 80/20 Train/Validation split generator
 * - YOLOv8 `data.yaml` manifest generation
 * - Export formats: YOLOv8, Pascal_VOC, COCO
 */

import { MLTrainingSample, MaterialCategory } from '../types';

export interface DatasetSplitResult {
  datasetName: string;
  totalSamples: number;
  trainCount: number;
  valCount: number;
  splitRatio: string;
  classes: MaterialCategory[];
  classDistribution: Record<string, number>;
  isDatasetViableForTraining: boolean;
  modelTrainingReadiness: {
    ready: boolean;
    status: 'DATASET_COLLECTION_IN_PROGRESS' | 'READY_FOR_PYTORCH_TRAINING';
    minimumRecommendedPerClass: number;
    recommendedFramework: 'YOLOv8' | 'ONNX_MobileNetV3';
    reason: string;
  };
  yoloConfigYaml: string;
  trainSamples: MLTrainingSample[];
  valSamples: MLTrainingSample[];
}

export class MLDatasetService {
  private readonly MANDATORY_CLASSES: MaterialCategory[] = [
    'PCB', 'BATTERY', 'CRT', 'LCD', 'CABLE', 'MOTOR', 'MAGNET', 'MIXED_PLASTIC'
  ];

  public validateAndSplitDataset(samples: MLTrainingSample[], trainRatio: number = 0.8): DatasetSplitResult {
    const classDistribution: Record<string, number> = {};
    let totalOverrides = 0;

    this.MANDATORY_CLASSES.forEach(c => {
      classDistribution[c] = 0;
    });

    samples.forEach(s => {
      classDistribution[s.userConfirmedCategory] = (classDistribution[s.userConfirmedCategory] || 0) + 1;
      if (s.isOverride) totalOverrides++;
    });

    // Stratified Split: Shuffle deterministically and split by class
    const trainSamples: MLTrainingSample[] = [];
    const valSamples: MLTrainingSample[] = [];

    const groupedByClass: Record<string, MLTrainingSample[]> = {};
    samples.forEach(s => {
      if (!groupedByClass[s.userConfirmedCategory]) groupedByClass[s.userConfirmedCategory] = [];
      groupedByClass[s.userConfirmedCategory].push(s);
    });

    Object.keys(groupedByClass).forEach(cat => {
      const catSamples = groupedByClass[cat];
      const splitIdx = Math.max(1, Math.floor(catSamples.length * trainRatio));
      trainSamples.push(...catSamples.slice(0, splitIdx));
      valSamples.push(...catSamples.slice(splitIdx));
    });

    // Determine viability (deep learning requires balanced data across classes)
    const classesWithZeroSamples = this.MANDATORY_CLASSES.filter(c => (classDistribution[c] || 0) === 0);
    const isDatasetViableForTraining = samples.length >= 200 && classesWithZeroSamples.length === 0;

    // Generate standard YOLOv8 data.yaml configuration
    const yoloConfigYaml = [
      `# Kabadiwala Connect SIH 2026 E-Waste Vision Dataset`,
      `path: ./ml-datasets/kabadiwala_ewaste_v1`,
      `train: images/train`,
      `val: images/val`,
      ``,
      `# Classes (${this.MANDATORY_CLASSES.length} streams)`,
      `names:`,
      ...this.MANDATORY_CLASSES.map((c, idx) => `  ${idx}: ${c}`)
    ].join('\n');

    return {
      datasetName: 'KabadiwalaConnect_SIH2026_EWaste_Vision',
      totalSamples: samples.length,
      trainCount: trainSamples.length,
      valCount: valSamples.length,
      splitRatio: `${Math.round(trainRatio * 100)}/${Math.round((1 - trainRatio) * 100)}`,
      classes: this.MANDATORY_CLASSES,
      classDistribution,
      isDatasetViableForTraining,
      modelTrainingReadiness: {
        ready: isDatasetViableForTraining,
        status: isDatasetViableForTraining ? 'READY_FOR_PYTORCH_TRAINING' : 'DATASET_COLLECTION_IN_PROGRESS',
        minimumRecommendedPerClass: 150,
        recommendedFramework: 'YOLOv8',
        reason: isDatasetViableForTraining
          ? 'Dataset meets minimum sample and multi-class distribution criteria.'
          : `Insufficient sample volume (${samples.length} samples collected; ${classesWithZeroSamples.length} classes have 0 samples). Rule-based heuristic fallback remains primary to ensure complete transparency.`
      },
      yoloConfigYaml,
      trainSamples,
      valSamples
    };
  }
}

export const mlDatasetService = new MLDatasetService();
