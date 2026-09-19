#!/usr/bin/env python3
"""
Kabadiwala Connect — E-Waste YOLO to ONNX Export Pipeline
SIH 2026 Problem Statement 26229 — Genuine Edge AI Pipeline

Exports a trained PyTorch YOLO checkpoint (.pt) to an optimized ONNX model
for eventual client-side browser deployment via ONNX Runtime Web (WASM/WebGL).

Usage:
  python export_onnx.py --weights runs/train/ewaste_yolov8n_416px/weights/best.pt --imgsz 416 --opset 12
"""

import os
import sys
import argparse
from pathlib import Path

def parse_args():
    parser = argparse.ArgumentParser(description="Kabadiwala Connect YOLO ONNX Exporter")
    parser.add_argument('--weights', type=str, required=True,
                        help="Path to trained PyTorch weights (.pt) (e.g. best.pt)")
    parser.add_argument('--imgsz', type=int, default=416,
                        help="Target input resolution square dimension (Default: 416)")
    parser.add_argument('--opset', type=int, default=12,
                        help="ONNX Opset version compatible with ONNX Runtime Web (Default: 12)")
    parser.add_argument('--simplify', action='store_true', default=True,
                        help="Run onnxslim / onnx-simplifier for graph optimization (Default: True)")
    parser.add_argument('--half', action='store_true', default=False,
                        help="Export FP16 half-precision weights (Default: False, FP32 recommended for WebGL)")
    parser.add_argument('--output', type=str, default=None,
                        help="Optional destination path for exported .onnx model")
    return parser.parse_args()

def main():
    args = parse_args()

    weights_path = Path(args.weights).resolve()
    if not weights_path.exists():
        print(f"[ERROR] Trained weights file not found: {weights_path}")
        print("Please train the model first using train_yolo.py before attempting export.")
        sys.exit(1)

    print("\n" + "=" * 70)
    print("KABADIWALA CONNECT — E-WASTE MODEL ONNX EXPORT PIPELINE")
    print("=" * 70)
    print(f"Source Checkpoint:      {weights_path}")
    print(f"Input Resolution:       {args.imgsz} x {args.imgsz}")
    print(f"Target ONNX Opset:      {args.opset}")
    print(f"Graph Simplification:   {args.simplify}")
    print(f"Precision:              {'FP16 (Half)' if args.half else 'FP32 (Standard)'}")
    print("=" * 70 + "\n")

    try:
        from ultralytics import YOLO
    except ImportError as err:
        print(f"[ERROR] Missing Ultralytics framework: {err}")
        print("Please install requirements: pip install -r requirements.txt")
        sys.exit(1)

    # Load trained model
    print(f"[INFO] Loading PyTorch model from: {weights_path}...")
    model = YOLO(str(weights_path))

    # Execute Ultralytics ONNX export
    print(f"[INFO] Exporting to ONNX format (imgsz={args.imgsz}, opset={args.opset})...")
    try:
        exported_path_str = model.export(
            format='onnx',
            imgsz=args.imgsz,
            opset=args.opset,
            simplify=args.simplify,
            half=args.half,
            dynamic=False  # Fixed batch=1 dimension for optimal WebAssembly execution
        )
        exported_path = Path(exported_path_str).resolve()
    except Exception as export_err:
        print(f"[ERROR] Export execution failed: {export_err}")
        sys.exit(1)

    # Copy to custom output if specified
    if args.output:
        dest_path = Path(args.output).resolve()
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        import shutil
        shutil.copy2(exported_path, dest_path)
        exported_path = dest_path

    # Measure file size
    file_size_mb = exported_path.stat().st_size / (1024 * 1024)
    size_pass = file_size_mb <= 12.0

    print("\n" + "=" * 70)
    print("ONNX EXPORT VALIDATION")
    print("=" * 70)
    print(f"Exported File Path:     {exported_path}")
    print(f"Model File Size:        {file_size_mb:.2f} MB  (Target <= 12.0 MB)  {'✓ PASS' if size_pass else '✗ WARNING (Heavy for Web)'}")

    # Inspect exact ONNX tensor input and output shapes using onnx library
    try:
        import onnx
        onnx_model = onnx.load(str(exported_path))
        onnx.checker.check_model(onnx_model)
        print("ONNX Graph Structure:   ✓ Integrity Validated (onnx.checker.check_model passed)")

        # Query input tensors
        for inp in onnx_model.graph.input:
            shape = [dim.dim_value if dim.dim_value > 0 else 'dynamic' for dim in inp.type.tensor_type.shape.dim]
            print(f"  Input Tensor:         '{inp.name}' Shape: {shape}")

        # Query output tensors
        for out in onnx_model.graph.output:
            shape = [dim.dim_value if dim.dim_value > 0 else 'dynamic' for dim in out.type.tensor_type.shape.dim]
            print(f"  Output Tensor:        '{out.name}' Shape: {shape}")

    except ImportError:
        print("[INFO] onnx package not available for deep graph inspection. Install 'onnx' for shape audit.")
    except Exception as chk_err:
        print(f"[WARNING] ONNX graph inspection note: {chk_err}")

    print("\n" + "-" * 70)
    print("SAFETY NOTICE:")
    print("  This model is ready for browser integration in Step 4.")
    print("  DO NOT copy this file into frontend/public or replace visionClassifier.ts")
    print("  until full model evaluation passes all Step 3 criteria.")
    print("=" * 70 + "\n")

if __name__ == '__main__':
    main()
