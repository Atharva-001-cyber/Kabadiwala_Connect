import os
import cv2
import numpy as np
import onnxruntime as ort
import json

# Verified 8-class taxonomy
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
    
    # 114 gray background
    canvas = np.full((target_size, target_size, 3), 114, dtype=np.uint8)
    top = int(round(pad_y))
    left = int(round(pad_x))
    canvas[top:top+new_h, left:left+new_w] = resized

    # RGB and float32 normalized
    rgb = cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB)
    blob = rgb.astype(np.float32) / 255.0
    # HWC to CHW and add batch dimension [1, 3, 416, 416]
    blob = np.transpose(blob, (2, 0, 1))
    blob = np.expand_dims(blob, axis=0)

    return blob, orig_w, orig_h, scale, pad_x, pad_y

def compute_iou(box1, box2):
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    inter = max(0, x2 - x1) * max(0, y2 - y1)
    if inter <= 0:
        return 0.0

    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - inter
    return inter / union if union > 0 else 0.0

def run_nms(candidates, iou_thresh=0.45):
    candidates = sorted(candidates, key=lambda x: x['score'], reverse=True)
    selected = []
    suppressed = [False] * len(candidates)

    for i in range(len(candidates)):
        if suppressed[i]:
            continue
        c = candidates[i]
        selected.append(c)
        for j in range(i + 1, len(candidates)):
            if suppressed[j]:
                continue
            if compute_iou(c['box_xyxy'], candidates[j]['box_xyxy']) >= iou_thresh:
                suppressed[j] = True

    return selected

def decode_and_nms(output_data, orig_w, orig_h, scale, pad_x, pad_y):
    # output_data shape: [1, 12, 3549]
    output = output_data[0] # [12, 3549]
    num_anchors = output.shape[1]

    candidates = []
    for j in range(num_anchors):
        # row 0..3: cx, cy, w, h
        # row 4..11: class scores
        scores = output[4:12, j]
        best_cls = int(np.argmax(scores))
        max_score = float(scores[best_cls])

        if max_score < 0.25:
            continue

        cx = output[0, j]
        cy = output[1, j]
        w = output[2, j]
        h = output[3, j]

        # Convert back to original image space
        x1 = (cx - w / 2.0 - pad_x) / scale
        y1 = (cy - h / 2.0 - pad_y) / scale
        x2 = (cx + w / 2.0 - pad_x) / scale
        y2 = (cy + h / 2.0 - pad_y) / scale

        # Clamp
        x1 = max(0.0, min(float(orig_w), x1))
        y1 = max(0.0, min(float(orig_h), y1))
        x2 = max(0.0, min(float(orig_w), x2))
        y2 = max(0.0, min(float(orig_h), y2))

        bw = x2 - x1
        bh = y2 - y1
        if bw <= 4 or bh <= 4:
            continue

        x_norm = x1 / orig_w
        y_norm = y1 / orig_h
        w_norm = bw / orig_w
        h_norm = bh / orig_h

        candidates.append({
            'class_id': best_cls,
            'class_name': CLASSES[best_cls],
            'category': CATEGORY_MAPPING[best_cls],
            'score': max_score,
            'box_xyxy': [x1, y1, x2, y2],
            'box_norm': [round(x_norm, 4), round(y_norm, 4), round(w_norm, 4), round(h_norm, 4)]
        })

    return run_nms(candidates)

# Benchmark test items
test_cases = [
    {
        'id': 'TEST_01_PCB',
        'target_class': 'PCB_Circuit_Board',
        'path': 'dataset_ewaste_v1/test/images/pcb_Zedboard_jpg_1.jpg'
    },
    {
        'id': 'TEST_02_BATTERY',
        'target_class': 'Battery',
        'path': 'dataset_ewaste_v1/test/images/battery_cables_test_001_6ac66a69.jpg'
    },
    {
        'id': 'TEST_03_MOTOR',
        'target_class': 'Electric_Motor',
        'path': 'dataset_ewaste_v1/test/images/motor_rf_test_001_bbe82820.jpg'
    },
    {
        'id': 'TEST_04_MAGNET',
        'target_class': 'Magnet_bearing_Assembly',
        'path': 'dataset_ewaste_v1/test/images/magnet_rf_test_001_30b78b09.jpg'
    },
    {
        'id': 'TEST_05_CABLE',
        'target_class': 'Cable_Wire',
        'path': 'dataset_ewaste_v1/test/images/cable_rf_test_001_761d2632.jpg'
    },
    {
        'id': 'TEST_06_CRT',
        'target_class': 'CRT',
        'path': 'dataset_ewaste_v1/test/images/crt_rf_test_001_c28745a0.jpg'
    },
    {
        'id': 'TEST_07_LCD',
        'target_class': 'LCD_LED_Display',
        'path': 'dataset_ewaste_v1/test/images/oi_4342a7037ea1bdea.jpg'
    },
    {
        'id': 'TEST_08_MIXED',
        'target_class': 'Mixed_EWaste',
        'path': 'dataset_ewaste_v1/test/images/oi_012dc31b561d4214.jpg'
    },
    {
        'id': 'TEST_09_HARD_NEGATIVE',
        'target_class': 'Hard_Negative',
        'path': 'dataset_ewaste_v1/test/images/oi_neg_0013ea2087020901.jpg'
    },
    {
        'id': 'TEST_10_BLURRY',
        'target_class': 'Blurry_Image',
        'path': 'dataset_ewaste_v1/test/images/cable_rf_test_002_4de6c66a.jpg',
        'apply_blur': True
    }
]

print("Initializing ONNX Inference Session with:", MODEL_PATH)
session = ort.InferenceSession(MODEL_PATH)
input_name = session.get_inputs()[0].name
print(f"Session ready. Input name: {input_name}")

results = []

for case in test_cases:
    path = case['path']
    if not os.path.exists(path):
        print(f"File not found: {path}")
        continue

    img = cv2.imread(path)
    if img is None:
        print(f"Failed to read image: {path}")
        continue

    if case.get('apply_blur'):
        img = cv2.GaussianBlur(img, (25, 25), 0)

    blob, orig_w, orig_h, scale, pad_x, pad_y = letterbox_image(img)
    outputs = session.run(None, {input_name: blob})
    output_tensor = outputs[0]

    detections = decode_and_nms(output_tensor, orig_w, orig_h, scale, pad_x, pad_y)

    if len(detections) > 0:
        top = detections[0]
        conf = top['score']
        cat = top['category']
        cls_name = top['class_name']
        box = top['box_norm']
        has_box = True
        if conf >= 0.70:
            status = 'DETECTED_HIGH'
            low_conf_triggered = False
            assigned_category = cat
        elif conf >= 0.50:
            status = 'DETECTED_MEDIUM'
            low_conf_triggered = False
            assigned_category = cat
        else:
            status = 'LOW_CONFIDENCE'
            low_conf_triggered = True
            assigned_category = None
            has_box = False # Suppressed from final display per policy
    else:
        conf = 0.0
        cat = None
        cls_name = None
        box = None
        has_box = False
        status = 'NO_DETECTION'
        low_conf_triggered = True
        assigned_category = None

    res = {
        'test_id': case['id'],
        'target_class': case['target_class'],
        'image_path': path,
        'image_dims': f"{orig_w}x{orig_h}",
        'status': status,
        'predicted_class': cls_name,
        'assigned_category': assigned_category,
        'confidence': round(conf, 4),
        'has_box': has_box,
        'box_norm': [float(coord) for coord in box] if has_box and box is not None else None,
        'num_detections': len(detections),
        'low_conf_triggered': low_conf_triggered
    }
    results.append(res)
    print(f"\n--- {case['id']} ({case['target_class']}) ---")
    print(f"  Image: {os.path.basename(path)} ({orig_w}x{orig_h})")
    print(f"  Status: {status}")
    print(f"  Predicted: {cls_name} (Conf: {conf:.4f})")
    print(f"  Assigned Category: {assigned_category}")
    print(f"  Detection Box Rendered: {has_box} (Box: {res['box_norm']})")
    print(f"  Low-Confidence Logic Triggered: {low_conf_triggered}")

with open('ai/training/step10_benchmark_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\nBenchmark completed. Results saved to ai/training/step10_benchmark_results.json")
