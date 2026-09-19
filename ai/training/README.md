# Kabadiwala Connect — AI Model Training & Evaluation Pipeline
**SIH 2026 Problem Statement 26229 — Genuine Edge AI Pipeline**

This directory contains the standalone, reproducible training and evaluation suite for the custom 8-class e-waste object detection model. It is completely isolated from the production React frontend and backend services.

---

## 1. Directory Overview
```
ai/training/
├── data.yaml            # Frozen 8-class YOLO training dataset manifest
├── dataset_check.py     # Forensic dataset validator (format, boxes, leakage, corruption)
├── train_yolo.py        # Ultralytics training launcher (YOLOv8n / YOLO11n)
├── evaluate_model.py    # Evaluation suite & PCB vs. Motor confusion matrix audit
├── export_onnx.py       # ONNX export and graph tensor shape auditor
├── requirements.txt     # Standalone Python dependencies
└── README.md            # Execution manual
```

---

## 2. Frozen 8-Class Taxonomy
Class IDs strictly match the Step 1 & Step 2 specifications:
* **Class 0:** `PCB_Circuit_Board` (CPCB: ITEW1 - ITEW6)
* **Class 1:** `Battery` (CPCB: BATT-01)
* **Class 2:** `CRT` (CPCB: CEEW1)
* **Class 3:** `LCD_LED_Display` (CPCB: CEEW2)
* **Class 4:** `Cable_Wire` (CPCB: ITEW11)
* **Class 5:** `Electric_Motor` (CPCB: CEEW5)
* **Class 6:** `Magnet_bearing_Assembly` (CPCB: ITEW14)
* **Class 7:** `Mixed_EWaste` (CPCB: EWP-01)

*Note: Non-e-waste items (bottles, shoes, cardboard, clothing, domestic plastics) are Hard Negatives represented by empty (0-byte) label files. They are NOT separate classes.*

---

## 3. Step-by-Step Execution Workflow

### Step A: Environment Setup
Create a dedicated Python virtual environment (Python 3.9 - 3.11):
```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

### Step B: Dataset Validation
Before initiating training, audit the dataset integrity:
```bash
python dataset_check.py --data-dir ../dataset_ewaste_v1
# Or using data.yaml:
python dataset_check.py --data-yaml data.yaml --json-report dataset_qc_report.json
```
Ensure that the audit reports **0 corrupt images**, **0 missing labels**, **0 invalid boxes**, and **0 session leakages**.

### Step C: Model Training
Launch the baseline training run (default: YOLOv8-Nano, 416x416 resolution, 100 epochs):
```bash
python train_yolo.py --model yolov8n.pt --data data.yaml --epochs 100 --imgsz 416 --batch 16
```
To evaluate YOLO11-Nano:
```bash
python train_yolo.py --model yolo11n.pt --data data.yaml --epochs 100 --imgsz 416 --batch 16
```

### Step D: Forensic Evaluation & Hard-Case Audit
Evaluate the resulting `best.pt` on the test split:
```bash
python evaluate_model.py --weights runs/train/ewaste_yolov8n_416px/weights/best.pt --data data.yaml --split test
```
Verify that:
- Overall mAP@50 $\ge 0.82$
- Overall mAP@50-95 $\ge 0.58$
- **PCB $\rightarrow$ Motor False Positive Rate $\le 3.0\%$** (Crucial test case)
- **Motor $\rightarrow$ PCB False Positive Rate $\le 3.0\%$**

### Step E: ONNX Export for Edge AI
Export the verified checkpoint to WebAssembly/WebGL-compatible ONNX:
```bash
python export_onnx.py --weights runs/train/ewaste_yolov8n_416px/weights/best.pt --imgsz 416 --opset 12
```
Verify that the output `.onnx` file size is $\le 12\text{ MB}$.

---

## 4. Production Safety Rules
- **DO NOT** import these Python files into the React frontend.
- **DO NOT** overwrite `frontend/src/utils/visionClassifier.ts` until Step 4 (Client Runtime Integration) is approved.
- All existing production workflows (Collector, Recycler, Admin, GPS, Mandi prices, Payments) remain 100% operational and isolated.
