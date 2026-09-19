"""
Step 11 — Real-World AI Validation, Diagnostics & Safe Calibration
Kabadiwala Connect — SIH 2026 Problem Statement 26229
Model: frontend/public/models/best.onnx (YOLOv8-Nano ONNX, 416x416)
"""

import os
import glob
import json
import cv2
import numpy as np
import onnxruntime as ort
from collections import defaultdict

CLASSES = [
    'PCB_Circuit_Board',
    'Battery',
    'CRT',
    'LCD_LED_Display',
    'Cable_Wire',
    'Electric_Motor',
    'Magnet_bearing_Assembly',
    'Mixed_EWaste'
]

CATEGORY_MAPPING = {
    0: 'PCB',
    1: 'BATTERY',
    2: 'CRT',
    3: 'LCD',
    4: 'CABLE',
    5: 'MOTOR',
    6: 'MAGNET',
    7: 'MIXED_PLASTIC'
}

MODEL_PATH = 'frontend/public/models/best.onnx'

def letterbox_image(img, target_size=416):
    orig_h, orig_w = img.shape[:2]
    scale = min(target_size / orig_w, target_size / orig_h)
    new_w = int(round(orig_w * scale))
    new_h = int(round(orig_h * scale))
    pad_x = (target_size - new_w) / 2.0
    pad_y = (target_size - new_h) / 2.0

    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    canvas = np.full((target_size, target_size, 3), 114, dtype=np.uint8)
    top = int(round(pad_y))
    left = int(round(pad_x))
    canvas[top:top+new_h, left:left+new_w] = resized

    rgb = cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB)
    blob = rgb.astype(np.float32) / 255.0
    blob = np.transpose(blob, (2, 0, 1))
    blob = np.expand_dims(blob, axis=0)

    return blob, orig_w, orig_h, scale, pad_x, pad_y

def compute_iou(box1, box2):
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    inter = max(0, x2 - x1) * max(0, y2 - y1)
    if inter <= 0: return 0.0

    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - inter
    return inter / union if union > 0 else 0.0

def run_nms(candidates, iou_thresh=0.45):
    candidates = sorted(candidates, key=lambda x: x['score'], reverse=True)
    selected = []
    suppressed = [False] * len(candidates)

    for i in range(len(candidates)):
        if suppressed[i]: continue
        c = candidates[i]
        selected.append(c)
        for j in range(i + 1, len(candidates)):
            if suppressed[j]: continue
            if compute_iou(c['box_xyxy'], candidates[j]['box_xyxy']) >= iou_thresh:
                suppressed[j] = True

    return selected

def decode_and_nms(output_data, orig_w, orig_h, scale, pad_x, pad_y, min_score=0.25):
    output = output_data[0] # [12, 3549]
    num_anchors = output.shape[1]

    candidates = []
    for j in range(num_anchors):
        scores = output[4:12, j]
        best_cls = int(np.argmax(scores))
        max_score = float(scores[best_cls])

        if max_score < min_score: continue

        cx = output[0, j]
        cy = output[1, j]
        w = output[2, j]
        h = output[3, j]

        x1 = (cx - w / 2.0 - pad_x) / scale
        y1 = (cy - h / 2.0 - pad_y) / scale
        x2 = (cx + w / 2.0 - pad_x) / scale
        y2 = (cy + h / 2.0 - pad_y) / scale

        x1 = max(0.0, min(float(orig_w), x1))
        y1 = max(0.0, min(float(orig_h), y1))
        x2 = max(0.0, min(float(orig_w), x2))
        y2 = max(0.0, min(float(orig_h), y2))

        bw = x2 - x1
        bh = y2 - y1
        if bw <= 4 or bh <= 4: continue

        candidates.append({
            'class_id': best_cls,
            'class_name': CLASSES[best_cls],
            'category': CATEGORY_MAPPING[best_cls],
            'score': max_score,
            'box_xyxy': [x1, y1, x2, y2],
            'box_norm': [round(x1/orig_w, 4), round(y1/orig_h, 4), round(bw/orig_w, 4), round(bh/orig_h, 4)]
        })

    return run_nms(candidates)

def evaluate_image(session, input_name, img, min_score=0.25):
    blob, orig_w, orig_h, scale, pad_x, pad_y = letterbox_image(img)
    outputs = session.run(None, {input_name: blob})
    dets = decode_and_nms(outputs[0], orig_w, orig_h, scale, pad_x, pad_y, min_score=min_score)

    if not dets:
        return {
            'status': 'NO_DETECTION',
            'top_class': None,
            'top_category': None,
            'confidence': 0.0,
            'assigned_category': None,
            'has_box': False,
            'box_norm': None,
            'num_detections': 0,
            'detections': [],
            'low_conf_triggered': True
        }

    top = dets[0]
    conf = top['score']
    cat = top['category']

    if conf >= 0.70:
        status = 'DETECTED_HIGH'
        assigned = cat
        low_conf = False
        has_box = True
    elif conf >= 0.50:
        status = 'DETECTED_MEDIUM'
        assigned = cat
        low_conf = False
        has_box = True
    else:
        status = 'LOW_CONFIDENCE'
        assigned = None
        low_conf = True
        has_box = False # Suppressed in UI

    return {
        'status': status,
        'top_class': top['class_name'],
        'top_category': cat,
        'confidence': round(conf, 4),
        'assigned_category': assigned,
        'has_box': has_box,
        'box_norm': top['box_norm'] if has_box else None,
        'num_detections': len(dets),
        'detections': [
            {
                'class_id': d['class_id'],
                'class_name': d['class_name'],
                'category': d['category'],
                'score': round(d['score'], 4),
                'box_norm': d['box_norm']
            } for d in dets
        ],
        'low_conf_triggered': low_conf
    }

def main():
    print("==================================================")
    print("STEP 11 — REAL-WORLD AI VALIDATION & CALIBRATION")
    print("==================================================")

    session = ort.InferenceSession(MODEL_PATH)
    input_name = session.get_inputs()[0].name
    print(f"Loaded ONNX model: {MODEL_PATH}")
    print(f"Model Input name: {input_name}")

    full_report = {}

    # =========================================================================
    # PART 1: EVALUATION ACROSS ALL 8 CLASSES (TEST SPLIT BENCHMARK)
    # =========================================================================
    print("\n--- Part 1: All 8 Classes Comprehensive Test Split Evaluation ---")
    class_eval_results = {}

    for cls_id, cls_name in enumerate(CLASSES):
        # Find images in test split labeled with this class
        test_images = []
        for img_path in glob.glob("dataset_ewaste_v1/test/images/*"):
            base = os.path.splitext(os.path.basename(img_path))[0]
            lbl_path = f"dataset_ewaste_v1/test/labels/{base}.txt"
            if not os.path.exists(lbl_path): continue
            with open(lbl_path, 'r') as f:
                for line in f:
                    parts = line.strip().split()
                    if parts and int(parts[0]) == cls_id:
                        test_images.append(img_path)
                        break

        total = len(test_images)
        high_conf = 0
        med_conf = 0
        low_conf = 0
        no_det = 0
        conf_sum = 0.0
        scores = []
        details = []

        for img_p in test_images:
            img = cv2.imread(img_p)
            if img is None: continue
            res = evaluate_image(session, input_name, img)
            scores.append(res['confidence'])
            conf_sum += res['confidence']

            if res['status'] == 'DETECTED_HIGH' and res['assigned_category'] == CATEGORY_MAPPING[cls_id]:
                high_conf += 1
            elif res['status'] == 'DETECTED_MEDIUM' and res['assigned_category'] == CATEGORY_MAPPING[cls_id]:
                med_conf += 1
            elif res['status'] == 'LOW_CONFIDENCE':
                low_conf += 1
            elif res['status'] == 'NO_DETECTION':
                no_det += 1
            else:
                # Misclassification
                low_conf += 1

            details.append({
                'image': os.path.basename(img_p),
                'status': res['status'],
                'predicted_class': res['top_class'],
                'assigned_category': res['assigned_category'],
                'confidence': res['confidence'],
                'num_dets': res['num_detections']
            })

        avg_conf = (conf_sum / total) if total > 0 else 0.0
        accepted = high_conf + med_conf
        acceptance_rate = (accepted / total * 100) if total > 0 else 0.0

        print(f"Class {cls_id} ({cls_name}) [{CATEGORY_MAPPING[cls_id]}]: {total} images")
        print(f"  High Conf (>=0.70): {high_conf} | Med Conf (0.50-0.69): {med_conf}")
        print(f"  Low Conf (<0.50): {low_conf} | No Detection: {no_det}")
        print(f"  Mean Confidence: {avg_conf:.4f} | Acceptance Rate (>=0.50): {acceptance_rate:.1f}%")

        class_eval_results[cls_name] = {
            'class_id': cls_id,
            'category': CATEGORY_MAPPING[cls_id],
            'total_images': total,
            'high_conf_count': high_conf,
            'med_conf_count': med_conf,
            'low_conf_count': low_conf,
            'no_detection_count': no_det,
            'mean_confidence': round(avg_conf, 4),
            'acceptance_rate_pct': round(acceptance_rate, 2),
            'samples': details[:5]
        }

    full_report['class_evaluation'] = class_eval_results

    # =========================================================================
    # PART 2: PCB VS MOTOR SPECIFIC DISCRIMINATION AUDIT
    # =========================================================================
    print("\n--- Part 2: PCB vs Motor Historical Confusion Audit ---")
    pcb_images = glob.glob("dataset_ewaste_v1/test/images/pcb_*.*")
    motor_images = glob.glob("dataset_ewaste_v1/test/images/motor_*.*")

    pcb_as_motor = 0
    motor_as_pcb = 0
    pcb_correct = 0
    motor_correct = 0

    pcb_details = []
    for p in pcb_images:
        img = cv2.imread(p)
        if img is None: continue
        res = evaluate_image(session, input_name, img)
        if res['top_class'] == 'Electric_Motor':
            pcb_as_motor += 1
        elif res['top_class'] == 'PCB_Circuit_Board':
            pcb_correct += 1
        pcb_details.append((os.path.basename(p), res['top_class'], res['confidence']))

    motor_details = []
    for m in motor_images:
        img = cv2.imread(m)
        if img is None: continue
        res = evaluate_image(session, input_name, img)
        if res['top_class'] == 'PCB_Circuit_Board':
            motor_as_pcb += 1
        elif res['top_class'] == 'Electric_Motor':
            motor_correct += 1
        motor_details.append((os.path.basename(m), res['top_class'], res['confidence']))

    print(f"Total PCB test images checked: {len(pcb_images)}")
    print(f"  Correctly predicted as PCB: {pcb_correct}")
    print(f"  Falsely predicted as Motor: {pcb_as_motor} (Rate: {pcb_as_motor/len(pcb_images)*100:.1f}%)")
    print(f"Total Motor test images checked: {len(motor_images)}")
    print(f"  Correctly predicted as Motor: {motor_correct}")
    print(f"  Falsely predicted as PCB: {motor_as_pcb} (Rate: {motor_as_pcb/len(motor_images)*100:.1f}%)")

    full_report['pcb_vs_motor'] = {
        'total_pcb_images': len(pcb_images),
        'pcb_correct_as_pcb': pcb_correct,
        'pcb_confused_as_motor': pcb_as_motor,
        'total_motor_images': len(motor_images),
        'motor_correct_as_motor': motor_correct,
        'motor_confused_as_pcb': motor_as_pcb
    }

    # =========================================================================
    # PART 3: HARD NEGATIVE / FALSE POSITIVE AUDIT
    # =========================================================================
    print("\n--- Part 3: Hard Negatives & Non-E-Waste Rejection Audit ---")
    neg_images = glob.glob("dataset_ewaste_v1/test/images/*neg*.*") + glob.glob("dataset_ewaste_v1/val/images/*neg*.*")
    neg_results = []
    false_positives = 0
    safe_rejections = 0

    for n_path in neg_images:
        img = cv2.imread(n_path)
        if img is None: continue
        res = evaluate_image(session, input_name, img)
        if res['status'] in ['DETECTED_HIGH', 'DETECTED_MEDIUM']:
            false_positives += 1
        else:
            safe_rejections += 1
        neg_results.append({
            'image': os.path.basename(n_path),
            'status': res['status'],
            'top_class': res['top_class'],
            'confidence': res['confidence']
        })

    print(f"Total Hard Negative Images Evaluated: {len(neg_images)}")
    print(f"  Safely Rejected (No detection or < 0.50): {safe_rejections} ({safe_rejections/len(neg_images)*100:.1f}%)")
    print(f"  False Positives (>= 0.50 accepted): {false_positives} ({false_positives/len(neg_images)*100:.1f}%)")

    full_report['hard_negatives'] = {
        'total_negatives': len(neg_images),
        'safe_rejections': safe_rejections,
        'false_positives': false_positives,
        'rejection_rate_pct': round(safe_rejections/len(neg_images)*100, 2),
        'samples': neg_results[:6]
    }

    # =========================================================================
    # PART 4: REAL-WORLD IMAGE QUALITY PERTURBATIONS
    # =========================================================================
    print("\n--- Part 4: Image Quality & Environmental Robustness Test ---")
    # Base clear images
    sample_battery = cv2.imread("dataset_ewaste_v1/test/images/battery_cables_test_001_6ac66a69.jpg")
    sample_motor = cv2.imread("dataset_ewaste_v1/test/images/motor_rf_test_001_bbe82820.jpg")
    sample_pcb = cv2.imread("dataset_ewaste_v1/test/images/pcb_s11_front_3.png")

    quality_tests = []

    # 1. Clean Baseline
    r_clean = evaluate_image(session, input_name, sample_motor)
    quality_tests.append({'condition': 'Clear Baseline (Motor)', 'status': r_clean['status'], 'conf': r_clean['confidence'], 'class': r_clean['top_class'], 'assigned': r_clean['assigned_category']})

    # 2. Moderate Blur (15x15)
    blurred_15 = cv2.GaussianBlur(sample_motor, (15, 15), 0)
    r_b15 = evaluate_image(session, input_name, blurred_15)
    quality_tests.append({'condition': 'Moderate Blur (Motor, k=15)', 'status': r_b15['status'], 'conf': r_b15['confidence'], 'class': r_b15['top_class'], 'assigned': r_b15['assigned_category']})

    # 3. Severe Blur (35x35)
    blurred_35 = cv2.GaussianBlur(sample_motor, (35, 35), 0)
    r_b35 = evaluate_image(session, input_name, blurred_35)
    quality_tests.append({'condition': 'Severe Blur (Motor, k=35)', 'status': r_b35['status'], 'conf': r_b35['confidence'], 'class': r_b35['top_class'], 'assigned': r_b35['assigned_category']})

    # 4. Low Light / Dark (40% brightness)
    dark_40 = (sample_motor * 0.40).astype(np.uint8)
    r_d40 = evaluate_image(session, input_name, dark_40)
    quality_tests.append({'condition': 'Low Light 40% (Motor)', 'status': r_d40['status'], 'conf': r_d40['confidence'], 'class': r_d40['top_class'], 'assigned': r_d40['assigned_category']})

    # 5. Very Dark (15% brightness)
    dark_15 = (sample_motor * 0.15).astype(np.uint8)
    r_d15 = evaluate_image(session, input_name, dark_15)
    quality_tests.append({'condition': 'Extreme Dark 15% (Motor)', 'status': r_d15['status'], 'conf': r_d15['confidence'], 'class': r_d15['top_class'], 'assigned': r_d15['assigned_category']})

    # 6. Overexposed / Glare (Brightened +80)
    glare = np.clip(sample_motor.astype(np.int16) + 80, 0, 255).astype(np.uint8)
    r_glare = evaluate_image(session, input_name, glare)
    quality_tests.append({'condition': 'Overexposed Glare (Motor)', 'status': r_glare['status'], 'conf': r_glare['confidence'], 'class': r_glare['top_class'], 'assigned': r_glare['assigned_category']})

    # 7. 50% Occlusion (Crop top half)
    h, w = sample_motor.shape[:2]
    occluded_crop = sample_motor[int(h*0.4):, :]
    r_occ = evaluate_image(session, input_name, occluded_crop)
    quality_tests.append({'condition': '50% Occlusion (Motor)', 'status': r_occ['status'], 'conf': r_occ['confidence'], 'class': r_occ['top_class'], 'assigned': r_occ['assigned_category']})

    # 8. Resolution Downscale (<200px)
    downscaled = cv2.resize(sample_battery, (180, 180))
    r_down = evaluate_image(session, input_name, downscaled)
    quality_tests.append({'condition': 'Low Resolution 180x180 (Battery)', 'status': r_down['status'], 'conf': r_down['confidence'], 'class': r_down['top_class'], 'assigned': r_down['assigned_category']})

    for qt in quality_tests:
        print(f"  {qt['condition']}: Status={qt['status']}, Conf={qt['conf']}, Class={qt['class']}, Assigned={qt['assigned']}")

    full_report['quality_perturbations'] = quality_tests

    # =========================================================================
    # PART 5: MULTI-OBJECT SIMULATION & COMPOSITING
    # =========================================================================
    print("\n--- Part 5: Multiple E-Waste Objects in One Image ---")
    # Composite: Place Battery on left, Motor on right
    comp_canvas = np.full((640, 1280, 3), 114, dtype=np.uint8)
    bat_res = cv2.resize(sample_battery, (640, 640))
    mot_res = cv2.resize(sample_motor, (640, 640))
    comp_canvas[:, :640] = bat_res
    comp_canvas[:, 640:] = mot_res

    multi_res = evaluate_image(session, input_name, comp_canvas)
    print(f"Composite (Battery Left + Motor Right):")
    print(f"  Status: {multi_res['status']}")
    print(f"  Num detections: {multi_res['num_detections']}")
    for idx, d in enumerate(multi_res['detections']):
        print(f"    Object {idx+1}: {d['class_name']} ({d['category']}), Score={d['score']}, Box={d['box_norm']}")

    full_report['multi_object_composite'] = {
        'status': multi_res['status'],
        'total_detected': multi_res['num_detections'],
        'objects': multi_res['detections']
    }

    # =========================================================================
    # PART 6: THRESHOLD CALIBRATION AUDIT
    # =========================================================================
    print("\n--- Part 6: Confidence Threshold Sensitivity Audit ---")
    # Collect all confidence scores across test set
    all_scores = []
    for img_p in glob.glob("dataset_ewaste_v1/test/images/*"):
        base = os.path.splitext(os.path.basename(img_p))[0]
        lbl_p = f"dataset_ewaste_v1/test/labels/{base}.txt"
        if not os.path.exists(lbl_p): continue
        with open(lbl_p, 'r') as f:
            content = f.read().strip()
            if not content: continue
        img = cv2.imread(img_p)
        if img is None: continue
        res = evaluate_image(session, input_name, img, min_score=0.10)
        if res['detections']:
            all_scores.append((res['detections'][0]['score'], res['detections'][0]['class_id'], base))

    thresholds_to_test = [0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.70]
    thresh_stats = {}
    for th in thresholds_to_test:
        passed = sum(1 for s in all_scores if s[0] >= th)
        thresh_stats[str(th)] = {
            'threshold': th,
            'passed_count': passed,
            'passed_pct': round(passed / len(all_scores) * 100, 2) if all_scores else 0
        }
        print(f"  Threshold >= {th:.2f}: {passed}/{len(all_scores)} candidates accepted ({thresh_stats[str(th)]['passed_pct']}%)")

    full_report['threshold_calibration'] = thresh_stats

    class NumpyEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, (np.floating, np.float32, np.float64)):
                return float(obj)
            if isinstance(obj, (np.integer, np.int32, np.int64)):
                return int(obj)
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            return super().default(obj)

    with open('ai/training/step11_real_world_validation_data.json', 'w') as f:
        json.dump(full_report, f, cls=NumpyEncoder, indent=2)

    print("\nStep 11 Validation Execution Complete. Saved to ai/training/step11_real_world_validation_data.json")

if __name__ == '__main__':
    main()
