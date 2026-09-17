# STEP 7 — Authenticated Roboflow Data Acquisition Report
**Project:** Kabadiwala Connect  
**SIH 2026 Problem Statement:** 26229  
**Feature:** AI-Powered E-Waste Material Identification (Genuine Edge AI Pipeline)  
**Document:** Step 7 Authenticated Roboflow Data Acquisition & Ingestion Report  
**Date:** 16-09-2026  
**Status:** TRAINING GATE CANDIDATE — DATASET COMPLETE  

---

## 1. Authentication Result

- **API Endpoint:** Authenticated Roboflow Universe REST API (`https://api.roboflow.com/*`).
- **Credential Status:** `ROBOFLOW_API_KEY` was successfully configured in the environment, loaded securely, and verified via HTTPS request.
- **HTTP Response:** `200 OK` across all project export endpoints.
- **Security Confirmation:** The API key was strictly kept in memory / git-ignored `.env`, never printed, logged, echoed, committed, or exposed in any report or artifact.

---

## 2. Datasets Accessed

| Source Identifier | Version | Export Format | Size (MB) | Purpose / Target Classes |
|-------------------|:-------:|:-------------:|:---------:|--------------------------|
| `project-3swgf/electric-motor-housing1` | v1 | YOLOv8 | 11.49 MB | Class 5 — Electric Motor |
| `trcproject/e-waste-detection-model` | v5 | YOLOv8 | 51.07 MB | Class 4 — Cable / Wire & Class 6 — Magnet-bearing Assembly |
| `amandeep-etjdw/crt` | v1 | YOLOv8 | 225.54 MB | Class 2 — CRT |

---

## 3. Datasets Blocked / Rejected

1. **`bruce/motor-stator`:**
   - **Inspection Finding:** Roboflow project type is `text-image-pairs` (vision-language captioning model), lacking object-detection bounding boxes and unsupported for YOLOv8 export (`400 Bad Request: YOLOv8 export format is not supported for text-image-pairs projects`).
   - **Action:** Rejected. Replaced with `project-3swgf/electric-motor-housing1` (v1, CC BY 4.0), a genuine object detection dataset of electric motors and stators.
2. **Non-Target Classes in `trcproject/e-waste-detection-model`:**
   - **Inspection Finding:** Source dataset contains 13 classes, including peripheral devices and unrelated consumer items (Keyboards, Network Switches, Remote controls, Routers, Smart Phones, USB Flash Drives, Computer Mice).
   - **Action:** Rejected all non-target annotations. Ingested only pure images containing Class 10 (`cable`) and Class 2/12 (`HDD` / `internal HDD`).
3. **Redundant Augmentation Frames in `amandeep-etjdw/crt`:**
   - **Inspection Finding:** Dataset contains 3,024 augmented variations generated from 295 distinct base video frames.
   - **Action:** Deduplicated down to distinct video scenes (1 representative unaugmented frame per base scene) with 1 to 4 clean bounding boxes, preventing session leakage and overfitting.

---

## 4. License & Provenance Verification

| Dataset Name | Workspace / Source | Stated License | Commercial & Public Clearance | Provenance Status |
|--------------|--------------------|----------------|:-----------------------------:|:-----------------:|
| Electric Motor Housing | `project-3swgf` | CC BY 4.0 | Fully Cleared | VERIFIED (in `data.yaml` & `README.roboflow.txt`) |
| TRC E-Waste Detection Model | `trcproject` | CC BY 4.0 | Fully Cleared | VERIFIED (in `data.yaml` & `README.roboflow.txt`) |
| CRT | `amandeep-etjdw` | CC BY 4.0 | Fully Cleared | VERIFIED (in `data.yaml` & `README.roboflow.txt`) |

All three acquired datasets are legally cleared under the **Creative Commons Attribution 4.0 International (CC BY 4.0)** license.

---

## 5. Raw Data Downloaded

- **Total Zip Archives Downloaded:** 3 archives (288.10 MB total).
- **Extracted Staging Directories:**
  - `dataset_staging/roboflow_motor/`: 144 images
  - `dataset_staging/roboflow_trc/`: 1,690 images
  - `dataset_staging/roboflow_crt/`: 3,024 images
- **Total Images Downloaded:** 4,858 images.

---

## 6. Raw Bounding Boxes Downloaded

- `roboflow_motor`: 143 bounding boxes / polygons.
- `roboflow_trc`: 1,876 bounding boxes / polygons across 13 classes.
- `roboflow_crt`: 33,729 bounding boxes.
- **Total Bounding Boxes Downloaded:** 35,748 annotations.

---

## 7. Actual Valid Instances Acquired Per Class

| Class ID | Class Name | Minimum Target | Acquired & Ingested Instances | Images Ingested | Target Status |
|:--------:|------------|:--------------:|:-----------------------------:|:---------------:|:-------------:|
| **2** | `CRT` | $\ge 30$ | **153** | 51 | **EXCEEDED (+123)** |
| **4** | `Cable_Wire` | $\ge 50$ | **83** | 75 | **EXCEEDED (+33)** |
| **5** | `Electric_Motor` | $\ge 60$ | **143** | 142 | **EXCEEDED (+83)** |
| **6** | `Magnet_bearing_Assembly` | $\ge 40$ | **67** | 65 | **EXCEEDED (+27)** |
| **TOTAL** | *Newly Added in Step 7* | $\ge 180$ | **446** | **333** | **100% MET** |

---

## 8. Class Mapping Decisions

1. **Class 5 — `Electric_Motor`:**
   - Source: `roboflow_motor`
   - Class 0 (`Electric-motor-housing`) $\rightarrow$ Class 5 (`Electric_Motor`).
   - Class 1 (`rusty electric-motor-housing`) $\rightarrow$ Class 5 (`Electric_Motor`).
   - Rationale: Both categories are authentic industrial electric motors and stator assemblies. Polygon segmentation coordinates were converted to normalized YOLO bounding boxes ($cx, cy, w, h$).
2. **Class 4 — `Cable_Wire`:**
   - Source: `roboflow_trc`
   - Class 10 (`cable`) $\rightarrow$ Class 4 (`Cable_Wire`).
   - Rationale: High-quality annotations of power cables, wiring harnesses, and USB/data cords in scrap piles. Pure images with zero background clutter from unrelated classes.
3. **Class 6 — `Magnet_bearing_Assembly`:**
   - Source: `roboflow_trc`
   - Class 2 (`HDD`) $\rightarrow$ Class 6 (`Magnet_bearing_Assembly`).
   - Class 12 (`internal HDD`) $\rightarrow$ Class 6 (`Magnet_bearing_Assembly`).
   - Rationale: E-waste hard disk drives containing voice-coil neodymium actuator magnet assemblies, disassembled and casing views.
4. **Class 2 — `CRT`:**
   - Source: `roboflow_crt`
   - Class 0 (`CRT`) $\rightarrow$ Class 2 (`CRT`).
   - Rationale: Real cathode ray tube monitors and televisions undergoing scrap handling. Selected from distinct unaugmented base frames with 1 to 4 clean bounding boxes.

---

## 9. Deduplication & Hash Verification

- **Base Dataset Hashes Loaded:** 426 SHA-256 hashes from existing `dataset_ewaste_v1/`.
- **Collisions Against Active Dataset:** **0** (Zero duplicates detected).
- **Collisions Within Staged Data:** **0** (Zero intra-run duplicates).
- **Cross-Partition Leakage:** **0** (Zero samples shared between Train, Val, and Test).

---

## 10. Quality Control (QC) Audit Results

Executed via automated 12-gate integrity validator ([`ai/training/dataset_check.js`](file:///d:/Sih_229Anti/ai/training/dataset_check.js)):

```
======================================================================
KABADIWALA CONNECT — E-WASTE DATASET INTEGRITY AUDIT
Target Directory: D:\Sih_229Anti\dataset_ewaste_v1
======================================================================

--- Checking Partition: TRAIN ---
  Images Found: 524
  Labels Found: 524
  Valid Instances: 792
  Hard Negatives (0-byte): 74

--- Checking Partition: VAL ---
  Images Found: 126
  Labels Found: 126
  Valid Instances: 179
  Hard Negatives (0-byte): 13

--- Checking Partition: TEST ---
  Images Found: 109
  Labels Found: 109
  Valid Instances: 191
  Hard Negatives (0-byte): 13

======================================================================
DATASET INTEGRITY AUDIT SUMMARY
======================================================================
Total Images Analyzed:       759
Total Labels Analyzed:       759
Total Bounding Boxes:        1162
Verified Hard Negatives:     100
Corrupt Images:              0
Missing Labels:              0
Orphan Labels:               0
Invalid Bounding Boxes:      0
Out-of-Range Class IDs:      0
Duplicate Images:            0
Session Leakages:            0
----------------------------------------------------------------------
[STATUS] AUDIT PASSED — Dataset is structurally valid for YOLOv8/YOLO11 training.
```

- **Corrupt Images:** 0 (all images verified with valid JPEG header `0xFF 0xD8`).
- **Missing / Orphan Labels:** 0 (every image has a perfectly paired label file).
- **Invalid Bounding Boxes:** 0 (all coordinates strictly bounded $0 < cx, cy < 1$ and $0 < w, h \le 1$).
- **Hard Negatives Preserved:** Exactly 100 verified 0-byte negative background images.

---

## 11. Final Active Dataset Counts (`dataset_ewaste_v1/`)

### Partition Summary

| Partition | Images | Empty (Negatives) | Annotated Images | Bounding Boxes | Partition % |
|-----------|:------:|:-----------------:|:----------------:|:--------------:|:-----------:|
| **Train** | 524 | 74 | 450 | 792 | 69.04% |
| **Val** | 126 | 13 | 113 | 179 | 16.60% |
| **Test** | 109 | 13 | 96 | 191 | 14.36% |
| **TOTAL** | **759** | **100** | **659** | **1,162** | **100.0%** |

### Complete 8-Class Instance Distribution (Frozen Taxonomy)

| ID | Class Name | Prior Count (Step 6) | Added (Step 7) | Final Instances | Share (%) | Minimum Target | Target Status |
|:--:|------------|:--------------------:|:--------------:|:---------------:|:---------:|:--------------:|:-------------:|
| **0** | `PCB_Circuit_Board` | 140 | 0 | **140** | 12.05% | $\ge 50$ | **MET** |
| **1** | `Battery` | 386 | 0 | **386** | 33.22% | $\ge 50$ | **MET** |
| **2** | `CRT` | 0 | +153 | **153** | 13.17% | $\ge 30$ | **MET** |
| **3** | `LCD_LED_Display` | 69 | 0 | **69** | 5.94% | $\ge 50$ | **MET** |
| **4** | `Cable_Wire` | 0 | +83 | **83** | 7.14% | $\ge 50$ | **MET** |
| **5** | `Electric_Motor` | 0 | +143 | **143** | 12.31% | $\ge 60$ | **MET** |
| **6** | `Magnet_bearing_Assembly` | 0 | +67 | **67** | 5.77% | $\ge 40$ | **MET** |
| **7** | `Mixed_EWaste` | 121 | 0 | **121** | 10.41% | $\ge 50$ | **MET** |
| — | *Hard Negatives (0-byte)* | 100 | 0 | **100** | — | $\ge 80$ | **MET** |
| **TOTAL** | | **716** | **+446** | **1,162** | **100.0%** | | **ALL 8 POPULATED** |

---

## 12. Training Gate Status

```
======================================================================
TRAINING GATE CANDIDATE — DATASET COMPLETE
======================================================================
```

- All 8 classes of the frozen e-waste taxonomy are now actively populated with authentic, verified photographic detections.
- All minimum instance targets are met or exceeded.
- Structural integrity, label bounding box coordinates, and split balances pass 100% of validation gates.
- The training gate is officially unblocked.

---

## 13. Remaining Gaps

- **Class Coverage Gaps:** None. 0 empty classes remain.
- **Future Enhancements (Post-Baseline):** Future iterations can introduce additional multi-object scrap heap images collected directly from municipal recycling centers.

---

## 14. Exact Next Step

1. **Step 8 — Model Training Configuration & Execution:**
   - Configure YOLOv8 nano (`yolov8n.pt`) training hyperparameters (`epochs=50`, `imgsz=640`, `batch=16`, `patience=10`) using [`ai/training/data.yaml`](file:///d:/Sih_229Anti/ai/training/data.yaml).
   - Execute model training, evaluate test split mAP50 / mAP50-95 metrics, export to ONNX format with FP16/FP32 validation.
2. **Strict Stop Confirmation:**
   - Model training was NOT executed in this step.
   - `best.pt` was NOT generated.
   - ONNX model was NOT exported.
   - Production code, portals, backend, and frontend UI remain 100% untouched.
