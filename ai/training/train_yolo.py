#!/usr/bin/env python3
"""
Kabadiwala Connect — Custom 8-Class E-Waste YOLO Training Pipeline
SIH 2026 Problem Statement 26229 — Genuine Edge AI Pipeline

Trains an authentic Ultralytics object detection model (YOLOv8-Nano or YOLO11-Nano)
on real-world e-waste scrap imagery formatted in the frozen 8-class taxonomy.

Usage:
  python train_yolo.py --model yolov8n.pt --data data.yaml --epochs 100 --imgsz 416
  python train_yolo.py --model yolo11n.pt --data data.yaml --epochs 100 --imgsz 416 --batch 16
"""

import os
import sys
import argparse
import datetime
from pathlib import Path

def parse_args():
    parser = argparse.ArgumentParser(description="Kabadiwala Connect E-Waste YOLO Training")
    parser.add_argument('--model', type=str, default='yolov8n.pt',
                        choices=['yolov8n.pt', 'yolo11n.pt', 'yolov8s.pt', 'yolo11s.pt'],
                        help="Base pretrained backbone architecture (Default: yolov8n.pt)")
    parser.add_argument('--data', type=str, default='data.yaml',
                        help="Path to data.yaml dataset manifest")
    parser.add_argument('--epochs', type=int, default=100,
                        help="Number of training epochs (Default: 100)")
    parser.add_argument('--imgsz', type=int, default=416,
                        help="Input resolution square dimension (Default: 416 for fast Edge AI)")
    parser.add_argument('--batch', type=int, default=16,
                        help="Training batch size (Default: 16)")
    parser.add_argument('--device', type=str, default='',
                        help="Execution device: '0', '0,1', 'cpu' (Default: auto-detect)")
    parser.add_argument('--optimizer', type=str, default='AdamW',
                        choices=['AdamW', 'SGD', 'Adam', 'auto'],
                        help="Weight optimization algorithm (Default: AdamW)")
    parser.add_argument('--lr0', type=float, default=0.001,
                        help="Initial learning rate (Default: 0.001 for AdamW)")
    parser.add_argument('--patience', type=int, default=20,
                        help="Early stopping patience epochs without validation gain (Default: 20)")
    parser.add_argument('--seed', type=int, default=42,
                        help="Deterministic random seed for reproducibility (Default: 42)")
    parser.add_argument('--workers', type=int, default=4,
                        help="DataLoader worker threads (Default: 4, set to 0 for Windows if multiprocessing locks)")
    parser.add_argument('--project', type=str, default='runs/train',
                        help="Output directory for runs and checkpoints (Default: runs/train)")
    parser.add_argument('--name', type=str, default=None,
                        help="Custom run experiment name (Default: auto-generated timestamp)")
    return parser.parse_args()

def main():
    args = parse_args()

    # Ensure dataset manifest exists before proceeding
    manifest_path = Path(args.data).resolve()
    if not manifest_path.exists():
        print(f"[ERROR] Dataset manifest file not found: {manifest_path}")
        print("Please ensure data.yaml is correctly configured before initiating training.")
        sys.exit(1)

    # Autogenerate run name if not provided
    run_name = args.name
    if not run_name:
        arch_tag = Path(args.model).stem
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        run_name = f"ewaste_{arch_tag}_{args.imgsz}px_{timestamp}"

    print("\n" + "=" * 70)
    print("KABADIWALA CONNECT — E-WASTE MODEL TRAINING PIPELINE")
    print("=" * 70)
    print(f"Target Architecture:    {args.model}")
    print(f"Dataset Manifest:       {manifest_path}")
    print(f"Input Resolution:       {args.imgsz} x {args.imgsz}")
    print(f"Epochs:                 {args.epochs} (Early Stopping Patience: {args.patience})")
    print(f"Batch Size:             {args.batch}")
    print(f"Optimizer:              {args.optimizer} (lr0: {args.lr0})")
    print(f"Deterministic Seed:     {args.seed}")
    print(f"Run Output Folder:      {args.project}/{run_name}")
    print("=" * 70 + "\n")

    # Safe import of Ultralytics framework
    try:
        from ultralytics import YOLO
        import torch
    except ImportError as e:
        print(f"[CRITICAL ERROR] Missing machine learning runtime: {e}")
        print("Please install requirements using:")
        print("  pip install -r requirements.txt")
        sys.exit(1)

    # Detect device capabilities
    device_info = "CPU"
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram_gb = torch.cuda.get_device_properties(0).total_memory / 1e9
        device_info = f"CUDA GPU: {gpu_name} ({vram_gb:.1f} GB VRAM)"
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        device_info = "Apple Silicon MPS"
    print(f"[INFO] Execution Environment: {device_info}\n")

    # Initialize model from official architecture weights
    print(f"[INFO] Initializing backbone weights: {args.model}...")
    try:
        model = YOLO(args.model)
    except Exception as err:
        print(f"[ERROR] Failed loading base model {args.model}: {err}")
        sys.exit(1)

    # Define augmentation policy tuned for scrap yards
    # (Resistant to dust, rust patina Fe2O3, grease, and lighting shifts)
    train_hyperparameters = {
        "data": str(manifest_path),
        "epochs": args.epochs,
        "patience": args.patience,
        "batch": args.batch,
        "imgsz": args.imgsz,
        "save": True,
        "save_period": -1,       # Save only best and last checkpoints to conserve disk
        "cache": False,          # Avoid high RAM exhaustion on consumer machines
        "device": args.device if args.device else (0 if torch.cuda.is_available() else 'cpu'),
        "workers": args.workers,
        "project": args.project,
        "name": run_name,
        "exist_ok": False,
        "pretrained": True,
        "optimizer": args.optimizer,
        "verbose": True,
        "seed": args.seed,
        "deterministic": True,
        "single_cls": False,     # Strictly multi-class 8 taxonomy
        "rect": False,           # Standard square padding for consistent Edge AI deployment
        "cos_lr": True,          # Cosine annealing learning rate schedule
        "close_mosaic": 10,      # Disable mosaic augmentation for final 10 epochs for crisp bounding
        "resume": False,
        "amp": True,             # Automatic Mixed Precision for 2x faster GPU training

        # Photometric & Spatial Augmentations tailored for Indian scrap environments:
        "hsv_h": 0.015,          # Subtle hue shift
        "hsv_s": 0.5,            # Saturation jitter (greasy vs clean metal)
        "hsv_v": 0.4,            # Value/brightness jitter (dim godown vs harsh sunlight)
        "degrees": 15.0,         # Rotation tolerance for handheld angles
        "translate": 0.1,        # Translation jitter
        "scale": 0.5,            # Scale jitter 50% to 150% (macro vs distant shots)
        "shear": 2.0,            # Slight perspective distortion
        "perspective": 0.0005,   # Perspective tilt
        "flipud": 0.0,           # Scraps are photographed upright on scales/ground
        "fliplr": 0.5,           # Horizontal symmetry
        "mosaic": 1.0,           # Mosaic 4-image tiling (crucial for multi-object detection)
        "mixup": 0.10            # Mixup blending for dense multi-component scrap piles
    }

    print("[INFO] Initiating training run with frozen 8-class configuration...")
    try:
        results = model.train(**train_hyperparameters)
        print("\n" + "=" * 70)
        print("TRAINING RUN COMPLETE")
        print("=" * 70)
        print(f"Checkpoints and validation logs saved to: {args.project}/{run_name}")
        print(f"Best Weights: {args.project}/{run_name}/weights/best.pt")
        print(f"Last Weights: {args.project}/{run_name}/weights/last.pt")
        print("Next Step: Run evaluate_model.py on best.pt to verify confusion matrix.")
        print("=" * 70 + "\n")
    except Exception as train_err:
        print(f"[ERROR] Training execution failed: {train_err}")
        sys.exit(1)

if __name__ == '__main__':
    main()
