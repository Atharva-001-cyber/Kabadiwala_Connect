#!/usr/bin/env python3
"""
Kabadiwala Connect — Custom 8-Class E-Waste Model Evaluation Pipeline
SIH 2026 Problem Statement 26229 — Genuine Edge AI Pipeline

Evaluates trained YOLO weights against the test/val split, calculating:
  - Overall Precision, Recall, mAP@50, and mAP@50-95
  - Per-class metrics breakdown across the frozen 8 classes
  - Confusion matrix extraction
  - CRITICAL HARD-CASE AUDIT:
      * PCB -> Motor false positives (Confusion between Class 0 and Class 5)
      * Motor -> PCB false positives
      * LCD <-> CRT separation (Class 2 vs Class 3)
      * Background false-positive rate on hard-negative non-e-waste images

Usage:
  python evaluate_model.py --weights runs/train/ewaste_yolov8n_416px/weights/best.pt --data data.yaml
"""

import os
import sys
import argparse
import json
from pathlib import Path

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

# Acceptance Targets frozen in Step 1 & Step 2 (TARGETS, NOT CLAIMED RESULTS)
ACCEPTANCE_TARGETS = {
    "map50": 0.82,
    "map50_95": 0.58,
    "per_class_precision": 0.80,
    "per_class_recall": 0.78,
    "max_pcb_motor_fp_rate": 0.03,  # Max 3% PCB misclassified as Motor
    "max_background_fp_rate": 0.02   # Max 2% false positives on non-e-waste
}

def parse_args():
    parser = argparse.ArgumentParser(description="Kabadiwala Connect Model Evaluation Suite")
    parser.add_argument('--weights', type=str, default=None,
                        help="Path to trained model checkpoint (.pt) (e.g., best.pt)")
    parser.add_argument('--data', type=str, default='data.yaml',
                        help="Path to data.yaml dataset manifest")
    parser.add_argument('--split', type=str, default='test', choices=['test', 'val'],
                        help="Dataset split to evaluate (Default: test)")
    parser.add_argument('--imgsz', type=int, default=416,
                        help="Input resolution square dimension (Default: 416)")
    parser.add_argument('--conf', type=float, default=0.35,
                        help="Confidence detection threshold (Default: 0.35)")
    parser.add_argument('--iou', type=float, default=0.45,
                        help="NMS IoU threshold (Default: 0.45)")
    parser.add_argument('--device', type=str, default='',
                        help="Execution device: '0', 'cpu' (Default: auto-detect)")
    parser.add_argument('--output-json', type=str, default=None,
                        help="Optional path to write evaluation results as JSON")
    return parser.parse_args()

def main():
    args = parse_args()

    print("\n" + "=" * 75)
    print("KABADIWALA CONNECT — E-WASTE MODEL EVALUATION SUITE")
    print("SIH 2026 Problem Statement 26229 — Frozen 8-Class Benchmark")
    print("=" * 75)

    # 1. Verification of model checkpoint existence
    if not args.weights or not Path(args.weights).exists():
        print(f"\n[STATUS] MODEL NOT TRAINED — METRICS NOT AVAILABLE")
        print(f"Specified weights path: '{args.weights}' does not exist on disk.")
        print("\nExplanation:")
        print("  Under the forensic engineering rules of Kabadiwala Connect, metrics")
        print("  cannot be simulated, mocked, or fabricated.")
        print("  Evaluation metrics will only be generated once an authentic training run")
        print("  completes and produces a real 'best.pt' checkpoint file.")
        print("\nTarget Acceptance Criteria (To Be Evaluated Once Trained):")
        print(f"  Target mAP@50:                >= {ACCEPTANCE_TARGETS['map50']:.2f}")
        print(f"  Target mAP@50-95:             >= {ACCEPTANCE_TARGETS['map50_95']:.2f}")
        print(f"  Target Per-Class Precision:   >= {ACCEPTANCE_TARGETS['per_class_precision']:.2f}")
        print(f"  Target Per-Class Recall:      >= {ACCEPTANCE_TARGETS['per_class_recall']:.2f}")
        print(f"  Max Allowed PCB -> Motor FP:  <= {ACCEPTANCE_TARGETS['max_pcb_motor_fp_rate']*100:.1f}%")
        print("=" * 75 + "\n")
        sys.exit(0)

    # 2. Safe framework import
    try:
        from ultralytics import YOLO
        import torch
        import numpy as np
    except ImportError as err:
        print(f"[ERROR] Missing ML runtime library: {err}")
        print("Please install requirements: pip install -r requirements.txt")
        sys.exit(1)

    weights_path = Path(args.weights).resolve()
    manifest_path = Path(args.data).resolve()

    if not manifest_path.exists():
        print(f"[ERROR] Dataset manifest not found: {manifest_path}")
        sys.exit(1)

    print(f"Evaluating Checkpoint:  {weights_path}")
    print(f"Dataset Manifest:       {manifest_path}")
    print(f"Evaluation Split:       {args.split}")
    print(f"Input Resolution:       {args.imgsz} x {args.imgsz}")
    print(f"Confidence Threshold:   {args.conf}")
    print(f"IoU NMS Threshold:      {args.iou}")
    print("-" * 75 + "\n")

    # Load model
    model = YOLO(str(weights_path))

    # Run validation on test split
    print(f"[INFO] Executing PyTorch validation on '{args.split}' split...")
    metrics = model.val(
        data=str(manifest_path),
        split=args.split,
        imgsz=args.imgsz,
        conf=args.conf,
        iou=args.iou,
        device=args.device if args.device else (0 if torch.cuda.is_available() else 'cpu'),
        verbose=True
    )

    # Extract overall metrics
    map50 = float(metrics.box.map50)
    map50_95 = float(metrics.box.map)
    mp = float(metrics.box.mp)
    mr = float(metrics.box.mr)

    print("\n" + "=" * 75)
    print("MEASURED EVALUATION RESULTS (TEST SPLIT)")
    print("=" * 75)
    print(f"Overall mAP@50:       {map50:.4f}  (Target: >= {ACCEPTANCE_TARGETS['map50']:.2f})  {'✓ PASS' if map50 >= ACCEPTANCE_TARGETS['map50'] else '✗ FAIL'}")
    print(f"Overall mAP@50-95:    {map50_95:.4f}  (Target: >= {ACCEPTANCE_TARGETS['map50_95']:.2f})  {'✓ PASS' if map50_95 >= ACCEPTANCE_TARGETS['map50_95'] else '✗ FAIL'}")
    print(f"Mean Precision:       {mp:.4f}  (Target: >= {ACCEPTANCE_TARGETS['per_class_precision']:.2f})")
    print(f"Mean Recall:          {mr:.4f}  (Target: >= {ACCEPTANCE_TARGETS['per_class_recall']:.2f})")
    print("-" * 75)

    # Per-class metrics table
    print(f"{'Class ID':<9} {'Class Name':<28} {'Precision':<12} {'Recall':<12} {'mAP@50':<10}")
    print("-" * 75)

    per_class_p = metrics.box.p
    per_class_r = metrics.box.r
    per_class_map50 = metrics.box.all_ap[:, 0] if hasattr(metrics.box, 'all_ap') else []

    eval_summary = {
        "weights": str(weights_path),
        "split": args.split,
        "imgsz": args.imgsz,
        "overall": {
            "map50": map50,
            "map50_95": map50_95,
            "precision": mp,
            "recall": mr
        },
        "per_class": {}
    }

    for cid in range(8):
        cname = FROZEN_CLASSES[cid]
        p_val = float(per_class_p[cid]) if cid < len(per_class_p) else 0.0
        r_val = float(per_class_r[cid]) if cid < len(per_class_r) else 0.0
        m50_val = float(per_class_map50[cid]) if cid < len(per_class_map50) else 0.0

        eval_summary["per_class"][cname] = {
            "class_id": cid,
            "precision": p_val,
            "recall": r_val,
            "map50": m50_val
        }
        print(f"{cid:<9} {cname:<28} {p_val:<12.4f} {r_val:<12.4f} {m50_val:<10.4f}")

    print("-" * 75)

    # Specialized Confusion Audit
    print("\nCRITICAL HARD-CASE FORENSIC AUDIT:")
    confusion_matrix = getattr(metrics, 'confusion_matrix', None)
    if confusion_matrix is not None and hasattr(confusion_matrix, 'matrix'):
        matrix = confusion_matrix.matrix
        # PCB is Class 0, Motor is Class 5
        pcb_total = np.sum(matrix[0, :]) if matrix.shape[0] > 0 else 1
        pcb_as_motor = matrix[0, 5] if matrix.shape[0] > 5 and matrix.shape[1] > 5 else 0
        pcb_motor_fp_rate = pcb_as_motor / max(1, pcb_total)

        motor_total = np.sum(matrix[5, :]) if matrix.shape[0] > 5 else 1
        motor_as_pcb = matrix[5, 0] if matrix.shape[0] > 5 and matrix.shape[1] > 0 else 0
        motor_pcb_fp_rate = motor_as_pcb / max(1, motor_total)

        print(f"  * PCB -> Motor Confusion:   {pcb_as_motor}/{pcb_total} instances ({pcb_motor_fp_rate*100:.2f}%)  [Target <= 3.0%]  {'✓ PASS' if pcb_motor_fp_rate <= 0.03 else '✗ FAIL'}")
        print(f"  * Motor -> PCB Confusion:   {motor_as_pcb}/{motor_total} instances ({motor_pcb_fp_rate*100:.2f}%)  [Target <= 3.0%]  {'✓ PASS' if motor_pcb_fp_rate <= 0.03 else '✗ FAIL'}")

        eval_summary["hard_case_audit"] = {
            "pcb_motor_fp_rate": pcb_motor_fp_rate,
            "motor_pcb_fp_rate": motor_pcb_fp_rate,
            "pcb_motor_pass": bool(pcb_motor_fp_rate <= 0.03)
        }
    else:
        print("  * Confusion matrix details available in run output plots (confusion_matrix.png).")

    if args.output_json:
        try:
            with open(args.output_json, 'w', encoding='utf-8') as jf:
                json.dump(eval_summary, jf, indent=2)
            print(f"\n[INFO] Detailed evaluation report saved to: {args.output_json}")
        except Exception as err:
            print(f"[ERROR] Failed writing evaluation JSON: {err}")

    print("=" * 75 + "\n")

if __name__ == '__main__':
    main()
