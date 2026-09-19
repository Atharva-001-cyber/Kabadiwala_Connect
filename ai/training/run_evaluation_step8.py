"""
run_evaluation_step8.py

Evaluates the trained YOLOv8-Nano checkpoint:
  ai/training/runs/ewaste_yolov8n_v1/weights/best.pt
on both the VALIDATION and TEST splits using the frozen 8-class taxonomy.

Extracts:
- Overall Precision, Recall, mAP50, mAP50-95
- Per-class metrics breakdown across all 8 classes
- Confusion matrix extraction and normalized rates
- Forensic confusion pairs:
    * PCB -> Motor
    * Motor -> PCB
    * CRT -> LCD
    * LCD -> CRT
    * Cable false positives
    * Magnet false positives
    * Background false positives
- Visual predictions on representative unseen test images
- Results saved to JSON and printed for reporting
"""

import os
import sys
import json
from pathlib import Path
import numpy as np
import pandas as pd
from ultralytics import YOLO

# Frozen 8-Class Mapping
FROZEN_CLASSES = {
    0: 'PCB_Circuit_Board',
    1: 'Battery',
    2: 'CRT',
    3: 'LCD_LED_Display',
    4: 'Cable_Wire',
    5: 'Electric_Motor',
    6: 'Magnet_bearing_Assembly',
    7: 'Mixed_EWaste'
}

TARGETS = {
    "map50": 0.82,
    "map50_95": 0.58,
    "precision": 0.80,
    "recall": 0.78,
    "max_pcb_motor_fp_rate": 0.03,
    "max_motor_pcb_fp_rate": 0.03,
    "max_background_fp_rate": 0.02
}

def analyze_confusion(matrix, class_names):
    """
    matrix: (num_classes + 1, num_classes + 1) where last row/col is background
    Rows: Ground Truth
    Cols: Predicted
    """
    results = {}
    n_cls = len(class_names)
    
    # PCB is 0, Motor is 5
    pcb_total = float(np.sum(matrix[0, :])) if matrix.shape[0] > 0 else 1.0
    pcb_as_motor = float(matrix[0, 5]) if matrix.shape[0] > 0 and matrix.shape[1] > 5 else 0.0
    pcb_motor_rate = pcb_as_motor / max(1.0, pcb_total)
    
    motor_total = float(np.sum(matrix[5, :])) if matrix.shape[0] > 5 else 1.0
    motor_as_pcb = float(matrix[5, 0]) if matrix.shape[0] > 5 and matrix.shape[1] > 0 else 0.0
    motor_pcb_rate = motor_as_pcb / max(1.0, motor_total)

    # CRT is 2, LCD is 3
    crt_total = float(np.sum(matrix[2, :])) if matrix.shape[0] > 2 else 1.0
    crt_as_lcd = float(matrix[2, 3]) if matrix.shape[0] > 2 and matrix.shape[1] > 3 else 0.0
    crt_lcd_rate = crt_as_lcd / max(1.0, crt_total)

    lcd_total = float(np.sum(matrix[3, :])) if matrix.shape[0] > 3 else 1.0
    lcd_as_crt = float(matrix[3, 2]) if matrix.shape[0] > 3 and matrix.shape[1] > 2 else 0.0
    lcd_crt_rate = lcd_as_crt / max(1.0, lcd_total)

    # Background false positives: Ground truth is background (last row: index n_cls), predicted as any class (cols 0..n_cls-1)
    bg_row_idx = n_cls
    bg_total = float(np.sum(matrix[bg_row_idx, :])) if matrix.shape[0] > bg_row_idx else 0.0
    bg_as_classes = float(np.sum(matrix[bg_row_idx, :n_cls])) if matrix.shape[0] > bg_row_idx else 0.0
    bg_fp_rate = bg_as_classes / max(1.0, bg_total) if bg_total > 0 else 0.0

    # Class predictions that were actually background (false positives from background)
    # Column j sum of background row: matrix[bg_row_idx, j]
    class_bg_fp = {}
    for cid in range(n_cls):
        cname = class_names[cid]
        col_total = float(np.sum(matrix[:, cid]))
        from_bg = float(matrix[bg_row_idx, cid]) if matrix.shape[0] > bg_row_idx else 0.0
        class_bg_fp[cname] = {
            "predicted_total": col_total,
            "false_alarms_from_bg": from_bg,
            "rate": from_bg / max(1.0, col_total) if col_total > 0 else 0.0
        }

    # Missed detections (predicted as background): col index n_cls
    missed_by_class = {}
    for cid in range(n_cls):
        cname = class_names[cid]
        gt_total = float(np.sum(matrix[cid, :]))
        missed = float(matrix[cid, n_cls]) if matrix.shape[1] > n_cls else 0.0
        missed_by_class[cname] = {
            "ground_truth_total": gt_total,
            "missed_as_background": missed,
            "miss_rate": missed / max(1.0, gt_total) if gt_total > 0 else 0.0
        }

    results["pcb_as_motor"] = {"count": pcb_as_motor, "total": pcb_total, "rate": pcb_motor_rate}
    results["motor_as_pcb"] = {"count": motor_as_pcb, "total": motor_total, "rate": motor_pcb_rate}
    results["crt_as_lcd"] = {"count": crt_as_lcd, "total": crt_total, "rate": crt_lcd_rate}
    results["lcd_as_crt"] = {"count": lcd_as_crt, "total": lcd_total, "rate": lcd_crt_rate}
    results["background_false_positives"] = {"count": bg_as_classes, "total": bg_total, "rate": bg_fp_rate}
    results["false_alarms_by_class"] = class_bg_fp
    results["missed_by_class"] = missed_by_class
    return results

def evaluate_split(model, data_yaml, split_name, imgsz=416, conf=0.25, iou=0.5):
    print(f"\n{'='*70}\nEVALUATING SPLIT: {split_name.upper()}\n{'='*70}")
    metrics = model.val(
        data=data_yaml,
        split=split_name,
        imgsz=imgsz,
        conf=conf,
        iou=iou,
        device='cpu',
        verbose=True,
        plots=True
    )
    
    mp = float(metrics.box.mp)
    mr = float(metrics.box.mr)
    map50 = float(metrics.box.map50)
    map50_95 = float(metrics.box.map)

    print(f"\n--- {split_name.upper()} OVERALL METRICS ---")
    print(f"Precision:  {mp:.4f}  (Target >= {TARGETS['precision']:.2f})  {'[PASS]' if mp >= TARGETS['precision'] else '[NOT MET]'}")
    print(f"Recall:     {mr:.4f}  (Target >= {TARGETS['recall']:.2f})  {'[PASS]' if mr >= TARGETS['recall'] else '[NOT MET]'}")
    print(f"mAP@50:     {map50:.4f}  (Target >= {TARGETS['map50']:.2f})  {'[PASS]' if map50 >= TARGETS['map50'] else '[NOT MET]'}")
    print(f"mAP@50-95:  {map50_95:.4f}  (Target >= {TARGETS['map50_95']:.2f})  {'[PASS]' if map50_95 >= TARGETS['map50_95'] else '[NOT MET]'}")

    per_class_p = metrics.box.p
    per_class_r = metrics.box.r
    per_class_map50 = metrics.box.all_ap[:, 0] if hasattr(metrics.box, 'all_ap') else []
    per_class_map50_95 = metrics.box.ap50 if hasattr(metrics.box, 'ap50') else []

    print(f"\n--- {split_name.upper()} PER-CLASS BREAKDOWN ---")
    print(f"{'ID':<4} {'Class Name':<26} {'Precision':<12} {'Recall':<12} {'mAP@50':<10} {'mAP@50-95':<10}")
    print("-" * 74)
    
    per_class_summary = {}
    for cid in range(8):
        cname = FROZEN_CLASSES[cid]
        p_val = float(per_class_p[cid]) if cid < len(per_class_p) else 0.0
        r_val = float(per_class_r[cid]) if cid < len(per_class_r) else 0.0
        m50_val = float(per_class_map50[cid]) if cid < len(per_class_map50) else 0.0
        m50_95_val = float(metrics.box.ap[cid]) if hasattr(metrics.box, 'ap') and cid < len(metrics.box.ap) else 0.0

        per_class_summary[cname] = {
            "class_id": cid,
            "precision": p_val,
            "recall": r_val,
            "map50": m50_val,
            "map50_95": m50_95_val
        }
        print(f"{cid:<4} {cname:<26} {p_val:<12.4f} {r_val:<12.4f} {m50_val:<10.4f} {m50_95_val:<10.4f}")

    # Confusion matrix
    cm_results = None
    if hasattr(metrics, 'confusion_matrix') and metrics.confusion_matrix is not None:
        matrix = metrics.confusion_matrix.matrix
        cm_results = analyze_confusion(matrix, FROZEN_CLASSES)
        print(f"\n--- {split_name.upper()} FORENSIC CONFUSION AUDIT ---")
        print(f"PCB -> Motor False Positives: {cm_results['pcb_as_motor']['count']:.0f}/{cm_results['pcb_as_motor']['total']:.0f} ({cm_results['pcb_as_motor']['rate']*100:.2f}%)  [Target <= 3.0%]  {'[PASS]' if cm_results['pcb_as_motor']['rate'] <= 0.03 else '[NOT MET]'}")
        print(f"Motor -> PCB False Positives: {cm_results['motor_as_pcb']['count']:.0f}/{cm_results['motor_as_pcb']['total']:.0f} ({cm_results['motor_as_pcb']['rate']*100:.2f}%)  [Target <= 3.0%]  {'[PASS]' if cm_results['motor_as_pcb']['rate'] <= 0.03 else '[NOT MET]'}")
        print(f"CRT -> LCD Confusion:         {cm_results['crt_as_lcd']['count']:.0f}/{cm_results['crt_as_lcd']['total']:.0f} ({cm_results['crt_as_lcd']['rate']*100:.2f}%)")
        print(f"LCD -> CRT Confusion:         {cm_results['lcd_as_crt']['count']:.0f}/{cm_results['lcd_as_crt']['total']:.0f} ({cm_results['lcd_as_crt']['rate']*100:.2f}%)")
        print(f"Background False Positive Rate: {cm_results['background_false_positives']['count']:.0f}/{cm_results['background_false_positives']['total']:.0f} ({cm_results['background_false_positives']['rate']*100:.2f}%)")

    return {
        "overall": {
            "precision": mp,
            "recall": mr,
            "map50": map50,
            "map50_95": map50_95
        },
        "per_class": per_class_summary,
        "confusion": cm_results
    }

def main():
    weights_path = Path("ai/training/runs/ewaste_yolov8n_v1/weights/best.pt").resolve()
    data_yaml = Path("ai/training/data.yaml").resolve()
    results_csv = Path("ai/training/runs/ewaste_yolov8n_v1/results.csv").resolve()

    if not weights_path.exists():
        print(f"ERROR: Checkpoint not found: {weights_path}")
        sys.exit(1)

    print("======================================================================")
    print("STEP 8: OBJECTIVE EVALUATION OF EXISTING YOLOv8-NANO CHECKPOINT")
    print(f"Checkpoint: {weights_path}")
    print(f"Data:       {data_yaml}")
    print("======================================================================")

    # 1. Best Epoch from results.csv
    best_epoch_info = {}
    if results_csv.exists():
        df = pd.read_csv(results_csv)
        df.columns = [c.strip() for c in df.columns]
        best_idx = df['metrics/mAP50(B)'].idxmax()
        best_row = df.iloc[best_idx]
        best_epoch_info = {
            "total_epochs_recorded": len(df),
            "best_epoch": int(best_row['epoch']),
            "best_epoch_map50": float(best_row['metrics/mAP50(B)']),
            "best_epoch_map50_95": float(best_row['metrics/mAP50-95(B)']),
            "best_epoch_precision": float(best_row['metrics/precision(B)']),
            "best_epoch_recall": float(best_row['metrics/recall(B)']),
            "best_epoch_val_box_loss": float(best_row['val/box_loss']),
            "best_epoch_val_cls_loss": float(best_row['val/cls_loss'])
        }
        print("\n--- RESULTS.CSV AUDIT ---")
        print(f"Total Epochs Recorded: {best_epoch_info['total_epochs_recorded']}")
        print(f"Best Epoch by mAP50:   {best_epoch_info['best_epoch']}")
        print(f"  mAP@50:              {best_epoch_info['best_epoch_map50']:.4f}")
        print(f"  mAP@50-95:           {best_epoch_info['best_epoch_map50_95']:.4f}")
        print(f"  Precision:           {best_epoch_info['best_epoch_precision']:.4f}")
        print(f"  Recall:              {best_epoch_info['best_epoch_recall']:.4f}")

    # 2. Load model
    model = YOLO(str(weights_path))

    # 3. Evaluate on Validation Split
    val_results = evaluate_split(model, str(data_yaml), "val", imgsz=416)

    # 4. Evaluate on Test Split
    test_results = evaluate_split(model, str(data_yaml), "test", imgsz=416)

    # 5. Visual predictions on representative unseen test images
    print("\n" + "=" * 70)
    print("GENERATING VISUAL PREDICTIONS ON UNSEEN TEST IMAGES")
    print("=" * 70)
    test_img_dir = Path("dataset_ewaste_v1/test/images")
    output_pred_dir = Path("ai/training/runs/ewaste_yolov8n_v1/test_predictions")
    output_pred_dir.mkdir(parents=True, exist_ok=True)

    # Pick representative samples across categories from test split
    sample_images = []
    if test_img_dir.exists():
        all_test = sorted([f for f in os.listdir(test_img_dir) if f.endswith(('.jpg', '.jpeg', '.png'))])
        # Pick samples covering pcb, battery, crt, lcd, cable, motor, magnet, mixed, negative
        for prefix in ['pcb', 'battery', 'crt', 'lcd', 'cable', 'motor', 'magnet', 'mixed', 'neg']:
            match = [f for f in all_test if prefix in f.lower()]
            if match:
                sample_images.append(match[0])
                if len(match) > 1:
                    sample_images.append(match[1])
        if len(sample_images) == 0:
            sample_images = all_test[:10]

    visual_pred_summary = []
    for img_name in sample_images:
        img_path = test_img_dir / img_name
        pred_res = model.predict(source=str(img_path), conf=0.25, imgsz=416, device='cpu', save=False, verbose=False)
        boxes = pred_res[0].boxes
        detections = []
        if boxes is not None and len(boxes) > 0:
            for b in boxes:
                cls_id = int(b.cls[0])
                conf_score = float(b.conf[0])
                detections.append({
                    "class_id": cls_id,
                    "class_name": FROZEN_CLASSES.get(cls_id, f"unknown_{cls_id}"),
                    "confidence": round(conf_score, 4),
                    "xyxy": [round(float(x), 2) for x in b.xyxy[0].tolist()]
                })
        visual_pred_summary.append({
            "image": img_name,
            "detection_count": len(detections),
            "detections": detections
        })
        print(f"  {img_name}: {len(detections)} detection(s) -> {[d['class_name'] + ' (' + str(d['confidence']) + ')' for d in detections]}")

    # 6. Save consolidated evaluation JSON
    consolidated_report = {
        "checkpoint": str(weights_path),
        "data_yaml": str(data_yaml),
        "frozen_classes": FROZEN_CLASSES,
        "targets": TARGETS,
        "results_csv_best_epoch": best_epoch_info,
        "val_split_metrics": val_results,
        "test_split_metrics": test_results,
        "visual_predictions": visual_pred_summary
    }

    out_json = Path("ai/training/runs/ewaste_yolov8n_v1/evaluation_report.json")
    with open(out_json, "w", encoding="utf-8") as jf:
        json.dump(consolidated_report, jf, indent=2)
    print(f"\nConsolidated evaluation report saved to: {out_json}")

if __name__ == '__main__':
    main()
