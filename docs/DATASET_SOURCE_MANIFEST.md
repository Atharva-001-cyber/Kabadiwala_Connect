# Dataset Source Manifest
**Project:** Kabadiwala Connect  
**SIH 2026 Problem Statement:** 26229  
**Feature:** AI-Powered E-Waste Material Identification (Genuine Edge AI Pipeline)  
**Document Type:** Dataset Sourcing, License Audit & Acquisition Strategy  
**Status:** UPDATED FOR STEP 7 (Authenticated Roboflow Acquisition & Ingestion)  
**Date:** 16-09-2026  

---

## A. Executive Status

```
STATUS = STRUCTURALLY VALID — ALL 8 OF 8 CLASSES POPULATED — TRAINING GATE CANDIDATE
```

### Forensic Executive Summary
1. **Physical Active Dataset:** The active dataset directory [`dataset_ewaste_v1/`](file:///d:/Sih_229Anti/dataset_ewaste_v1) contains **759 verified images** and **759 paired YOLO labels** (1,162 annotated bounding boxes + 100 verified 0-byte hard negatives).
2. **Prior 426 Base Images Preserved:** The 426 verified images from Steps 4C, 4E, and 5 were 100% preserved with zero deletions, zero overwrites, and zero reannotations.
3. **Step 7 Authenticated Roboflow Acquisition (+333 images, +446 boxes):**
   - **`project-3swgf/electric-motor-housing1` (CC BY 4.0):** +142 images, +143 boxes for Class 5 (`Electric_Motor`).
   - **`trcproject/e-waste-detection-model` (CC BY 4.0):** +75 images, +83 boxes for Class 4 (`Cable_Wire`) & +65 images, +67 boxes for Class 6 (`Magnet_bearing_Assembly`).
   - **`amandeep-etjdw/crt` (CC BY 4.0):** +51 images, +153 boxes for Class 2 (`CRT`).
4. **Quality Control Verification:** The automated 12-gate integrity validator ([`ai/training/dataset_check.js`](file:///d:/Sih_229Anti/ai/training/dataset_check.js)) passed with **0 corrupt images**, **0 missing labels**, **0 orphan labels**, **0 invalid boxes**, **0 duplicates**, and **0 session leakages**.

---

## B. Master Source Provenance & Status Register

| # | Dataset Name | Source Identifier | Stated License | License Clearance Status | Ingested Images | Ingested Boxes | Role in Dataset | Status |
|---|--------------|-------------------|----------------|--------------------------|:---------------:|:--------------:|-----------------|--------|
| 1 | **Electric Motor Housing** | `project-3swgf/electric-motor-housing1` | CC BY 4.0 | VERIFIED (`data.yaml`) | **142** | **143** | Class 5 (`Electric_Motor`) | `INGESTED & ACTIVE (Step 7)` |
| 2 | **TRC E-Waste Detection** | `trcproject/e-waste-detection-model` | CC BY 4.0 | VERIFIED (`data.yaml`) | **140** | **150** | Class 4 (`Cable`), Class 6 (`Magnet`) | `INGESTED & ACTIVE (Step 7)` |
| 3 | **CRT Detection** | `amandeep-etjdw/crt` | CC BY 4.0 | VERIFIED (`data.yaml`) | **51** | **153** | Class 2 (`CRT`) | `INGESTED & ACTIVE (Step 7)` |
| 4 | **cables-nl42k (RF100)** | Hugging Face / Francesco | CC BY 4.0 | VERIFIED (Archive metadata) | **56** | **386** | Class 1 (`Battery`) | `INGESTED & ACTIVE (Step 5)` |
| 5 | **SanderGi / PCB-Detection** | Hugging Face / GitHub | MIT License | VERIFIED (Repo LICENSE) | **140** | **140** | Class 0 (`PCB_Circuit_Board`) | `INGESTED & ACTIVE (Step 4C/4E)` |
| 6 | **Google Open Images v7** | Open Images v7 | CC BY 4.0 | VERIFIED (Google Terms) | **190** | **190** | Class 3 (`LCD_LED`), Class 7 (`Mixed`), Negatives | `INGESTED & ACTIVE (Step 4C/4E)` |
| 7 | **TACO Litter Dataset** | GitHub / Proença & Simões | CC BY 4.0 | VERIFIED (Repo LICENSE) | **40** | **0** (Neg) | Verified 0-byte Hard Negatives | `INGESTED & ACTIVE (Step 4E)` |

---

## C. Active Dataset Partition & Class Counts

```
======================================================================
DATASET INTEGRITY AUDIT SUMMARY (dataset_ewaste_v1/)
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
Partition Distribution:
  - Train: 524 images (69.04%)
  - Val:   126 images (16.60%)
  - Test:  109 images (14.36%)
----------------------------------------------------------------------

CLASS INSTANCE DISTRIBUTION (FROZEN 8 TAXONOMY):
ID   Class Name                   Instances    % of Total
------------------------------------------------------------
0    PCB_Circuit_Board            140           12.05%
1    Battery                      386           33.22%
2    CRT                          153           13.17%
3    LCD_LED_Display              69             5.94%
4    Cable_Wire                   83             7.14%
5    Electric_Motor               143           12.31%
6    Magnet_bearing_Assembly      67             5.77%
7    Mixed_EWaste                 121           10.41%
------------------------------------------------------------
[STATUS] AUDIT PASSED — Dataset is structurally valid for YOLOv8/YOLO11 training.
```

---

## D. Training Readiness Gate

```
VERDICT: TRAINING GATE CANDIDATE — DATASET COMPLETE
```
All 8 classes of the frozen e-waste taxonomy are now actively populated with authentic, verified photographic detections exceeding all minimum instance targets. The dataset is structurally valid with 0 errors across 12 integrity checks. Training gate is unblocked.
