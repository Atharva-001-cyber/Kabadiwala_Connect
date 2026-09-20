/**
 * Production YOLOv8-Nano ONNX Inference Engine for E-Waste Material Identification
 * Model: best.onnx (11.58 MB, Opset 12, FP32)
 * Trained on verified 8-class e-waste dataset (SIH 2026 Problem Statement 26229)
 * 100% On-Device & Offline via onnxruntime-web (WASM)
 */

import * as ort from 'onnxruntime-web';
import { MaterialCategory } from '../../types';

export type YoloModelStatus =
  | 'MODEL_LOADING'
  | 'MODEL_READY'
  | 'ANALYZING'
  | 'DETECTED'
  | 'LOW_CONFIDENCE'
  | 'NO_DETECTION'
  | 'ERROR';

export interface YoloDetection {
  id: string;
  classId: number;
  className: string;
  category: MaterialCategory;
  cpcbCode: string;
  label: { hi: string; mr: string; en: string };
  confidence: number;
  box: [number, number, number, number]; // [xNorm, yNorm, wNorm, hNorm] (0..1 range)
  color: string;
}

export interface YoloInferenceResult {
  status: YoloModelStatus;
  primaryCategory: MaterialCategory | null;
  primarySubCategory?: string;
  confidence: number;
  isAmbiguous: boolean;
  model: 'YOLOv8-Nano';
  detections: YoloDetection[];
  inferenceTimeMs: number;
  message?: { hi: string; mr: string; en: string };
}

// Fixed 8-class taxonomy verified in Step 8 & Step 9
export const YOLO_CLASSES: Array<{
  id: number;
  name: string;
  category: MaterialCategory;
  subCategory: string;
  cpcbCode: string;
  color: string;
  label: { hi: string; mr: string; en: string };
}> = [
  {
    id: 0,
    name: 'PCB_Circuit_Board',
    category: 'PCB',
    subCategory: 'Motherboard / Computer PCB (ITEW1)',
    cpcbCode: 'ITEW1',
    color: '#06b6d4', // Cyan
    label: {
      hi: 'पीसीबी / सर्किट बोर्ड',
      mr: 'पीसीबी / सर्किट बोर्ड',
      en: 'PCB / Circuit Board'
    }
  },
  {
    id: 1,
    name: 'Battery',
    category: 'BATTERY',
    subCategory: 'Lithium / Industrial Battery (ITEW1)',
    cpcbCode: 'ITEW1',
    color: '#f59e0b', // Amber
    label: {
      hi: 'बैटरी / लिथियम सेल',
      mr: 'बॅटरी / लिथियम सेल',
      en: 'Battery'
    }
  },
  {
    id: 2,
    name: 'CRT',
    category: 'CRT',
    subCategory: 'Cathode Ray Tube Monitor (CEEW1)',
    cpcbCode: 'CEEW1',
    color: '#8b5cf6', // Violet
    label: {
      hi: 'सीआरटी मॉनिटर / टीवी',
      mr: 'सीआरटी मॉनिटर / टीव्ही',
      en: 'CRT Monitor / TV'
    }
  },
  {
    id: 3,
    name: 'LCD_LED_Display',
    category: 'LCD',
    subCategory: 'LCD / Flat Panel Screen (CEEW2)',
    cpcbCode: 'CEEW2',
    color: '#3b82f6', // Blue
    label: {
      hi: 'एलसीडी / एलईडी स्क्रीन',
      mr: 'एलसीडी / एलईडी स्क्रीन',
      en: 'LCD / LED Display'
    }
  },
  {
    id: 4,
    name: 'Cable_Wire',
    category: 'CABLE',
    subCategory: 'Insulated Copper Cable / Cord (CEEW5)',
    cpcbCode: 'CEEW5',
    color: '#10b981', // Emerald
    label: {
      hi: 'कॉपर तार / केबल',
      mr: 'कॉपर वायर / केबल',
      en: 'Cable / Wire'
    }
  },
  {
    id: 5,
    name: 'Electric_Motor',
    category: 'MOTOR',
    subCategory: 'Electric Motor / Stator (CEEW5)',
    cpcbCode: 'CEEW5',
    color: '#ec4899', // Pink
    label: {
      hi: 'इलेक्ट्रिक मोटर',
      mr: 'इलेक्ट्रिक मोटर',
      en: 'Electric Motor'
    }
  },
  {
    id: 6,
    name: 'Magnet_bearing_Assembly',
    category: 'MAGNET',
    subCategory: 'Magnet / Bearing Hardware Assembly (CEEW5)',
    cpcbCode: 'CEEW5',
    color: '#6366f1', // Indigo
    label: {
      hi: 'मैग्नेट असेंबली',
      mr: 'चुंबक असेंब्ली',
      en: 'Magnet / Bearing Assembly'
    }
  },
  {
    id: 7,
    name: 'Mixed_EWaste',
    category: 'MIXED_PLASTIC',
    subCategory: 'Mixed Electronic Scrap / Casing (CEEW4)',
    cpcbCode: 'CEEW4',
    color: '#14b8a6', // Teal
    label: {
      hi: 'मिश्रित ई-कचरा',
      mr: 'मिश्रित ई-कचरा',
      en: 'Mixed E-Waste'
    }
  }
];

// Configurable Confidence Thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.65,
  ACCEPTABLE: 0.50,
  CANDIDATE_MIN: 0.20,
  IOU_NMS: 0.45
};

const MODEL_PATH = '/models/best.onnx';
const MODEL_INPUT_SIZE = 416;

// Singleton Inference Session Cache
let sessionPromise: Promise<ort.InferenceSession> | null = null;
let activeSession: ort.InferenceSession | null = null;
let isInitializing = false;
let lastModelStatus: YoloModelStatus = 'MODEL_LOADING';

/**
 * Configure ONNX Runtime Web WASM Environment
 */
function configureOrtEnvironment(): void {
  try {
    if (typeof window !== 'undefined') {
      ort.env.wasm.wasmPaths = '/';
      ort.env.wasm.numThreads = 1;
    }
  } catch (err) {
    console.warn('[YOLOv8-Nano] Warning setting WASM environment:', err);
  }
}

/**
 * Get or load the singleton YOLOv8-Nano ONNX Session
 */
export async function getYoloSession(): Promise<ort.InferenceSession> {
  if (activeSession) {
    lastModelStatus = 'MODEL_READY';
    return activeSession;
  }

  if (sessionPromise) {
    return sessionPromise;
  }

  isInitializing = true;
  lastModelStatus = 'MODEL_LOADING';
  configureOrtEnvironment();

  sessionPromise = (async () => {
    try {
      const session = await ort.InferenceSession.create(MODEL_PATH, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });
      activeSession = session;
      lastModelStatus = 'MODEL_READY';
      isInitializing = false;
      return session;
    } catch (error) {
      // Fallback try with CDN wasm paths if local wasm paths encountered resolution issue
      try {
        if (typeof window !== 'undefined') {
          ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ort.env.versions.web}/dist/`;
        }
        const session = await ort.InferenceSession.create(MODEL_PATH, {
          executionProviders: ['wasm']
        });
        activeSession = session;
        lastModelStatus = 'MODEL_READY';
        isInitializing = false;
        return session;
      } catch (fallbackErr) {
        isInitializing = false;
        sessionPromise = null;
        lastModelStatus = 'ERROR';
        console.warn('[YOLOv8-Nano] Failed to load ONNX model:', error, fallbackErr);
        throw error;
      }
    }
  })();

  return sessionPromise;
}

export function getYoloModelStatus(): YoloModelStatus {
  if (activeSession) return 'MODEL_READY';
  if (isInitializing) return 'MODEL_LOADING';
  return lastModelStatus;
}

/**
 * Aspect-Ratio Preserving Letterbox Preprocessing
 * Resizes input image to 416x416 while preserving aspect ratio and padding with 114 (gray).
 * Extracts normalized Float32 planar RGB tensor [1, 3, 416, 416].
 */
export function preprocessImageLetterbox(
  source: HTMLImageElement | HTMLCanvasElement
): {
  tensor: ort.Tensor;
  origWidth: number;
  origHeight: number;
  scale: number;
  padX: number;
  padY: number;
} {
  const origWidth = (source as HTMLImageElement).naturalWidth || source.width || MODEL_INPUT_SIZE;
  const origHeight = (source as HTMLImageElement).naturalHeight || source.height || MODEL_INPUT_SIZE;

  // Calculate scale and padding offsets
  const scale = Math.min(MODEL_INPUT_SIZE / origWidth, MODEL_INPUT_SIZE / origHeight);
  const scaledWidth = Math.round(origWidth * scale);
  const scaledHeight = Math.round(origHeight * scale);
  const padX = (MODEL_INPUT_SIZE - scaledWidth) / 2;
  const padY = (MODEL_INPUT_SIZE - scaledHeight) / 2;

  // Render letterboxed image onto 416x416 canvas
  const canvas = document.createElement('canvas');
  canvas.width = MODEL_INPUT_SIZE;
  canvas.height = MODEL_INPUT_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('[YOLOv8-Nano] Failed to create 2D canvas context for letterboxing');
  }

  // Fill with standard YOLO neutral background (114, 114, 114)
  ctx.fillStyle = '#727272';
  ctx.fillRect(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);

  // Draw scaled image centered with padding
  ctx.drawImage(source, padX, padY, scaledWidth, scaledHeight);

  // Extract RGBA pixels
  const imgData = ctx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE).data;

  // Format as planar Float32Array [1, 3, 416, 416] in RGB order
  const planeSize = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
  const float32Data = new Float32Array(3 * planeSize);

  for (let i = 0; i < planeSize; i++) {
    const r = imgData[i * 4] / 255.0;
    const g = imgData[i * 4 + 1] / 255.0;
    const b = imgData[i * 4 + 2] / 255.0;

    float32Data[i] = r;                  // R channel
    float32Data[planeSize + i] = g;      // G channel
    float32Data[2 * planeSize + i] = b;  // B channel
  }

  const tensor = new ort.Tensor('float32', float32Data, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);

  return {
    tensor,
    origWidth,
    origHeight,
    scale,
    padX,
    padY
  };
}

/**
 * Compute Intersection over Union (IoU) between two bounding boxes
 * Box format: [x1, y1, x2, y2]
 */
function computeIoU(
  boxA: [number, number, number, number],
  boxB: [number, number, number, number]
): number {
  const x1 = Math.max(boxA[0], boxB[0]);
  const y1 = Math.max(boxA[1], boxB[1]);
  const x2 = Math.min(boxA[2], boxB[2]);
  const y2 = Math.min(boxA[3], boxB[3]);

  const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  if (intersectionArea <= 0) return 0;

  const areaA = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]);
  const areaB = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]);
  const unionArea = areaA + areaB - intersectionArea;

  return unionArea > 0 ? intersectionArea / unionArea : 0;
}

/**
 * Greedy Non-Maximum Suppression (NMS)
 */
function runNMS(
  candidates: Array<{
    classId: number;
    score: number;
    boxXYXY: [number, number, number, number];
    boxNorm: [number, number, number, number];
  }>,
  iouThreshold: number = CONFIDENCE_THRESHOLDS.IOU_NMS
): Array<{
  classId: number;
  score: number;
  boxNorm: [number, number, number, number];
}> {
  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  const selected: Array<{
    classId: number;
    score: number;
    boxNorm: [number, number, number, number];
  }> = [];

  const suppressed = new Uint8Array(candidates.length);

  for (let i = 0; i < candidates.length; i++) {
    if (suppressed[i]) continue;

    const current = candidates[i];
    selected.push({
      classId: current.classId,
      score: current.score,
      boxNorm: current.boxNorm
    });

    for (let j = i + 1; j < candidates.length; j++) {
      if (suppressed[j]) continue;

      const iou = computeIoU(current.boxXYXY, candidates[j].boxXYXY);
      if (iou >= iouThreshold) {
        suppressed[j] = 1;
      }
    }
  }

  return selected;
}

/**
 * Decode YOLOv8 Output Tensor [1, 12, 3549]
 * 12 rows: [cx, cy, w, h, class0..class7]
 * 3549 candidate anchor positions
 */
export function decodeYoloOutput(
  outputTensor: ort.Tensor,
  origWidth: number,
  origHeight: number,
  scale: number,
  padX: number,
  padY: number
): YoloDetection[] {
  const data = outputTensor.data as Float32Array;
  const numClasses = 8;
  if (outputTensor.dims.length !== 3 || outputTensor.dims[0] !== 1 || outputTensor.dims[1] !== 12) {
    throw new Error('Unsupported YOLO output shape');
  }
  const numAnchors = outputTensor.dims[2];
  const minScoreThreshold = CONFIDENCE_THRESHOLDS.CANDIDATE_MIN;

  const rawCandidates: Array<{
    classId: number;
    score: number;
    boxXYXY: [number, number, number, number];
    boxNorm: [number, number, number, number];
  }> = [];

  for (let j = 0; j < numAnchors; j++) {
    // Determine class with maximum probability
    let bestClass = -1;
    let maxScore = 0;

    for (let c = 0; c < numClasses; c++) {
      // Row 0..3 are cx, cy, w, h; rows 4..11 are class probabilities
      const score = data[(4 + c) * numAnchors + j];
      if (score > maxScore) {
        maxScore = score;
        bestClass = c;
      }
    }

    if (!Number.isFinite(maxScore) || maxScore > 1 || maxScore < minScoreThreshold || bestClass < 0) {
      continue;
    }

    // Candidate bounding box coordinates in letterbox 416x416 space
    const cx = data[0 * numAnchors + j];
    const cy = data[1 * numAnchors + j];
    const w = data[2 * numAnchors + j];
    const h = data[3 * numAnchors + j];
    if (![cx, cy, w, h].every(Number.isFinite) || w <= 0 || h <= 0) continue;

    // Convert from letterbox space back to original image space
    const x1 = (cx - w / 2 - padX) / scale;
    const y1 = (cy - h / 2 - padY) / scale;
    const x2 = (cx + w / 2 - padX) / scale;
    const y2 = (cy + h / 2 - padY) / scale;

    // Clamp coordinates to original image bounds
    const clampedX1 = Math.max(0, Math.min(origWidth, x1));
    const clampedY1 = Math.max(0, Math.min(origHeight, y1));
    const clampedX2 = Math.max(0, Math.min(origWidth, x2));
    const clampedY2 = Math.max(0, Math.min(origHeight, y2));

    const boxW = clampedX2 - clampedX1;
    const boxH = clampedY2 - clampedY1;

    // Filter tiny or inverted boxes
    if (boxW <= 4 || boxH <= 4) continue;

    // Normalized coordinates [xNorm, yNorm, wNorm, hNorm] (0..1 range)
    const xNorm = clampedX1 / origWidth;
    const yNorm = clampedY1 / origHeight;
    const wNorm = boxW / origWidth;
    const hNorm = boxH / origHeight;

    rawCandidates.push({
      classId: bestClass,
      score: maxScore,
      boxXYXY: [clampedX1, clampedY1, clampedX2, clampedY2],
      boxNorm: [xNorm, yNorm, wNorm, hNorm]
    });
  }

  // Apply greedy NMS
  const nmsResults = runNMS(rawCandidates);

  // Map to structured YoloDetection objects
  const detections: YoloDetection[] = nmsResults.map((item, idx) => {
    const classMeta = YOLO_CLASSES[item.classId] || YOLO_CLASSES[7];
    return {
      id: `yolo_${Date.now()}_${idx + 1}`,
      classId: item.classId,
      className: classMeta.name,
      category: classMeta.category,
      cpcbCode: classMeta.cpcbCode,
      label: classMeta.label,
      confidence: item.score,
      box: item.boxNorm,
      color: classMeta.color
    };
  });

  return detections;
}

/**
 * Execute Full End-to-End Real YOLOv8-Nano Inference on Image
 */
export async function runEwasteYoloInference(
  source: HTMLImageElement | HTMLCanvasElement
): Promise<YoloInferenceResult> {
  const startTime = performance.now();

  try {
    const session = await getYoloSession();

    // 1. Preprocessing with aspect-ratio preserving letterboxing
    const { tensor, origWidth, origHeight, scale, padX, padY } = preprocessImageLetterbox(source);

    // 2. Run ONNX session
    const inputName = session.inputNames[0] || 'images';
    const feeds: Record<string, ort.Tensor> = { [inputName]: tensor };
    const outputs = await session.run(feeds);

    const outputName = session.outputNames[0] || 'output0';
    const outputTensor = outputs[outputName];

    if (!outputTensor) {
      throw new Error(`[YOLOv8-Nano] Model output '${outputName}' not found`);
    }

    // 3. Decode output tensor and apply NMS
    const detections = decodeYoloOutput(outputTensor, origWidth, origHeight, scale, padX, padY);
    const inferenceTimeMs = Math.round(performance.now() - startTime);

    // 4. Apply Conservative Confidence Policy
    if (detections.length === 0) {
      return {
        status: 'NO_DETECTION',
        primaryCategory: null,
        confidence: 0,
        isAmbiguous: true,
        model: 'YOLOv8-Nano',
        detections: [],
        inferenceTimeMs,
        message: {
          hi: 'सामग्री की पुष्टि नहीं हो सकी — कृपया स्पष्ट फोटो दोबारा लें।',
          mr: 'साहित्य निश्चित ओळखता आले नाही — कृपया स्पष्ट फोटो पुन्हा काढा.',
          en: 'Material not confidently detected — Please retake the photo with the item clearly visible.'
        }
      };
    }

    const topDetection = detections[0];

    // High or Medium confidence (>= 0.50): Accept detection
    if (topDetection.confidence >= CONFIDENCE_THRESHOLDS.ACCEPTABLE) {
      const classMeta = YOLO_CLASSES[topDetection.classId] || YOLO_CLASSES[7];
      return {
        status: 'DETECTED',
        primaryCategory: topDetection.category,
        primarySubCategory: classMeta.subCategory,
        confidence: topDetection.confidence,
        isAmbiguous: false,
        model: 'YOLOv8-Nano',
        detections: detections.filter(d => d.confidence >= CONFIDENCE_THRESHOLDS.ACCEPTABLE),
        inferenceTimeMs,
        message: {
          hi: `${topDetection.label.hi} की पहचान हुई (${Math.round(topDetection.confidence * 100)}%)`,
          mr: `${topDetection.label.mr} ओळखले गेले (${Math.round(topDetection.confidence * 100)}%)`,
          en: `${topDetection.label.en} identified (${Math.round(topDetection.confidence * 100)}%)`
        }
      };
    }

    // Low confidence (< 0.50): Do NOT automatically assign lot category
    return {
      status: 'LOW_CONFIDENCE',
      primaryCategory: null,
      confidence: topDetection.confidence,
      isAmbiguous: true,
      model: 'YOLOv8-Nano',
      detections: [], // Do not draw fake or misleading boxes for low confidence
      inferenceTimeMs,
      message: {
        hi: 'कम विश्वसनीयता — कृपया स्पष्ट फोटो दोबारा लें या नीचे श्रेणी चुनें।',
        mr: 'कमी विश्वासार्हता — कृपया स्पष्ट फोटो पुन्हा काढा किंवा खाली श्रेणी निवडा.',
        en: 'Low confidence — please retake photo or select material manually below.'
      }
    };
  } catch (err: any) {
    const inferenceTimeMs = Math.round(performance.now() - startTime);
    console.error('[YOLOv8-Nano] Inference error:', err);
    return {
      status: 'ERROR',
      primaryCategory: null,
      confidence: 0,
      isAmbiguous: true,
      model: 'YOLOv8-Nano',
      detections: [],
      inferenceTimeMs,
      message: {
        hi: 'एआई मॉडल लोड करने में असमर्थ — कृपया मैन्युअल रूप से श्रेणी चुनें।',
        mr: 'एआय मॉडेल लोड करण्यात अयशस्वी — कृपया मॅन्युअली श्रेणी निवडा.',
        en: 'Unable to run AI model — please select material category manually.'
      }
    };
  }
}
