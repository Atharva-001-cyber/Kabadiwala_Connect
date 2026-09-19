#!/usr/bin/env python3
"""
Kabadiwala Connect — Dataset Validation & Integrity Checker
SIH 2026 Problem Statement 26229 — Genuine Edge AI Pipeline

Audits the e-waste dataset against the frozen 8-class YOLO specification:
  1. Image readability and format integrity
  2. Missing labels and orphan label files
  3. YOLO label format validity (class_id cx cy w h)
  4. Normalized coordinate boundaries [0.0, 1.0]
  5. Class IDs strictly in range 0..7
  6. Hard-negative background validation (verified 0-byte label files)
  7. Exact duplicate detection via file hashing
  8. Cross-split session leakage detection
  9. Class balance and instance distribution statistics
  10. Invalid bounding boxes (w <= 0, h <= 0)

Usage:
  python dataset_check.py --data-dir path/to/dataset_ewaste_v1
  python dataset_check.py --data-yaml path/to/data.yaml --json-report qc_report.json
"""

import os
import sys
import argparse
import hashlib
import json
from pathlib import Path
from collections import defaultdict

# Frozen 8-Class Mapping (Step 1 & Step 2 Specification)
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

VALID_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}

def compute_file_hash(filepath, chunk_size=65536):
    """Compute SHA-256 hash of a file for duplicate detection."""
    sha256 = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            while chunk := f.read(chunk_size):
                sha256.update(chunk)
        return sha256.hexdigest()
    except Exception:
        return None

def verify_image_header(filepath):
    """Verify image header integrity without requiring third-party libraries."""
    try:
        with open(filepath, 'rb') as f:
            header = f.read(32)
            if len(header) < 8:
                return False, "File is under 8 bytes (truncated)"
            # JPEG: FF D8 FF
            if header.startswith(b'\xff\xd8\xff'):
                return True, "JPEG"
            # PNG: 89 50 4E 47 0D 0A 1A 0A
            if header.startswith(b'\x89PNG\r\n\x1a\n'):
                return True, "PNG"
            # WEBP: RIFF .... WEBP
            if header.startswith(b'RIFF') and b'WEBP' in header[:16]:
                return True, "WEBP"
            # BMP: BM
            if header.startswith(b'BM'):
                return True, "BMP"
            return False, f"Unrecognized image header magic bytes: {header[:4].hex()}"
    except Exception as e:
        return False, str(e)

def extract_session_id(filename):
    """Extract session or lot identifier from filename if present (e.g., session_001_xxx)."""
    base = Path(filename).stem
    parts = base.split('_')
    if len(parts) >= 2 and parts[0].lower() in {'session', 'lot', 'batch', 'set'}:
        return f"{parts[0].lower()}_{parts[1].lower()}"
    return None

def audit_dataset(data_dir):
    """Perform comprehensive audit on dataset root directory."""
    root_path = Path(data_dir).resolve()
    print(f"\n{'='*70}")
    print(f"KABADIWALA CONNECT — E-WASTE DATASET INTEGRITY AUDIT")
    print(f"Target Directory: {root_path}")
    print(f"{'='*70}\n")

    if not root_path.exists():
        print(f"[ERROR] Target dataset directory does not exist: {root_path}")
        return False, {"error": "Directory does not exist", "path": str(root_path)}

    splits = ['train', 'val', 'test']
    report = {
        "dataset_root": str(root_path),
        "splits_found": {},
        "summary": {
            "total_images": 0,
            "total_labels": 0,
            "total_instances": 0,
            "hard_negatives": 0,
            "corrupt_images": 0,
            "missing_labels": 0,
            "orphan_labels": 0,
            "invalid_boxes": 0,
            "out_of_range_classes": 0,
            "duplicate_images": 0,
            "session_leakages": 0
        },
        "class_distribution": defaultdict(int),
        "split_stats": {},
        "issues": []
    }

    image_hashes = {}
    session_to_splits = defaultdict(set)

    for split in splits:
        split_dir = root_path / split
        img_dir = split_dir / 'images'
        lbl_dir = split_dir / 'labels'

        split_stat = {
            "images": 0,
            "labels": 0,
            "hard_negatives": 0,
            "instances": 0,
            "class_counts": defaultdict(int),
            "errors": []
        }

        if not split_dir.exists():
            print(f"[WARNING] Partition '{split}/' not found in {root_path}")
            report["splits_found"][split] = False
            continue

        report["splits_found"][split] = True
        img_dir_exists = img_dir.exists()
        lbl_dir_exists = lbl_dir.exists()

        if not img_dir_exists:
            issue = f"Missing images directory: {split}/images"
            split_stat["errors"].append(issue)
            report["issues"].append(issue)
            print(f"[ERROR] {issue}")
            continue

        if not lbl_dir_exists:
            issue = f"Missing labels directory: {split}/labels"
            split_stat["errors"].append(issue)
            report["issues"].append(issue)
            print(f"[ERROR] {issue}")
            continue

        # Collect all image files
        image_files = {}
        for f in img_dir.iterdir():
            if f.is_file() and f.suffix.lower() in VALID_IMAGE_EXTENSIONS:
                image_files[f.stem] = f

        # Collect all label files
        label_files = {}
        for f in lbl_dir.iterdir():
            if f.is_file() and f.suffix.lower() == '.txt':
                label_files[f.stem] = f

        split_stat["images"] = len(image_files)
        split_stat["labels"] = len(label_files)
        report["summary"]["total_images"] += len(image_files)
        report["summary"]["total_labels"] += len(label_files)

        print(f"--- Checking Partition: {split.upper()} ---")
        print(f"  Images Found: {len(image_files)}")
        print(f"  Labels Found: {len(label_files)}")

        # 1. Check images for readability & duplicate hash
        for stem, img_path in image_files.items():
            valid_hdr, msg = verify_image_header(img_path)
            if not valid_hdr:
                issue = f"Corrupt image header in {split}/images/{img_path.name}: {msg}"
                report["summary"]["corrupt_images"] += 1
                split_stat["errors"].append(issue)
                report["issues"].append(issue)

            fhash = compute_file_hash(img_path)
            if fhash:
                if fhash in image_hashes:
                    orig_split, orig_path = image_hashes[fhash]
                    issue = f"Duplicate image: {split}/{img_path.name} is identical to {orig_split}/{orig_path.name}"
                    report["summary"]["duplicate_images"] += 1
                    report["issues"].append(issue)
                else:
                    image_hashes[fhash] = (split, img_path)

            session_id = extract_session_id(img_path.name)
            if session_id:
                session_to_splits[session_id].add(split)

            # Check matching label
            if stem not in label_files:
                issue = f"Missing label: Image {split}/images/{img_path.name} has no matching .txt in {split}/labels/"
                report["summary"]["missing_labels"] += 1
                split_stat["errors"].append(issue)
                report["issues"].append(issue)

        # 2. Check orphan labels
        for stem, lbl_path in label_files.items():
            if stem not in image_files:
                issue = f"Orphan label: {split}/labels/{lbl_path.name} has no matching image in {split}/images/"
                report["summary"]["orphan_labels"] += 1
                split_stat["errors"].append(issue)
                report["issues"].append(issue)

        # 3. Validate label contents
        for stem, lbl_path in label_files.items():
            try:
                content = lbl_path.read_text(encoding='utf-8', errors='replace').strip()
            except Exception as e:
                issue = f"Cannot read label {split}/labels/{lbl_path.name}: {e}"
                report["issues"].append(issue)
                continue

            # Hard-negative check: empty file
            if not content:
                split_stat["hard_negatives"] += 1
                report["summary"]["hard_negatives"] += 1
                continue

            lines = [ln.strip() for ln in content.splitlines() if ln.strip()]
            if not lines:
                split_stat["hard_negatives"] += 1
                report["summary"]["hard_negatives"] += 1
                continue

            for line_idx, line in enumerate(lines, 1):
                tokens = line.split()
                if len(tokens) != 5:
                    issue = (f"Invalid YOLO format in {split}/labels/{lbl_path.name} line {line_idx}: "
                             f"Expected 5 values (class_id cx cy w h), found {len(tokens)}: '{line}'")
                    report["summary"]["invalid_boxes"] += 1
                    report["issues"].append(issue)
                    continue

                try:
                    cid = int(tokens[0])
                    cx = float(tokens[1])
                    cy = float(tokens[2])
                    w = float(tokens[3])
                    h = float(tokens[4])
                except ValueError:
                    issue = f"Non-numeric values in {split}/labels/{lbl_path.name} line {line_idx}: '{line}'"
                    report["summary"]["invalid_boxes"] += 1
                    report["issues"].append(issue)
                    continue

                # Class ID check strictly 0..7
                if cid not in FROZEN_CLASSES:
                    issue = (f"Out-of-range class ID {cid} in {split}/labels/{lbl_path.name} line {line_idx}. "
                             f"Allowed class IDs are 0 to 7.")
                    report["summary"]["out_of_range_classes"] += 1
                    report["issues"].append(issue)
                else:
                    split_stat["class_counts"][cid] += 1
                    report["class_distribution"][cid] += 1

                # Coordinate boundary check
                coords_valid = (
                    0.0 <= cx <= 1.0 and
                    0.0 <= cy <= 1.0 and
                    0.0 < w <= 1.0 and
                    0.0 < h <= 1.0 and
                    (cx - w / 2) >= -0.05 and
                    (cx + w / 2) <= 1.05 and
                    (cy - h / 2) >= -0.05 and
                    (cy + h / 2) <= 1.05
                )
                if not coords_valid:
                    issue = (f"Invalid box geometry in {split}/labels/{lbl_path.name} line {line_idx}: "
                             f"cx={cx}, cy={cy}, w={w}, h={h}")
                    report["summary"]["invalid_boxes"] += 1
                    report["issues"].append(issue)

                split_stat["instances"] += 1
                report["summary"]["total_instances"] += 1

        report["split_stats"][split] = {
            "images": split_stat["images"],
            "labels": split_stat["labels"],
            "hard_negatives": split_stat["hard_negatives"],
            "instances": split_stat["instances"],
            "class_counts": dict(split_stat["class_counts"])
        }
        print(f"  Valid Instances: {split_stat['instances']}")
        print(f"  Hard Negatives (0-byte): {split_stat['hard_negatives']}\n")

    # 4. Check for Session Leakage across Train/Val/Test
    for session_id, split_set in session_to_splits.items():
        if len(split_set) > 1:
            issue = f"Session Leakage: {session_id} is split across multiple partitions: {sorted(list(split_set))}"
            report["summary"]["session_leakages"] += 1
            report["issues"].append(issue)

    # Print Final Summary Table
    print(f"{'='*70}")
    print(f"DATASET INTEGRITY AUDIT SUMMARY")
    print(f"{'='*70}")
    print(f"Total Images Analyzed:       {report['summary']['total_images']}")
    print(f"Total Labels Analyzed:       {report['summary']['total_labels']}")
    print(f"Total Bounding Boxes:        {report['summary']['total_instances']}")
    print(f"Verified Hard Negatives:     {report['summary']['hard_negatives']}")
    print(f"Corrupt Images:              {report['summary']['corrupt_images']}")
    print(f"Missing Labels:              {report['summary']['missing_labels']}")
    print(f"Orphan Labels:               {report['summary']['orphan_labels']}")
    print(f"Invalid Bounding Boxes:      {report['summary']['invalid_boxes']}")
    print(f"Out-of-Range Class IDs:      {report['summary']['out_of_range_classes']}")
    print(f"Duplicate Images:            {report['summary']['duplicate_images']}")
    print(f"Session Leakages:            {report['summary']['session_leakages']}")
    print(f"{'-'*70}")

    print("\nCLASS INSTANCE DISTRIBUTION (FROZEN 8 TAXONOMY):")
    print(f"{'ID':<4} {'Class Name':<28} {'Instances':<12} {'% of Total':<10}")
    print(f"{'-'*60}")
    total_inst = max(1, report['summary']['total_instances'])
    for cid in range(8):
        cname = FROZEN_CLASSES[cid]
        cnt = report['class_distribution'][cid]
        pct = (cnt / total_inst) * 100
        print(f"{cid:<4} {cname:<28} {cnt:<12} {pct:>6.2f}%")
    print(f"{'-'*60}\n")

    has_errors = (
        report['summary']['corrupt_images'] > 0 or
        report['summary']['missing_labels'] > 0 or
        report['summary']['invalid_boxes'] > 0 or
        report['summary']['out_of_range_classes'] > 0 or
        report['summary']['session_leakages'] > 0
    )

    if has_errors:
        print(f"[STATUS] AUDIT FAILED — {len(report['issues'])} issues detected. Fix before training.")
    elif report['summary']['total_images'] == 0:
        print(f"[STATUS] DATASET DIRECTORY IS EMPTY — No training data present.")
    else:
        print(f"[STATUS] AUDIT PASSED — Dataset is structurally valid for YOLOv8/YOLO11 training.")

    return not has_errors, report

def main():
    parser = argparse.ArgumentParser(description="Kabadiwala Connect YOLO Dataset Validator")
    parser.add_argument('--data-dir', type=str, default='../dataset_ewaste_v1',
                        help="Path to dataset root folder containing train/, val/, test/")
    parser.add_argument('--data-yaml', type=str, default=None,
                        help="Optional path to data.yaml manifest to extract dataset path")
    parser.add_argument('--json-report', type=str, default=None,
                        help="Optional output file path to write detailed JSON report")
    args = parser.parse_args()

    target_dir = args.data_dir
    if args.data_yaml and Path(args.data_yaml).exists():
        try:
            import yaml
            with open(args.data_yaml, 'r', encoding='utf-8') as yf:
                cfg = yaml.safe_load(yf)
                if 'path' in cfg:
                    yaml_dir = Path(args.data_yaml).parent
                    target_dir = (yaml_dir / cfg['path']).resolve()
        except ImportError:
            # Fallback text parsing if PyYAML not installed
            with open(args.data_yaml, 'r', encoding='utf-8') as yf:
                for line in yf:
                    if line.strip().startswith('path:'):
                        raw_path = line.split('path:')[1].strip().strip('"').strip("'")
                        yaml_dir = Path(args.data_yaml).parent
                        target_dir = (yaml_dir / raw_path).resolve()
                        break

    success, report = audit_dataset(target_dir)

    if args.json_report:
        try:
            with open(args.json_report, 'w', encoding='utf-8') as jf:
                json.dump(report, jf, indent=2, default=str)
            print(f"Detailed JSON report written to: {args.json_report}")
        except Exception as e:
            print(f"[ERROR] Failed writing JSON report: {e}")

    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
