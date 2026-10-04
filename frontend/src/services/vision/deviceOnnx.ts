import * as ort from 'onnxruntime-web/wasm';
import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';
import wasmModuleUrl from 'onnxruntime-web/ort-wasm-simd-threaded.mjs?url';
import { preprocessImageLetterbox } from './ewasteOnnx';
import { DEVICE_NAMES, DeviceDetection, DeviceSuggestion, devicePolicy } from './devicePolicy';

let sessionPromise: Promise<ort.InferenceSession> | undefined;
function getSession() {
  if (!sessionPromise) {
    ort.env.wasm.wasmPaths = { wasm: wasmUrl, mjs: wasmModuleUrl };
    ort.env.wasm.numThreads = 1;
    sessionPromise = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      let model: ArrayBuffer;
      try {
        const response = await fetch('/models/device-candidate-v1.onnx', {signal:controller.signal});
        if (!response.ok) throw new Error(`Device model download failed (${response.status})`);
        model = await response.arrayBuffer();
      } finally { clearTimeout(timeout); }
      return ort.InferenceSession.create(model, {
        executionProviders: ['wasm'], graphOptimizationLevel: 'all'
      });
    })().catch(error => { sessionPromise = undefined; throw error; });
  }
  return sessionPromise;
}

function iou(a: number[], b: number[]) {
  const intersection = Math.max(0, Math.min(a[0]+a[2], b[0]+b[2])-Math.max(a[0], b[0])) *
    Math.max(0, Math.min(a[1]+a[3], b[1]+b[3])-Math.max(a[1], b[1]));
  return intersection / Math.max(1e-9, a[2]*a[3]+b[2]*b[3]-intersection);
}

/** Genuine local model output; no filename rules, cloud calls or material mapping. */
export async function analyzeDevice(source: HTMLImageElement | HTMLCanvasElement): Promise<DeviceSuggestion> {
  try {
    const session = await getSession();
    const input = preprocessImageLetterbox(source);
    let outputs: Record<string, ort.Tensor>;
    try { outputs = await session.run({ [session.inputNames[0]]: input.tensor }); }
    finally { input.tensor.dispose(); }
    try {
      const tensor = outputs[session.outputNames[0]];
      if (tensor.dims.length !== 3 || tensor.dims[0] !== 1 || tensor.dims[1] !== 4+DEVICE_NAMES.length) {
        throw new Error('Device model class/output layout mismatch');
      }
      const data = tensor.data as Float32Array;
      const count = tensor.dims[2];
      const candidates: DeviceDetection[] = [];
      for (let i = 0; i < count; i++) {
        let cls = 0, score = 0;
        for (let c = 0; c < DEVICE_NAMES.length; c++) {
          const value = data[(4+c)*count+i];
          if (value > score) { score = value; cls = c; }
        }
        if (!Number.isFinite(score) || score < 0.25 || score > 1) continue;
        const cx = data[i], cy = data[count+i], w = data[2*count+i], h = data[3*count+i];
        if (![cx,cy,w,h].every(Number.isFinite) || w <= 0 || h <= 0) continue;
        const x1 = Math.max(0, Math.min(1, (cx-w/2-input.padX)/input.scale/input.origWidth));
        const y1 = Math.max(0, Math.min(1, (cy-h/2-input.padY)/input.scale/input.origHeight));
        const x2 = Math.max(0, Math.min(1, (cx+w/2-input.padX)/input.scale/input.origWidth));
        const y2 = Math.max(0, Math.min(1, (cy+h/2-input.padY)/input.scale/input.origHeight));
        if (x2 <= x1 || y2 <= y1) continue;
        candidates.push({ name: DEVICE_NAMES[cls], score, box: [x1,y1,x2-x1,y2-y1] });
      }
      candidates.sort((a,b) => b.score-a.score);
      const selected: DeviceDetection[] = [];
      for (const item of candidates.slice(0, 300)) {
        if (!selected.some(other => other.name === item.name && iou(other.box,item.box) > 0.45)) selected.push(item);
        if (selected.length >= 20) break;
      }
      return devicePolicy(selected);
    } finally { Object.values(outputs).forEach(tensor => tensor.dispose()); }
  } catch (error) {
    console.warn('Local device candidate unavailable:', error instanceof Error ? error.message : 'inference failed');
    return { status: 'UNAVAILABLE', objects: [], requiresConfirmation: true };
  }
}
