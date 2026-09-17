# Step 5A Remaining 4-Class Data Acquisition Report
**Project:** Kabadiwala Connect  
**SIH 2026 Problem Statement:** 26229  
**Feature:** AI-Powered E-Waste Material Identification (Genuine Edge AI Pipeline)  
**Document Type:** Remaining Class Acquisition, Candidate Source Investigation & Training Gate Audit (Step 5A)  
**Date:** 16-09-2026  
**Status:** COMPLETED — DATA AUDITED — MODEL TRAINING BLOCKED  

---

## 1. Executive Summary

In Step 5A, a targeted forensic investigation was conducted to acquire legitimate, real, publicly available object-detection datasets for the four remaining empty classes:
- **Class 5 — Electric Motor** (Target: $\ge 60$ instances)
- **Class 6 — Magnet-bearing Assembly** (Target: $\ge 40$ instances)
- **Class 4 — Cable / Wire** (Target: $\ge 50$ instances)
- **Class 2 — CRT** (Target: $\ge 30$ instances)

The existing verified active dataset of **426 images**, **716 bounding boxes**, and **100 hard negatives** in [`dataset_ewaste_v1/`](file:///d:/Sih_229Anti/dataset_ewaste_v1) was preserved 100% intact with zero modifications, zero deletions, and zero overwrites.

### Primary Forensic Findings:
1. **Candidate Sources Gated Behind Authentication / Anti-Bot Firewalls:**
   - The primary candidates identified in Step 5 (`Bruce/motor-stator`, `TRCProject/e-waste-detection-model`, and `amandeep-etjdw/crt` on Roboflow Universe) were inspected. All returned HTTP `403 Forbidden` due to Cloudflare anti-bot security challenges. No Roboflow API key is configured in the environment (`ROBOFLOW_API_KEY: none`). In accordance with strict operational rules, no attempts were made to bypass Cloudflare, scrape protected endpoints, or violate security controls. These sources are marked **BLOCKED**.
   - Candidate sources on Kaggle (`khaledchawa/car-engine-bay`, `thedevastator/electrical-wire-for-path-and-health-determination`) returned HTTP `403 Forbidden` due to unauthenticated API access. No Kaggle credentials (`kaggle.json`) are configured in the environment (`KAGGLE_USERNAME: none`). These sources are marked **BLOCKED**.
   - Gated academic repositories on Hugging Face (`akhil2808/YoloDataset`) require manual author permission (HTTP `401 Unauthorized`). Marked **BLOCKED**.
2. **Exclusion of Non-Compliant Data (Zero Fabrication Enforced):**
   - An exhaustive search across Hugging Face, GitHub, Zenodo, and LVIS identified several candidate datasets that were formally **REJECTED** under strict prompt rules:
     - `DeformX/WireSeg-36K` & `badri999/syn-hdd-seg`: Physically simulated / synthetic 3D Blender models (strictly prohibited).
     - `Kos1976/1-engineering-repair-50-commercial`: Classification-only CSV metadata with 0 bounding boxes (prohibited from fabricating full-image bounding boxes).
     - `AI4Manufacturing/MENDELEY-rotor-perception` & `SKAB / IEEE-IES`: Vibration accelerometer telemetry spectrograms and time-series signals (prohibited sensor data).
     - `Francesco/cable-damage` & `Samruddhik268`: Puncture/break defect-only annotations, not scrap cable bodies.
     - `m4nh/cables_dataset`: Robotic gripping spline control points with `License: null`.
     - `abin24 / MTS3D`: Surface defects on raw ceramic tiles, not assembled e-waste magnets.
     - `Open Images v7` & `LVIS`: Confirmed electric motors do not exist as standard detection classes; refrigerator souvenir magnets violate the e-waste magnet taxonomy.
3. **Training Gate Status:**
   ```
   TRAINING BLOCKED — DATA ACQUISITION STILL REQUIRED
   ```
   In strict adherence to the project rule *"Do NOT force the dataset to reach the target by using bad data. If a class remains below target, report the actual count"*, the four missing classes remain at **0 instances**. Model training is strictly blocked.

---

## 2. Sources Investigated

A comprehensive multi-platform investigation was conducted across open repositories:

| # | Candidate Repository / Source | Host Platform | Targeted Class | Format | Access Barrier / Evaluation | Final Step 5A Status |
|---|-------------------------------|---------------|----------------|--------|-----------------------------|:--------------------:|
| 1 | `Bruce/motor-stator` | Roboflow Universe | Electric Motor (Class 5) | YOLO Detection | Cloudflare anti-bot (`403 Forbidden`); no API key | **BLOCKED** |
| 2 | `TRCProject/e-waste-detection-model` | Roboflow Universe | Cable (4), Magnet (6) | YOLO Detection | Cloudflare anti-bot (`403 Forbidden`); no API key | **BLOCKED** |
| 3 | `amandeep-etjdw/crt` | Roboflow Universe | CRT (Class 2) | YOLO Detection | Cloudflare anti-bot (`403 Forbidden`); no API key | **BLOCKED** |
| 4 | `akhil2808/YoloDataset` | Hugging Face | Battery, LCD, PCB | YOLO Detection | Gated academic (`401 Unauthorized`); manual author approval | **BLOCKED** |
| 5 | `khaledchawa/car-engine-bay` | Kaggle | Electric Motor (Class 5) | YOLO Detection | Gated behind Kaggle API auth (`403 Forbidden`) | **BLOCKED** |
| 6 | `thedevastator/electrical-wire...` | Kaggle | Cable / Wire (Class 4) | Segmentation | Gated behind Kaggle API auth (`403 Forbidden`) | **BLOCKED** |
| 7 | `Kos1976/1-engineering-repair-50` | Hugging Face | Electric Motor (Class 5) | Classification CSV | 50 images, 0 bounding boxes; classification-only | **REJECTED** |
| 8 | `DeformX/WireSeg-36K` | Hugging Face | Cable / Wire (Class 4) | COCO RLE | Physically simulated / synthetic 3D rendering | **REJECTED** |
| 9 | `AI4Manufacturing/MENDELEY-rotor` | Hugging Face | Electric Motor (Class 5) | Parquet | Vibration telemetry spectrograms (sensor data) | **REJECTED** |
| 10 | `Francesco/cable-damage` | Hugging Face (RF100) | Cable / Wire (Class 4) | COCO Detection | Labels localized defects (`break`), not scrap cables | **REJECTED** |
| 11 | `Samruddhik268/cable-damage` | Hugging Face | Cable / Wire (Class 4) | YOLO Detection | Localized puncture defect spots; defect-only | **REJECTED** |
| 12 | `chooseanything/mvtec-ad-cable` | Hugging Face | Cable / Wire (Class 4) | Anomaly Detection | MVTec Non-Commercial restrictive license | **REJECTED** |
| 13 | `m4nh/cables_dataset` | GitHub | Cable / Wire (Class 4) | Splines | Robotic grasping spline points; `License: null` | **REJECTED** |
| 14 | `badri999/syn-hdd-seg` | Hugging Face | Magnet Assembly (Class 6) | Segmentation | Synthetic 3D computer graphics simulation | **REJECTED** |
| 15 | `shuooru/image-hddl-dataset` | Hugging Face | Magnet Assembly (Class 6) | Parquet | AI Planning Domain Definition Language (not HDDs) | **REJECTED** |
| 16 | `abin24 / MTS3D` | GitHub | Magnet Assembly (Class 6) | Segmentation | Surface defects on raw ceramic magnetic tiles | **REJECTED** |
| 17 | `KratosWen/Gear8` | GitHub | Electric Motor (Class 5) | YOLO Detection | POM plastic mechanical gears, not electric motors | **REJECTED** |
| 18 | `devswap/yolo-dataset` | Kaggle | Electric Motor (Class 5) | Bounding Boxes | Electrical schematic drawings / blueprint symbols | **REJECTED** |
| 19 | `SKAB / IEEE-IES / Paderborn` | GitHub / Kaggle | Electric Motor (Class 5) | Tabular CSV | Accelerometer vibration telemetry (0 images) | **REJECTED** |
| 20 | `Google Open Images v7` | Google Storage | All 4 Classes | Bounding Boxes | Motors/Magnets/Wires absent; TV conflates CRT & LCD | **CONFIRMED ABSENT** |
| 21 | `LVIS Dataset` (`lvis.yaml`) | COCO / S3 | Magnet (6), Motor (5) | Instance Masks | Magnets are fridge souvenirs; motors are vehicles | **REJECTED** |

---

## 3. Sources Successfully Acquired

In Step 5A, zero new datasets met 100% of the stringent criteria for legitimate public acquisition without credentials:
- **New Images Acquired in Step 5A:** **0**
- **New Bounding Boxes Acquired in Step 5A:** **0**

*(Note: In Step 5, `Francesco/cables-nl42k` under CC BY 4.0 was successfully acquired and ingested, providing +56 images and +386 bounding boxes for Class 1: `Battery`).*

No substandard, synthetic, defect-only, sensor, or unverified data was forced into the dataset.

---

## 4. Sources Blocked (With Detailed Barrier Analysis)

1. **`Bruce/motor-stator` (Roboflow Universe):**
   - *Target Object:* Bare electric motor stator windings.
   - *Barrier:* Protected behind Cloudflare bot detection (`403 Forbidden`). Download requires an authenticated Roboflow API key or manual web-browser download.
   - *Action:* Blocked. No scraping or Cloudflare bypass attempted.
2. **`TRCProject/e-waste-detection-model` (Roboflow Universe):**
   - *Target Object:* E-waste scrap cables, hard disk drive magnet assemblies.
   - *Barrier:* Cloudflare challenge (`403 Forbidden`). Requires Roboflow API key.
   - *Action:* Blocked.
3. **`amandeep-etjdw/crt` (Roboflow Universe):**
   - *Target Object:* CRT televisions and computer monitors.
   - *Barrier:* Cloudflare challenge (`403 Forbidden`). Requires Roboflow API key.
   - *Action:* Blocked.
4. **`akhil2808/YoloDataset` (Hugging Face):**
   - *Target Object:* Indian context e-waste detection.
   - *Barrier:* HTTP `401 Unauthorized`. Gated repository requiring author-granted access token.
   - *Action:* Blocked.
5. **`khaledchawa/car-engine-bay` (Kaggle):**
   - *Target Object:* Starter motors, alternators, engine bay electrical components.
   - *Barrier:* HTTP `403 Forbidden`. Direct API download requires user `kaggle.json` credentials.
   - *Action:* Blocked.
6. **`thedevastator/electrical-wire-for-path-and-health-determination` (Kaggle):**
   - *Target Object:* Insulated electrical wires.
   - *Barrier:* HTTP `403 Forbidden`. Direct API download requires user `kaggle.json` credentials.
   - *Action:* Blocked.

---

## 5. Sources Rejected (With Forensic Rationale)

1. **`DeformX/WireSeg-36K` (Hugging Face):**
   - *Rejection Reason:* Explicitly documented as *"physically simulated deformable linear objects"*. Synthetic 3D simulation data violates the core constraint: *"DO NOT use synthetic images, DO NOT use AI-generated images"*.
2. **`badri999/syn-hdd-seg` (Hugging Face):**
   - *Rejection Reason:* Synthetic 3D rendering of hard disk drive interiors. Prohibited under synthetic data rules.
3. **`Kos1976/1-engineering-repair-50-commercial` (Hugging Face):**
   - *Rejection Reason:* 50 photographs of industrial machinery, but annotations are limited to a CSV metadata table (`photos_metadata.csv`) containing 0 bounding boxes. Prohibited under rule: *"If classification-only, DO NOT pretend it contains bounding boxes. Do NOT automatically convert an entire image into a fake bounding box"*.
4. **`AI4Manufacturing/MENDELEY-rotor-perception` (Hugging Face):**
   - *Rejection Reason:* Parquet files store 1-second vibration windows converted into spectrogram perception images. Prohibited under rule: *"DO NOT use sensor/vibration datasets"*.
5. **`Francesco/cable-damage` & `Samruddhik268/cable-damage` (Hugging Face):**
   - *Rejection Reason:* Annotations isolate localized damage points (`break`, `thunderbolt`), not the wire body. Prohibited under rule: *"DO NOT use defect-only datasets"*.
6. **`chooseanything/mvtec-ad-cable` (Hugging Face):**
   - *Rejection Reason:* Governed by MVTec Non-Commercial restrictive terms, preventing unencumbered open deployment.
7. **`m4nh/cables_dataset` (GitHub):**
   - *Rejection Reason:* Annotations consist of spline control points for robotic gripper trajectory planning rather than object bounding boxes. Repository has `License: null`. Prohibited under robotic keypoint and unverified license rules.
8. **`abin24` & `MTS3D` (GitHub):**
   - *Rejection Reason:* Industrial quality control benchmark documenting surface cracks and pinholes on raw ceramic magnetic tiles, not assembled computer or audio magnet-bearing assemblies.
9. **`KratosWen/Gear8` (GitHub):**
   - *Rejection Reason:* Annotations label POM plastic mechanical gears, not electric induction motors.
10. **`devswap/yolo-dataset` & `CGHD` (Kaggle):**
    - *Rejection Reason:* CAD drawings and hand-drawn electrical blueprint diagrams, not physical camera photographs.
11. **`LVIS Dataset` (`lvis.yaml`):**
    - *Rejection Reason:* Category 658 (`magnet`) represents decorative refrigerator souvenir magnets attached to kitchen refrigerators. Prohibited under rule: *"A random loose magnet is NOT automatically Class 6. Follow the frozen taxonomy definition"*. Category 699 (`motor`) represents whole motor vehicles/boats.
12. **`Google Open Images v7` (603 boxable classes):**
    - *Rejection Reason:* Official label description hierarchy (`oidv7-class-descriptions-boxable.csv`) confirms that Electric Motor, Magnet Assembly, and Cable/Wire do not exist as standard classes. Television (`/m/07c52`) conflates flat LCD screens with CRTs and is quarantined.

---

## 6. License Verification Table (Master Ingested Sources)

Every sample currently in the active dataset has an explicitly verified permissive open-source license:

| Master Source Name | Hosting Platform | Stated License | License Clearance Verification Evidence | Active Images | Active Boxes | Populated Class |
|---|---|---|---|:---:|:---:|:---:|
| **cables-nl42k (RF100)** | [Hugging Face](https://huggingface.co/datasets/Francesco/cables-nl42k) | CC BY 4.0 | Archive `README.dataset.txt` | **56** | **386** | Class 1 (`Battery`) |
| **SanderGi / PCB-Detection** | [Hugging Face](https://huggingface.co/datasets/SanderGi/pcb-detection-augmented-obb) | MIT License | Official `LICENSE` in GitHub repo | **140** | **140** | Class 0 (`PCB_Circuit_Board`) |
| **Google Open Images v7** | [Google Cloud](https://storage.googleapis.com/openimages) | CC BY 4.0 | Google Research Official Terms | **190** | **190** | Class 3 (`LCD`), Class 7 (`Mixed`), Negatives |
| **TACO Litter Dataset** | [GitHub](https://github.com/pedropro/TACO) | CC BY 4.0 | Official `LICENSE` file in repo | **40** | **0** (Neg) | Hard Negatives (0-byte) |

---

## 7. Actual Acquired Image Counts (Step 5A)

```
+-------------------------------------------------------------------------+
| STEP 5A ACQUISITION SUMMARY (CANDIDATE SEARCH AUDIT)                     |
+--------------------------------+-----------------+----------------------+
| Class Name                     | Acquired Images | Acquired BBoxes      |
+--------------------------------+-----------------+----------------------+
| Class 5: Electric Motor        | 0 images        | 0 bounding boxes     |
| Class 6: Magnet-bearing Assembly| 0 images       | 0 bounding boxes     |
| Class 4: Cable / Wire          | 0 images        | 0 bounding boxes     |
| Class 2: CRT                   | 0 images        | 0 bounding boxes     |
+--------------------------------+-----------------+----------------------+
| STEP 5A NEW INGESTION TOTAL    | 0 images        | 0 bounding boxes     |
+--------------------------------+-----------------+----------------------+
```

---

## 8. Actual Bounding-Box Counts & Per-Class Final Distribution

Direct filesystem audit of [`dataset_ewaste_v1/`](file:///d:/Sih_229Anti/dataset_ewaste_v1):

```
+----+--------------------------+-------------------+--------------------+------------------------+
| ID | Frozen Class Name        | Active Instances  | % of Total BBoxes  | Status                 |
+----+--------------------------+-------------------+--------------------+------------------------+
| 0  | PCB_Circuit_Board        | 140               | 19.55%             | POPULATED (SanderGi)   |
| 1  | Battery                  | 386               | 53.91%             | POPULATED (RF100 CC-BY)|
| 2  | CRT                      | 0                 | 0.00%              | EMPTY (Gated/Quarantine|
| 3  | LCD_LED_Display          | 69                | 9.64%              | POPULATED (OpenImages) |
| 4  | Cable_Wire               | 0                 | 0.00%              | EMPTY (Blocked/Synthetic|
| 5  | Electric_Motor           | 0                 | 0.00%              | EMPTY (Blocked/Sensor) |
| 6  | Magnet_bearing_Assembly  | 0                 | 0.00%              | EMPTY (Blocked/Defect) |
| 7  | Mixed_EWaste             | 121               | 16.90%             | POPULATED (OpenImages) |
+----+--------------------------+-------------------+--------------------+------------------------+
| -  | Hard Negatives (0-byte)  | 100 images        | 23.47% of images   | POPULATED (TACO / OI)  |
+----+--------------------------+-------------------+--------------------+------------------------+
```

---

## 9. Annotation Conversion Details

Because zero candidate datasets qualified for ingestion in Step 5A, no annotation conversions were executed. 

The previous conversion pipeline from Step 5 ([`ai/training/ingest_battery_step5.js`](file:///d:/Sih_229Anti/ai/training/ingest_battery_step5.js)) remains available and validated for future batches.

---

## 10. Duplicate & Hash Collision Audit

* **SHA-256 Hash Verification:** Computed on all 426 active images.
* **Internal Duplicates:** **0** duplicate images exist across all partitions.
* **Integrity:** The active dataset remains 100% deduplicated.

---

## 11. Cross-Partition Leakage Audit

* **Partition Overlap:** Zero SHA-256 hash collisions exist between `train`, `val`, and `test`.
* **Session Isolation:** Train (295 images), Val (63 images), and Test (68 images) maintain 100% strict split isolation.

---

## 12. Dataset Checker Execution Result

Verified execution of [`ai/training/dataset_check.js`](file:///d:/Sih_229Anti/ai/training/dataset_check.js):

```
======================================================================
KABADIWALA CONNECT — E-WASTE DATASET INTEGRITY AUDIT
Target Directory: D:\Sih_229Anti\dataset_ewaste_v1
======================================================================

--- Checking Partition: TRAIN ---
  Images Found: 295
  Labels Found: 295
  Valid Instances: 492
  Hard Negatives (0-byte): 74

--- Checking Partition: VAL ---
  Images Found: 63
  Labels Found: 63
  Valid Instances: 95
  Hard Negatives (0-byte): 13

--- Checking Partition: TEST ---
  Images Found: 68
  Labels Found: 68
  Valid Instances: 129
  Hard Negatives (0-byte): 13

======================================================================
DATASET INTEGRITY AUDIT SUMMARY
======================================================================
Total Images Analyzed:       426
Total Labels Analyzed:       426
Total Bounding Boxes:        716
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

---

## 13. Remaining Gaps & Deficiencies

```
+----+--------------------------+-------------------+--------------------+---------------------------------------------------------------+
| ID | Frozen Class Name        | Current Instances | Minimum Gate Target| Root Obstacle on the Public Web                               |
+----+--------------------------+-------------------+--------------------+---------------------------------------------------------------+
| 5  | Electric Motor           | 0                 | >= 60 instances    | Bare scrap stators/motors only exist in gated Roboflow repos. |
| 6  | Magnet-bearing Assembly  | 0                 | >= 40 instances    | Zero un-gated public detection datasets for HDD voice coils.  |
| 4  | Cable / Wire             | 0                 | >= 50 instances    | Open datasets are synthetic (WireSeg) or defect-only.         |
| 2  | CRT                      | 0                 | >= 30 instances    | Roboflow CRT is gated; Open Images TV conflates CRT with LCD. |
+----+--------------------------+-------------------+--------------------+---------------------------------------------------------------+
```

---

## 14. Training Gate Status

```
======================================================================
TRAINING BLOCKED — DATA ACQUISITION STILL REQUIRED
======================================================================
```

### Forensic Gate Evaluation:
* **Gate 1 (All 8 classes represented):** **FAIL** (4 populated, 4 empty)
* **Gate 2 (Min. 30–60 instances per class):** **FAIL** (Classes 2, 4, 5, 6 = 0)
* **Gate 3 (Total dataset size $\ge 600$ images):** **PARTIAL** (426 / 600)
* **Gate 4 to Gate 11 (Splits, Coords, Negatives, Hashes, QC):** **PASS**
* **Gate 12 (Formal user training authorization):** **NOT REQUESTED / BLOCKED**

**Technical Decision:**
Model training (`train_yolo.py`) will **NOT** be launched. Training with 4 empty classes would permanently break detector capability on electric motors, magnets, cables, and CRTs.

---

## 15. Exact Next Action

To resolve the remaining 4 empty classes legitimately:

1. **Option A (Provision API Credentials):**
   - Provide a Roboflow Universe API key or Kaggle credentials so the system can legitimately download the blocked candidate datasets:
     - `bruce-8m29m/motor-stator` (Class 5: Electric Motor)
     - `trcproject/e-waste-detection-model` (Class 4: Cable, Class 6: Magnet)
     - `amandeep-etjdw/crt` (Class 2: CRT)
2. **Option B (Physical Scrap Yard Image Acquisition & Annotation):**
   - Collect 30–60 authentic field photographs per class under CC0/CC-BY terms and annotate bounding boxes using standard labeling tools (LabelImg/CVAT).
3. **DO NOT LAUNCH `train_yolo.py`.**
4. **DO NOT CREATE `best.pt`.**
5. **DO NOT EXPORT ONNX.**
6. **MAINTAIN ZERO CHANGES TO PRODUCTION.**

---

## 16. Production Safety Attestation

```
==================================================
STEP 5A PRODUCTION SAFETY ATTESTATION
==================================================
Collector Portal:             UNCHANGED
Recycler Portal:              UNCHANGED
Admin Portal:                 UNCHANGED
Backend APIs:                 UNCHANGED
Database / Supabase:          UNCHANGED
GPS / Geolocation:            UNCHANGED
Payments / Ledger:            UNCHANGED
Traceability:                 UNCHANGED
Auth / JWT / OTP:             UNCHANGED
visionClassifier.ts:          UNCHANGED
AddLotPage.tsx:               UNCHANGED
YOLO Model Training:          NOT RUN
ONNX Export:                  NOT RUN
Frontend AI Integration:      NOT INTEGRATED
Git Commits / Pushes:         NOT PERFORMED
==================================================
```
