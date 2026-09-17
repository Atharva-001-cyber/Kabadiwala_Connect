# Dataset Ingestion & Conversion Report
**Project:** Kabadiwala Connect  
**SIH 2026 Problem Statement:** 26229  
**Feature:** AI-Powered E-Waste Material Identification (Genuine Edge AI Pipeline)  
**Document Type:** Forensic Dataset Ingestion, Conversion & Quality Control Report (Step 4C)  

---

## 1. Execution Status

```
STATUS = DATASET INGESTION PARTIAL — VERIFIED SUBSETS ASSEMBLED; EXPANSION & FIELD DATA REQUIRED
```

### Executive Summary
In strict adherence to the Step 4C specification:
1. **Zero fake images, zero synthetic data, and zero mock annotations were created.**
2. **The local Kaggle archive** (`archive.zip` / `modified-dataset/`) was preserved untouched and excluded from the core YOLO object detector dataset due to its $150 \times 150$ resolution and complete absence of bounding boxes.
3. **Approved, verified sources** from [`docs/DATASET_SOURCE_MANIFEST.md`](file:///d:/Sih_229Anti/docs/DATASET_SOURCE_MANIFEST.md) were ingested, deterministically converted to normalized YOLOv8 format, and partitioned with session-level isolation:
   - **SanderGi / PCB-Detection (MIT License):** Whole-board PCB bounding boxes converted from OBB $\rightarrow$ axis-aligned Class 0 (`PCB_Circuit_Board`).
   - **Google Open Images v7 (CC BY 4.0):** Filtered electronics subsets converted from Pascal VOC/CSV $\rightarrow$ YOLO format for Class 3 (`LCD_LED_Display`), Class 7 (`Mixed_EWaste`), and non-e-waste hard negatives.
   - **TACO (CC BY 4.0):** Clean background litter scenes (bottles, cans, cartons, paper) converted to verified 0-byte Hard-Negative labels, strictly excluding any battery or electronic components.
4. **Physical Directory Assembly:** [`dataset_ewaste_v1/`](file:///d:/Sih_229Anti/dataset_ewaste_v1) is now populated with **160 verified images** and **160 paired YOLO `.txt` labels** across `train/`, `val/`, and `test/`.
5. **Quality Control Verification:** The automated 12-gate integrity validator ([`ai/training/dataset_check.js`](file:///d:/Sih_229Anti/ai/training/dataset_check.js) / [`ai/training/dataset_check.py`](file:///d:/Sih_229Anti/ai/training/dataset_check.py)) ran against the assembled dataset and reported:
   ```
   [STATUS] AUDIT PASSED — Dataset is structurally valid for YOLOv8/YOLO11 training.
   0 corrupt images, 0 missing labels, 0 orphan labels, 0 invalid bounding boxes, 0 out-of-range classes, 0 session leakages.
   ```
6. **Production Safety & Training Prohibition:** No model was trained, no ONNX model was created, and all production frontend, backend, database, GPS, payment, and recycler workflows remain **100% untouched**.

---

## 2. Sources Actually Acquired

| Source Name | Official Source URL | Stated License | License Evidence | Files Downloaded | Annotation Type | Ingestion Status |
|-------------|---------------------|----------------|------------------|------------------|-----------------|------------------|
| **SanderGi / PCB-Detection** | [Hugging Face Hub](https://huggingface.co/datasets/SanderGi/pcb-detection-augmented-obb) / [GitHub](https://github.com/SanderGi/PCB-Detection) | MIT License | Official GitHub repository LICENSE file | 60 images + 60 labels | OBB (4-point polygon) converted to axis-aligned YOLO | `ACQUIRED & CONVERTED` |
| **Google Open Images v7** | [Google Storage](https://storage.googleapis.com/openimages/web/index.html) / [AWS S3 S3 Bucket](https://open-images-dataset.s3.amazonaws.com/) | CC BY 4.0 | Google Research Open Images terms | 75 images + 75 labels | Pascal VOC / CSV normalized bbox converted to YOLO | `ACQUIRED & CONVERTED` |
| **TACO (Trash Annotations in Context)** | [GitHub Repository](https://github.com/pedropro/TACO) | CC BY 4.0 | Official repo LICENSE file; Pedro F. Proença & Pedro Simões (2020) | 25 images + 25 labels | COCO JSON converted to 0-byte hard negative labels | `ACQUIRED & CONVERTED` |

---

## 3. Sources Not Acquired (And Why)

1. **Local Kaggle Archive (`archive.zip` / `modified-dataset/`):**
   - *Reason for non-ingestion:* Forensic audit confirmed that images are downsampled to $150 \times 150$ pixels and organized solely in classification folders without bounding boxes. Upscaling or generating synthetic boxes would violate project integrity rules. Preserved untouched in `Downloads/archive.zip` as supplementary reference.
2. **Roboflow TRCProject (`trcproject/e-waste-detection-model`):**
   - *Reason for non-ingestion:* Marked `LICENSE_REQUIRES_MANUAL_VERIFICATION`. Community uploads lack verified origin clearance for underlying web images. Stopped to avoid copyright infringement.
   - *Action required for future use:* Contact authors / perform reverse-image licensing verification.
3. **Roboflow razin (`razin/e-waste-8r92a`):**
   - *Reason for non-ingestion:* Marked `LICENSE_REQUIRES_MANUAL_VERIFICATION`. Unverified community provenance.
4. **Hugging Face akhil2808 (`akhil2808/YoloDataset`):**
   - *Reason for non-ingestion:* Gated academic research dataset requiring sign-in and formal contact agreement under Nature *Scientific Reports* terms. In accordance with safety rules, automated download was not forced.
5. **Stanford TrashNet / WasteNet:**
   - *Reason for non-ingestion:* Classification-only, no bounding boxes, ambiguous license. Formally `REJECTED`.

---

## 4. Annotation Conversion Operations

### A. SanderGi PCB OBB $\rightarrow$ YOLO Conversion
- **Input Format (OBB):** 9 tokens per line:
  `0 x1 y1 x2 y2 x3 y3 x4 y4`
  representing the 4 rotated corner coordinates of the printed circuit board.
- **Conversion Math:**
  $$x_{min} = \min(x_1, x_2, x_3, x_4), \quad x_{max} = \max(x_1, x_2, x_3, x_4)$$
  $$y_{min} = \min(y_1, y_2, y_3, y_4), \quad y_{max} = \max(y_1, y_2, y_3, y_4)$$
  $$w = x_{max} - x_{min}, \quad h = y_{max} - y_{min}$$
  $$cx = x_{min} + \frac{w}{2}, \quad cy = y_{min} + \frac{h}{2}$$
- **Output Format (Standard YOLO):**
  `0 <cx> <cy> <w> <h>`
- **Overarching PCB Rule Enforced:** Each circuit board receives **one overarching box (Class 0)**. Inductors, coils, heatsinks, and capacitors on the motherboard remain internal features of the PCB bounding box and are never annotated as separate electric motors.

### B. Open Images v7 Normalized BBox $\rightarrow$ YOLO Conversion
- **Input Format (Open Images CSV):** `XMin, XMax, YMin, YMax` normalized to $[0.0, 1.0]$.
- **Conversion Math:**
  $$w = XMax - XMin, \quad h = YMax - YMin$$
  $$cx = XMin + \frac{w}{2}, \quad cy = YMin + \frac{h}{2}$$
- **Output Format:** `<target_class_id> <cx> <cy> <w> <h>`

### C. Hard Negative 0-Byte Conversion (TACO & Open Images)
- Non-e-waste litter scenes (PET bottles, footwear, cans, cartons, paper) were verified to contain **zero target e-waste objects**.
- Each image was paired with an **exact 0-byte empty `.txt` file** in the corresponding `labels/` directory.

---

## 5. Actual 8-Class Mapping Implemented

| Source Dataset | Source Class Name | Target Class ID | Target Class Name | Mapping Rationale |
|----------------|-------------------|-----------------|-------------------|-------------------|
| SanderGi | `PCB` (whole-board) | **Class 0** | `PCB_Circuit_Board` | Direct circuit board detection |
| Open Images v7 | `/m/02522` Computer monitor | **Class 3** | `LCD_LED_Display` | Flat panel screen display stream |
| Open Images v7 | `/m/01m2v` Computer keyboard | **Class 7** | `Mixed_EWaste` | Peripheral consumer e-waste assembly |
| Open Images v7 | `/m/020lf` Computer mouse | **Class 7** | `Mixed_EWaste` | Peripheral consumer e-waste assembly |
| Open Images v7 | `/m/050k8` Mobile phone | **Class 7** | `Mixed_EWaste` | Complete consumer handset assembly |
| Open Images v7 | `/m/01b7fy` Headphones | **Class 7** | `Mixed_EWaste` | Audio peripheral assembly |
| Open Images v7 | `/m/04dr76w` Bottle | **Background** | Hard Negative | Non-e-waste background rejection (0-byte label) |
| Open Images v7 | `/m/09j5n` Footwear | **Background** | Hard Negative | Non-e-waste background rejection (0-byte label) |
| TACO | Bottles, cans, cartons | **Background** | Hard Negative | Non-e-waste background rejection (0-byte label) |

---

## 6. Excluded Classes & Entities

1. **TACO `Battery` Category:** Explicitly quarantined and excluded to prevent hard-negative labels from mislabeling real batteries as background.
2. **Kaggle `Washing Machine` & `Microwave`:** Excluded because large domestic white goods do not map to the hand-sortable informal e-waste taxonomy.
3. **Open Images `Television` (`/m/07c52`):** Held from automatic conversion due to ambiguity between curved glass CRT televisions and flat-panel LCD/LED televisions.

---

## 7. Duplicate & Leakage Analysis

- **SHA-256 Exact Hash Duplication:** Evaluated across all 160 downloaded files. Exactly **0 duplicate images** exist in the active dataset.
- **Session-Level Isolation:**
  - In SanderGi, images were partitioned strictly by physical board model prefix:
    - `train`: Sessions `ACM-109`, `ArduinoMega`, `ATTIOT`, `FCC` (40 images)
    - `val`: Session `s14` (10 images)
    - `test`: Sessions `s11`, `s15` (10 images)
  - In Open Images, images were partitioned via deterministic cryptographic MD5 hashing of unique `ImageID`.
  - Result: **0 cross-partition session leakages detected.**

---

## 8. Assembled Dataset Partition Counts

```
+------------------+---------------+---------------+--------------------+-----------------+
| Partition Split  | Images Count  | Labels Count  | Bounding Instances | Hard Negatives  |
+------------------+---------------+---------------+--------------------+-----------------+
| Train (65.0%)    | 104 images    | 104 labels    | 79 boxes           | 39 (0-byte)     |
| Validation (14.4%)| 23 images    | 23 labels     | 19 boxes           | 6 (0-byte)      |
| Test (20.6%)     | 33 images     | 33 labels     | 31 boxes           | 5 (0-byte)      |
+------------------+---------------+---------------+--------------------+-----------------+
| TOTAL ASSEMBLED  | 160 images    | 160 labels    | 129 boxes          | 50 (0-byte)     |
+------------------+---------------+---------------+--------------------+-----------------+
```

---

## 9. Per-Class Instance Counts (Frozen 8 Taxonomy)

```
+----+--------------------------+-----------------------+---------------+-----------------+
| ID | Frozen Class Name        | Actual Assembled Box  | Target Quota  | Net Deficit     |
+----+--------------------------+-----------------------+---------------+-----------------+
| 0  | PCB_Circuit_Board        | 60 instances          | 550 – 750     | -490 images     |
| 1  | Battery                  | 0 instances           | 350 – 500     | -350 images !   |
| 2  | CRT                      | 0 instances           | 300 – 400     | -300 images !   |
| 3  | LCD_LED_Display          | 22 instances          | 400 – 550     | -378 images     |
| 4  | Cable_Wire               | 0 instances           | 450 – 600     | -450 images !   |
| 5  | Electric_Motor           | 0 instances           | 500 – 700     | -500 images !   |
| 6  | Magnet_bearing_Assembly  | 0 instances           | 300 – 450     | -300 images !   |
| 7  | Mixed_EWaste             | 47 instances          | 450 – 650     | -403 images     |
+----+--------------------------+-----------------------+---------------+-----------------+
| -  | Hard Negatives (Bkgrnd)  | 50 instances (0-byte) | 350 – 500     | -300 images     |
+----+--------------------------+-----------------------+---------------+-----------------+
|    | TOTAL                    | 179 total instances   | 3,650 – 5,000 | -3,471 images   |
+----+--------------------------+-----------------------+---------------+-----------------+
```

---

## 10. Remaining Gaps & Sourcing Bottlenecks

The following classes currently have **zero instances** in the assembled dataset and represent severe gaps in public web detection repositories:
1. **Class 5: Electric Motor (0 instances / 500–700 needed):** Public web datasets contain only time-series vibration sensors or factory defect microscopic inspection. Real scrap stators (ceiling fan stators, mixer grinder motors, rusted pump casings) **do not exist on the open web**.
2. **Class 6: Magnet-bearing Assembly (0 instances / 300–450 needed):** Extracted neodymium HDD magnets and ferrite speaker rings are completely absent in open bounding-box datasets.
3. **Class 1: Battery (0 instances / 350–500 needed):** Gated on Hugging Face (`akhil2808`) and unverified on Roboflow (`TRCProject`).
4. **Class 2: CRT (0 instances / 300–400 needed):** Bare glass funnel cathode ray tubes are rarely photographed in modern open-source datasets.
5. **Class 4: Cable / Wire (0 instances / 450–600 needed):** Tangled multi-conductor scrap wire bunches require dedicated field capture.

---

## 11. Indian Field Data Requirement (Mandatory Next Step)

Because internet datasets alone cannot supply scrap-grade electric motors, stators, HDD magnets, or burned circuit boards on jute sacks, an authentic **Indian Field Data Collection** is strictly required:
- **Scrap Yard Locations:** Mayapuri (Delhi), Seelampur (Delhi), Transport Nagar (Kanpur), Bakshi Ka Talab (Lucknow).
- **Required Photography Protocol:**
  - High resolution (minimum $1920 \times 1080$, downsampled to $640 \times 640$).
  - Environments: Woven jute sacks (*bori*), dusty concrete floors, blue tarpaulins, mechanical weighing scales.
  - Lighting: Harsh tropical midday sunlight, dim scrap godown shed, smartphone flashlight.
  - Distances: Macro ($15\text{--}30\text{ cm}$), lot transaction ($40\text{--}70\text{ cm}$), pile overview ($1.0\text{--}2.5\text{ m}$).
  - Mandatory target: **450 electric motor stators, 200 magnet assemblies, 200 cable bunches, 150 damaged displays**.

---

## 12. Licensing & Provenance Risk Register

| Ingested Dataset Subset | License | Provenance Traceability | Legal Clearance Status |
|-------------------------|---------|-------------------------|------------------------|
| `dataset_ewaste_v1/.../pcb_*` | MIT License | Derived from SanderGi GitHub repository | **APPROVED & VERIFIED** |
| `dataset_ewaste_v1/.../oi_*` | CC BY 4.0 | Derived from Google Open Images v7 validation subset | **APPROVED & VERIFIED** |
| `dataset_ewaste_v1/.../taco_*` | CC BY 4.0 | Derived from TACO GitHub repository (Proença et al.) | **APPROVED & VERIFIED** |

---

## 13. Automated Validation & QC Results

Executing [`ai/training/dataset_check.js`](file:///d:/Sih_229Anti/ai/training/dataset_check.js) against [`dataset_ewaste_v1/`](file:///d:/Sih_229Anti/dataset_ewaste_v1):

```
======================================================================
KABADIWALA CONNECT — E-WASTE DATASET INTEGRITY AUDIT
Target Directory: d:\Sih_229Anti\dataset_ewaste_v1
======================================================================

--- Checking Partition: TRAIN ---
  Images Found: 104
  Labels Found: 104
  Valid Instances: 79
  Hard Negatives (0-byte): 39

--- Checking Partition: VAL ---
  Images Found: 23
  Labels Found: 23
  Valid Instances: 19
  Hard Negatives (0-byte): 6

--- Checking Partition: TEST ---
  Images Found: 33
  Labels Found: 33
  Valid Instances: 31
  Hard Negatives (0-byte): 5

======================================================================
DATASET INTEGRITY AUDIT SUMMARY
======================================================================
Total Images Analyzed:       160
Total Labels Analyzed:       160
Total Bounding Boxes:        129
Verified Hard Negatives:     50
Corrupt Images:              0
Missing Labels:              0
Orphan Labels:               0
Invalid Bounding Boxes:      0
Out-of-Range Class IDs:      0
Duplicate Images:            0
Session Leakages:            0
----------------------------------------------------------------------

CLASS INSTANCE DISTRIBUTION (FROZEN 8 TAXONOMY):
ID   Class Name                   Instances    % of Total
------------------------------------------------------------
0    PCB_Circuit_Board            60            46.51%
1    Battery                      0              0.00%
2    CRT                          0              0.00%
3    LCD_LED_Display              22            17.05%
4    Cable_Wire                   0              0.00%
5    Electric_Motor               0              0.00%
6    Magnet_bearing_Assembly      0              0.00%
7    Mixed_EWaste                 47            36.43%
------------------------------------------------------------

[STATUS] AUDIT PASSED — Dataset is structurally valid for YOLOv8/YOLO11 training.
Detailed report written to dataset_qc_report.json
```

---

## 14. Final Directory Physical State

```
dataset_ewaste_v1/
├── data.yaml (32 lines, manifest for 8 classes)
├── train/
│   ├── images/  [104 files]
│   └── labels/  [104 files]
├── val/
│   ├── images/  [23 files]
│   └── labels/  [23 files]
└── test/
    ├── images/  [33 files]
    └── labels/  [33 files]
```
**Total Files on Disk:** 320 files (160 images + 160 labels) + 1 manifest = **321 files**.

---

## 15. Production Safety Verification

Git inspection confirms that zero changes were made to production source code:
- `frontend/src/pages/collector/AddLotPage.tsx`: **UNTOUCHED**
- `frontend/src/utils/visionClassifier.ts`: **UNTOUCHED**
- `frontend/src/services/api.ts`: **UNTOUCHED**
- `frontend/src/context/AuthContext.tsx`: **UNTOUCHED**
- Supabase schema, authentication, GPS, mandi prices, recycler matching, payments, and traceability remain **100% untouched and functional**.
- No `git commit` or `git push` commands were performed.

---

### FINAL ATTESTATION

STEP 4C COMPLETE (PARTIAL INGESTION — QUALITY GATES PASSED)

DATASET INGESTION:  
YES (160 verified images / 160 labels assembled from SanderGi MIT, Open Images CC BY 4.0, and TACO CC BY 4.0)

YOLO CONVERSION:  
YES (Deterministic OBB $\rightarrow$ axis-aligned single overarching PCB boxes, Open Images normalized bboxes, and 0-byte hard negative labels)

DATASET QC:  
PASS (0 corrupt images, 0 missing labels, 0 orphan labels, 0 coordinate errors, 0 session leakages)

MODEL TRAINING:  
NOT RUN

ONNX:  
NOT CREATED

PRODUCTION FRONTEND:  
UNCHANGED

BACKEND/API:  
UNCHANGED

DATABASE/SUPABASE:  
UNCHANGED

GPS:  
UNCHANGED

RECYCLER:  
UNCHANGED

PAYMENT:  
UNCHANGED

TRACEABILITY:  
UNCHANGED

GIT COMMIT/PUSH:  
NOT PERFORMED
