/** Real local model predictions only. Model scores are not accuracy guarantees. */
import { MaterialCategory } from '../types';
import { DeviceSuggestion, needsMaterialConfirmation } from '../services/vision/devicePolicy';
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
  deviceSuggestion?: DeviceSuggestion;
  candidateCategory?: MaterialCategory;
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
  const isValidKey = (k: string) => typeof k === 'string' && k.trim().startsWith('AIzaSy');
  if (isValidKey(memoryApiKey)) return memoryApiKey.trim();

  try {
    const envKey = (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
    if (isValidKey(envKey)) return envKey.trim();
  } catch {}

  try {
    const procKey = typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY;
    if (isValidKey(procKey)) return (procKey as string).trim();
  } catch {}

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const local1 = localStorage.getItem('gemini_api_key');
    if (isValidKey(local1 || '')) return (local1 as string).trim();
    const local2 = localStorage.getItem('VITE_GEMINI_API_KEY');
    if (isValidKey(local2 || '')) return (local2 as string).trim();
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
    candidateCategory: accepted ? undefined : result.candidateCategory,
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
    const result = toVisionAnalysis(await runEwasteYoloInference(img));
    // Optional second detector: failure must not break legacy component capture.
    try {
      const { analyzeDevice } = await import('../services/vision/deviceOnnx');
      const device = await analyzeDevice(img);
      result.deviceSuggestion = device;
      if (needsMaterialConfirmation(device, result.category)) {
        result.category = null;
        result.candidateCategory = undefined;
        result.detectedObjects = [];
        result.subCategory = undefined;
        result.cpcbCode = undefined;
        result.isAmbiguous = true;
        result.status = 'LOW_CONFIDENCE';
        result.message = {
          en: 'Possible complete device or conflicting predictions. Device identity does not determine material or price; confirm the material manually.',
          hi: 'पूरा उपकरण या अलग-अलग AI सुझाव मिले हैं। उपकरण का नाम सामग्री या कीमत तय नहीं करता; सामग्री खुद पुष्टि करें।',
          mr: 'पूर्ण उपकरण किंवा वेगवेगळे AI अंदाज आहेत. उपकरणाचे नाव साहित्य किंवा किंमत ठरवत नाही; साहित्य स्वतः निश्चित करा.'
        };
      }
    } catch {
      result.deviceSuggestion = {status:'UNAVAILABLE',objects:[],requiresConfirmation:true};
    }
    return result;
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
