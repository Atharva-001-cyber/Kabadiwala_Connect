import { decodeYoloOutput, CONFIDENCE_THRESHOLDS, YoloInferenceResult } from '../services/vision/ewasteOnnx';
import { toVisionAnalysis, isCloudAiAvailable, analyzeScrapVision } from '../utils/visionClassifier';
import type { Tensor } from 'onnxruntime-web';

// Synthetic tensors test decoding/control flow only, not real-photo accuracy.
let checks = 0;
function assert(ok: boolean, label: string) {
  if (!ok) throw new Error(label);
  checks++;
  console.log('PASS:', label);
}
const data = new Float32Array(12 * 3);
function anchor(i: number, cx: number, cy: number, classId: number, score: number) {
  data[i] = cx; data[3+i] = cy; data[6+i] = 80; data[9+i] = 80;
  data[(4+classId)*3+i] = score;
}
anchor(0, 100, 150, 0, .731);
anchor(1, 300, 150, 1, .81);
anchor(2, 200, 150, 4, .1);
const detections = decodeYoloOutput({data, dims:[1,12,3]} as unknown as Tensor, 416, 208, 1, 0, 104);
assert(detections.length === 2, 'Reject weak candidate; keep two separate objects');
assert(detections[0].category === 'BATTERY' && detections[1].category === 'PCB', 'Preserve per-object categories');
assert(Math.abs(detections[1].confidence - .731) < .000001, 'Do not inflate confidence');
assert(Math.abs(detections[0].box[1] - 6/208) < .000001, 'Undo letterbox padding');
assert(detections.every(d => d.box.every(Number.isFinite)), 'Finite bounding boxes');
const base: YoloInferenceResult = {status:'DETECTED', primaryCategory:'BATTERY', confidence:.81,
  isAmbiguous:false, model:'YOLOv8-Nano', detections, inferenceTimeMs:123};
const result = toVisionAnalysis(base);
assert(result.category === 'BATTERY' && result.detectedObjects?.[1].category === 'PCB', 'Adapter does not relabel other objects');
assert(result.inferenceTimeMs === 123 && result.confidence === .81, 'Preserve actual score and duration');
for (const status of ['LOW_CONFIDENCE','NO_DETECTION','ERROR'] as const) {
  const uncertain = toVisionAnalysis({...base, status, primaryCategory:null, isAmbiguous:true});
  assert(uncertain.category === null && uncertain.detectedObjects?.length === 0, status + ' cannot fabricate category/boxes');
  assert(!uncertain.isNonEWaste, status + ' does not falsely label photo non-e-waste');
}
assert(CONFIDENCE_THRESHOLDS.ACCEPTABLE === .5, 'Conservative acceptance threshold');
assert(!isCloudAiAvailable(), 'No fake active cloud vision');
let rejected = false;
try { decodeYoloOutput({data, dims:[1,84,3]} as unknown as Tensor,416,416,1,0,0); } catch { rejected = true; }
assert(rejected, 'Reject incompatible model output');
analyzeScrapVision('invalid-image').then(failed => {
  assert(failed.category === null && failed.status === 'ERROR', 'Image errors resolve safely');
  console.log(checks + ' vision regression checks passed. These are NOT an accuracy benchmark.');
}).catch(error => { throw error; });

