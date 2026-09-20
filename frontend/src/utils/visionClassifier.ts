/** Real local model predictions only. Model scores are not accuracy guarantees. */
import { MaterialCategory } from '../types';
import { runEwasteYoloInference, getYoloSession, YOLO_CLASSES, YoloInferenceResult } from '../services/vision/ewasteOnnx';

export type NonEWasteType = 
  | 'TEXT_PAPER_TAG' 
  | 'FABRIC_CLOTHING' 
  | 'PERSON_SELFIE' 
  | 'PEN_STATIONERY'
  | 'OPTICAL_EYEWEAR'
  | 'GENERAL_NON_ELECTRONIC';

export interface DetectedObjectBox {
  id: string;
  box: [number, number, number, number]; // [xNorm, yNorm, wNorm, hNorm] (0..1 range)
  label: { hi: string; mr: string; en: string };
  category: MaterialCategory;
  subCategory: string;
  cpcbCode: string;
  confidence: number;
  color: string;
}

export interface VisionAnalysisResult {
  aiEngine?: 'GEMINI_CLOUD' | 'YOLO_EDGE' | 'MOBILENET_YOLO_DUAL';
  isNonEWaste: boolean;
  nonEWasteType?: NonEWasteType;
  nonEWasteTitle?: { hi: string; mr: string; en: string };
  nonEWasteWarning?: { hi: string; mr: string; en: string };
  disposalSuggestion?: { hi: string; mr: string; en: string };
  isAmbiguous: boolean;
  category: MaterialCategory | null;
  confidence: number;
  subCategory?: string;
  cpcbCode?: string;
  featuresDetected: string[];
  detectedObjects?: DetectedObjectBox[];
  inferenceTimeMs?: number;
  message?: { hi: string; mr: string; en: string };
  status?: YoloInferenceResult["status"];
  metrics?: {
    edgeDensity: number;
    pcbRatio: number;
    copperRatio: number;
    cableRatio: number;
    whitePaperRatio: number;
    darkScreenRatio: number;
    metallicRatio: number;
    skinRatio: number;
  };
}

let memoryApiKey = '';

/**
 * Helper: Retrieve configured Gemini API Key (if any)
 */
export function getGeminiApiKey(): string {
  if (memoryApiKey) return memoryApiKey;
  try {
    if (typeof (import.meta as any)?.env?.VITE_GEMINI_API_KEY === 'string') {
      return (import.meta as any).env.VITE_GEMINI_API_KEY;
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) {
      return process.env.VITE_GEMINI_API_KEY;
    }
  } catch {}
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    return localStorage.getItem('gemini_api_key') || localStorage.getItem('VITE_GEMINI_API_KEY') || '';
  }
  return '';
}

/**
 * Helper: Persist custom user/evaluator Gemini API Key
 */
export function setGeminiApiKey(key: string): void {
  const trimmed = (key || '').trim();
  memoryApiKey = trimmed;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    if (!trimmed) {
      localStorage.removeItem('gemini_api_key');
      localStorage.removeItem('VITE_GEMINI_API_KEY');
    } else {
      localStorage.setItem('gemini_api_key', trimmed);
    }
  }
}


/** Cloud vision is not wired up; a key alone must not advertise it as active. */
export function isCloudAiAvailable(): boolean { return false; }

/** Warm the actual detector used by camera and gallery. */
export async function prewarmVisionModel() { return getYoloSession(); }

export function toVisionAnalysis(result: YoloInferenceResult): VisionAnalysisResult {
  const accepted = result.status === 'DETECTED' && !result.isAmbiguous && result.primaryCategory !== null;
  return {
    aiEngine: 'YOLO_EDGE',
    status: result.status,
    message: result.message,
    isNonEWaste: false, // Absence of a detection does not prove non-electronic waste.
    isAmbiguous: !accepted,
    category: accepted ? result.primaryCategory : null,
    confidence: result.confidence,
    subCategory: accepted ? result.primarySubCategory : undefined,
    cpcbCode: accepted ? YOLO_CLASSES.find(c => c.category === result.primaryCategory)?.cpcbCode : undefined,
    featuresDetected: ['Local YOLO model suggestion — collector confirmation required'],
    detectedObjects: accepted ? result.detections.map(d => ({
      ...d, subCategory: YOLO_CLASSES[d.classId]?.subCategory || d.label.en
    })) : [],
    inferenceTimeMs: result.inferenceTimeMs
  };
}

export async function analyzeScrapVision(source: File | Blob | string): Promise<VisionAnalysisResult> {
  let objectUrl: string | undefined;
  try {
    const img = new Image();
    img.decoding = 'async';
    const url = typeof source === 'string' ? source : (objectUrl = URL.createObjectURL(source));
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { img.src = ''; reject(new Error('Image load timed out')); }, 15000);
      img.onload = () => { clearTimeout(timer); resolve(); };
      img.onerror = () => { clearTimeout(timer); reject(new Error('Image could not be decoded')); };
      img.src = url;
    });
    return toVisionAnalysis(await runEwasteYoloInference(img));
  } catch {
    return toVisionAnalysis({
      status: 'ERROR', primaryCategory: null, confidence: 0, isAmbiguous: true,
      model: 'YOLOv8-Nano', detections: [], inferenceTimeMs: 0,
      message: {
        hi: 'फोटो का विश्लेषण नहीं हो सका। दोबारा फोटो लें या श्रेणी खुद चुनें।',
        mr: 'फोटोचे विश्लेषण झाले नाही. पुन्हा फोटो काढा किंवा श्रेणी निवडा.',
        en: 'Unable to analyze photo. Retake it or choose a category manually.'
      }
    });
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
