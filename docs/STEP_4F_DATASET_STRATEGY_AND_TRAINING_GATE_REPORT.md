# Step 4F Dataset Strategy Decision & Training Gate Report
**Project:** Kabadiwala Connect  
**SIH 2026 Problem Statement:** 26229  
**Feature:** AI-Powered E-Waste Material Identification (Genuine Edge AI Pipeline)  
**Document Type:** Dataset Strategy Audit, Training Gate Evaluation & Decision Report (Step 4F)  
**Date:** 16-09-2026  

---

## 1. Executive Summary

A forensic audit of the active dataset [`dataset_ewaste_v1/`](file:///d:/Sih_229Anti/dataset_ewaste_v1) was conducted directly against the filesystem using the official validator [`ai/training/dataset_check.js`](file:///d:/Sih_229Anti/ai/training/dataset_check.js).

### Core Findings:
1. **Structural Integrity: PASS.** The active dataset contains **370 verified images** and **370 paired YOLO labels** (330 annotated bounding boxes + 100 verified 0-byte hard negatives). All coordinates are normalized to $[0.0, 1.0]$, image headers are valid (0 corrupt), there are 0 missing or orphan labels, 0 duplicate image hashes, and 0 cross-split session leakages.
2. **Semantic Representation: SEVERELY DEFICIENT (5 of 8 Classes Empty).**
   - Classes populated: Class 0 (PCB: 140), Class 3 (LCD/LED: 69), Class 7 (Mixed E-Waste: 121), Hard Negatives: 100.
   - Classes empty: **Class 1 (Battery: 0)**, **Class 2 (CRT: 0)**, **Class 4 (Cable/Wire: 0)**, **Class 5 (Electric Motor: 0)**, **Class 6 (Magnet-bearing Assembly: 0)**.
3. **Training Gate Verdict:**
   ```
   TRAINING BLOCKED — DATA ACQUISITION REQUIRED
   ```
   Training cannot be initiated under this state. Attempting to train a detector with 5 empty classes would lead to total recall collapse on motors, magnets, batteries, cables, and CRTs, and would fail to solve the primary bug (PCB vs. Motor confusion) identified in the initial forensic audit.

---

## 2. Current Dataset Snapshot (Filesystem Truth)

Verified output of [`ai/training/dataset_check.js`](file:///d:/Sih_229Anti/ai/training/dataset_check.js) executed on 16-09-2026:

```
======================================================================
KABADIWALA CONNECT — E-WASTE DATASET INTEGRITY AUDIT
Target Directory: D:\Sih_229Anti\dataset_ewaste_v1
======================================================================

--- Checking Partition: TRAIN ---
  Images Found: 255
  Labels Found: 255
  Valid Instances: 225
  Hard Negatives (0-byte): 74

--- Checking Partition: VAL ---
  Images Found: 55
  Labels Found: 55
  Valid Instances: 44
  Hard Negatives (0-byte): 13

--- Checking Partition: TEST ---
  Images Found: 60
  Labels Found: 60
  Valid Instances: 61
  Hard Negatives (0-byte): 13

======================================================================
DATASET INTEGRITY AUDIT SUMMARY
======================================================================
Total Images Analyzed:       370
Total Labels Analyzed:       370
Total Bounding Boxes:        330
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
  - Train: 255 images (68.9%)
  - Val:    55 images (14.9%)
  - Test:   60 images (16.2%)
----------------------------------------------------------------------
[STATUS] AUDIT PASSED — Dataset is structurally valid for YOLOv8/YOLO11 training.
```

---

## 3. Per-Class Coverage Table

```
+----+--------------------------+-------------------+----------------+---------------+---------------------------------------------------------+----------------------------------------------+
| ID | Frozen Class Name        | Current Instances | Current Images | Status        | Reason                                                  | Required Action                              |
+----+--------------------------+-------------------+----------------+---------------+---------------------------------------------------------+----------------------------------------------+
| 0  | PCB / Circuit Board      | 140               | 140            | LOW COVERAGE  | Structurally sound; 10+ distinct boards (SanderGi MIT). | Retain; add 60+ images to reach target (200).|
| 1  | Battery                  | 0                 | 0              | EMPTY         | Zero instances; public datasets gated or blocked.       | Acquire 18650, pouch, SLA, and pack images.  |
| 2  | CRT                      | 0                 | 0              | EMPTY         | Zero instances; generic TV labels quarantined.          | Acquire bare CRT tubes & curved monitor sets.|
| 3  | LCD / LED Display        | 69                | ~45            | LOW COVERAGE  | Intact monitors present; lacks shattered panel scrap.   | Acquire damaged/smashed laptop/monitor panels|
| 4  | Cable / Wire             | 0                 | 0              | EMPTY         | Zero instances; Zenodo datasets are keypoints, not bboxes| Acquire tangled scrap wire and harnesses.    |
| 5  | Electric Motor           | 0                 | 0              | EMPTY         | CRITICAL GAP; public data is time-series vibration only.| Acquire stators, rotors, and pump/fan motors.|
| 6  | Magnet-bearing Assembly  | 0                 | 0              | EMPTY         | CRITICAL GAP; zero public datasets for voice coil magnets| Acquire HDD magnet brackets and speaker rings|
| 7  | Mixed E-Waste            | 121               | ~85            | LOW COVERAGE  | Keyboards, mice, phones, headphones well represented.   | Retain; add printer bodies and routers.      |
| -  | Hard Negatives           | 100               | 100            | READY         | 100 verified 0-byte files (bottles, shoes, cartons).    | Retain as negative background rejection set. |
+----+--------------------------+-------------------+----------------+---------------+---------------------------------------------------------+----------------------------------------------+
```

---

## 4. Training Readiness Analysis

```
+------------------------------------+-----------------------+-----------------------------+
| Dimension                          | Requirement           | Current Evaluation          |
+------------------------------------+-----------------------+-----------------------------+
| 1. Structural YOLO Syntax          | 100% Valid            | 100% PASS (370/370 valid)   |
| 2. File Corruption Rate            | 0.0%                  | 0.0% PASS (0 corrupt)       |
| 3. Duplicate Image Rate            | 0.0%                  | 0.0% PASS (0 duplicates)    |
| 4. Cross-Partition Session Leakage | 0.0%                  | 0.0% PASS (0 leakages)      |
| 5. Hard-Negative Background Ratio  | $\ge 20\%$ of dataset | 27.0% PASS (100 / 370)      |
| 6. Class Representation            | 8 of 8 classes        | **FAIL (3 of 8 classes)**   |
| 7. Class Imbalance Ratio           | $\le 3.0 : 1$         | **FAIL ($\infty : 1$)**     |
| 8. SIH Core Stream Viability       | Motor & Magnet active | **FAIL (Motor=0, Magnet=0)**|
+------------------------------------+-----------------------+-----------------------------+
```

### Forensic Takeaway:
Structural validity is a **necessary** condition for training, but **not a sufficient** condition. A model trained on a dataset with 5 empty classes will learn that objectness for those 5 classes is always zero. It cannot detect electric motors, stators, HDD magnets, batteries, cables, or CRTs, and will produce catastrophic false negatives in production.

---

## 5. Missing-Class Analysis

### A. Class 5: Electric Motor (0 instances / Min Target 400–500) — CRITICAL GAP
* **Importance:** Core driver of informal e-waste scrap value in India. Stators contain high-grade copper windings and cast iron/aluminum shells.
* **Failure Mode if Untrained:** In the legacy audit, the classifier mistook PCB heatsinks and toroidal inductors for Electric Motors because it had never been trained on real motors vs. real PCBs. Without real Motor training data, the detector cannot solve this fundamental confusion.

### B. Class 6: Magnet-bearing Assembly (0 instances / Min Target 150–250) — CRITICAL GAP
* **Importance:** Critical for rare-earth element (Neodymium/Dysprosium) recovery from hard disk drive voice-coil motors and ferrite extraction from loudspeaker magnet rings.
* **Failure Mode if Untrained:** The system cannot identify magnet assemblies in dismantled computer towers or audio gear.

### C. Class 1: Battery (0 instances / Min Target 150–250) — HIGH GAP
* **Importance:** Highest environmental and safety hazard (thermal runaway risk in Li-ion cells).
* **Failure Mode if Untrained:** High-hazard battery packs and swollen phone cells are ignored during digital lot creation.

### D. Class 4: Cable / Wire (0 instances / Min Target 150–250) — HIGH GAP
* **Importance:** High-volume copper recovery stream (ITEW11).
* **Failure Mode if Untrained:** Scrap cable bundles are unrecognized or misidentified as background clutter.

### E. Class 2: CRT (0 instances / Min Target 100–150) — HIGH GAP
* **Importance:** Hazardous leaded funnel glass (CEEW1).
* **Failure Mode if Untrained:** Heavy picture tubes are unrecognized.

---

## 6. Public Dataset Investigation Status

A thorough evaluation of all investigated public sources indicates why these 5 classes could not be acquired through open, un-gated scripts:

```
+----+-----------------------------+-------------------------------+-----------------------+-----------------------------------------------------------+
| #  | Investigated Public Source  | Targeted Class(es)            | Access Protocol       | Forensic Status / Barrier                                 |
+----+-----------------------------+-------------------------------+-----------------------+-----------------------------------------------------------+
| 1  | akhil2808 / YoloDataset     | Battery, LCD, PCB             | Hugging Face API      | BLOCKED: Gated academic repo (`401 Unauthorized`).        |
| 2  | TRCProject E-Waste Model    | Battery, Cable, HDD           | Roboflow Universe     | BLOCKED: Cloudflare anti-bot firewall (`403 Forbidden`).  |
| 3  | Bruce / motor-stator        | Electric Motor stators        | Roboflow Universe     | BLOCKED: Cloudflare anti-bot firewall (`403 Forbidden`).  |
| 4  | Kaggle archive.zip          | 10 E-waste categories         | Local Archive         | REJECTED: $150 \times 150$ classification only (0 boxes).  |
| 5  | Stanford TrashNet           | Packaging & waste             | GitHub                | REJECTED: Classification only (0 boxes).                  |
| 6  | Zenodo EV Battery / Cables  | Batteries & wires             | Zenodo DOI            | REJECTED: Robotic keypoint task, not YOLO bounding boxes.|
| 7  | Open Images Television      | CRT vs. LCD                   | Google Storage        | QUARANTINED: Conflates CRT and LCD screens.               |
| 8  | IEEE-IES / SKAB             | Electric Motors               | GitHub / Kaggle       | REJECTED: Time-series current/vibration sensors (0 images)|
+----+-----------------------------+-------------------------------+-----------------------+-----------------------------------------------------------+
```

---

## 7. Minimum Viable Training Gate (Target vs. Current)

```
+--------------------------------+-----------------------+-----------------------+-------------------------+
| Criterion                      | Target Spec (Ideal)   | Minimum Viable Gate   | Current Active State    |
+--------------------------------+-----------------------+-----------------------+-------------------------+
| Total Images                   | 3,650 – 5,000         | $\ge 800$ images      | 370 images              |
| Classes Represented            | 8 of 8 classes        | 8 of 8 classes        | **3 of 8 classes (FAIL)**|
| Min. Instances Per Class       | $\ge 300$ instances   | $\ge 50$ instances    | **5 classes = 0 (FAIL)**|
| Electric Motor Instances       | 500 – 700             | $\ge 60$ instances    | **0 instances (FAIL)**  |
| Magnet Assembly Instances      | 300 – 450             | $\ge 40$ instances    | **0 instances (FAIL)**  |
| Battery Instances              | 350 – 500             | $\ge 40$ instances    | **0 instances (FAIL)**  |
| Cable / Wire Instances         | 450 – 600             | $\ge 50$ instances    | **0 instances (FAIL)**  |
| CRT Instances                  | 300 – 400             | $\ge 30$ instances    | **0 instances (FAIL)**  |
| Hard Negative Backgrounds      | 350 – 500             | $\ge 80$ images       | 100 images (PASS)       |
| Split Isolation (Leakage)      | 0 Session Leakages    | 0 Session Leakages    | 0 Leakages (PASS)       |
| Bounding Box Formatting        | Normalized $[0, 1]$   | Normalized $[0, 1]$   | 100% PASS               |
+--------------------------------+-----------------------+-----------------------+-------------------------+
```

---

## 8. Path A vs. Path B Analysis

### Path A: Continue Data Acquisition / Credential Provisioning
* **Description:** Acquire verified data for the 5 missing classes through authenticated access (e.g., Roboflow export / Hugging Face token / localized collection) before training.
* **Pros:** Preserves the complete 8-class taxonomy; fulfills CPCB E-Waste Schedule-I requirements; solves the PCB vs. Motor root cause; scientifically honest.
* **Cons:** Requires resolving access to gated repositories or physical capture.

### Path B: Deliberately Reduced 3-Class Prototype Training
* **Description:** Drop the 5 missing classes and train a reduced 3-class YOLO model (PCB, LCD, Mixed + Hard Negatives).
* **Evaluation against Specification:**
  1. **Violates Step 1 Specification Freeze:** The 8-class taxonomy was frozen and ratified in Step 1. Changing it violates core constraints.
  2. **Violates SIH PS 26229:** The problem statement explicitly requires high-value component classification (Motors, Magnets, Batteries).
  3. **Fails to Solve Root Cause:** Without Motor instances, the model cannot distinguish between inductor coils on motherboards and standalone electric motors.
* **Verdict on Path B:** **REJECTED.**

---

## 9. Final Decision

```
======================================================================
DECISION: TRAINING BLOCKED — DATA ACQUISITION REQUIRED
======================================================================
```

**Scientific & Technical Justification:**
1. The project will **NOT** initiate YOLO training until all 8 classes have non-zero representation meeting the Minimum Viable Gate ($\ge 30\text{--}60$ instances per class).
2. The frozen 8-class taxonomy (`0: PCB`, `1: Battery`, `2: CRT`, `3: LCD/LED`, `4: Cable`, `5: Motor`, `6: Magnet`, `7: Mixed`) remains strictly intact.
3. No classes will be deleted, merged, or renamed.

---

## 10. Data Acquisition Priority for Next Step

To unblock model training, data acquisition must focus strictly on the 5 deficient classes in this priority order:

```
+------------+--------------------------+-------------------+-----------------------------------------------------------------+
| Priority   | Target Class             | Target Ingestion  | Preferred Physical Objects & Diversity                          |
+------------+--------------------------+-------------------+-----------------------------------------------------------------+
| Priority 1 | Electric Motor (Class 5) | $\ge 80$ images   | Fan stators, mixer motors, pump stators, bare copper windings.  |
| Priority 2 | Magnet Assembly (Class 6)| $\ge 50$ images   | HDD voice coil brackets, round loudspeaker ferrite magnets.     |
| Priority 3 | Battery (Class 1)        | $\ge 50$ images   | 18650 cells, swollen phone pouch cells, laptop battery strips.  |
| Priority 4 | Cable / Wire (Class 4)   | $\ge 50$ images   | Tangled copper wire bunches, appliance power cords.             |
| Priority 5 | CRT (Class 2)            | $\ge 35$ images   | Bare glass funnel picture tubes, curved CRT televisions.        |
+------------+--------------------------+-------------------+-----------------------------------------------------------------+
```

---

## 11. Dataset Quality Gate Checklist

Model training (`train_yolo.py`) will remain strictly blocked until every gate on this checklist is marked `[X]`:

- [ ] **Gate 1:** All 8 frozen classes represented ($N > 0$).
- [ ] **Gate 2:** Minimum Viable Gate satisfied ($\ge 30\text{--}60$ instances for every class).
- [ ] **Gate 3:** Total dataset size $\ge 600$ images.
- [ ] **Gate 4:** Train / Val / Test partitions populated with proper ratio (~70 / 15 / 15).
- [ ] **Gate 5:** All bounding boxes verified normalized in range $[0.0, 1.0]$.
- [ ] **Gate 6:** Hard-negative background count $\ge 100$ verified 0-byte label files.
- [ ] **Gate 7:** Exact duplicate hash check passes with 0 duplicates.
- [ ] **Gate 8:** Session leakage check passes with 0 cross-partition leaks.
- [ ] **Gate 9:** Every source tracked in `DATASET_SOURCE_MANIFEST.md` with verified license.
- [ ] **Gate 10:** Overarching PCB Rule enforced (0 internal coils boxed as motors).
- [ ] **Gate 11:** Automated checker [`ai/training/dataset_check.js`](file:///d:/Sih_229Anti/ai/training/dataset_check.js) passes with 0 errors.
- [ ] **Gate 12:** Formal user authorization granted for training launch.

---

## 12. Exact Next Step

1. **Do NOT launch training.**
2. **Execute targeted acquisition** for the 5 missing classes (Motor, Magnet, Battery, Cable, CRT) via:
   - Authenticated access to candidate repositories (`akhil2808` / `TRCProject` / `Bruce motor-stator`), OR
   - Localized photo acquisition / dataset donation of real scrap components.
3. Stage and convert newly acquired data in [`dataset_staging/`](file:///d:/Sih_229Anti/dataset_staging).
4. Merge and re-run [`ai/training/dataset_check.js`](file:///d:/Sih_229Anti/ai/training/dataset_check.js).
5. Review the Training Gate Checklist before initiating Step 5 (Model Training).

---

## 13. Production Safety Attestation

A comprehensive codebase audit confirms that zero production services, user interfaces, or database tables have been touched:

```
==================================================
STEP 4F PRODUCTION SAFETY ATTESTATION
==================================================
Collector Portal:         UNCHANGED
Recycler Portal:          UNCHANGED
Admin Portal:             UNCHANGED
Backend APIs:             UNCHANGED
Database / Supabase:      UNCHANGED
GPS / Geolocation:        UNCHANGED
Payments / Ledger:        UNCHANGED
Traceability:             UNCHANGED
Auth / JWT / OTP:         UNCHANGED
Existing visionClassifier:UNCHANGED
AddLotPage.tsx:           UNCHANGED
Model Training:           NOT RUN
ONNX Models:              NOT CREATED
Frontend AI Runtime:      NOT INTEGRATED
Git Tracking:             NOT COMMITTED / NOT PUSHED
==================================================
```
