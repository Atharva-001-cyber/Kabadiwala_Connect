# Step 4E Public Dataset Gap Filling & Verified Acquisition Report
**Project:** Kabadiwala Connect  
**SIH 2026 Problem Statement:** 26229  
**Feature:** AI-Powered E-Waste Material Identification (Genuine Edge AI Pipeline)  
**Document Type:** Public Dataset Gap Filling & Verified Ingestion Report (Step 4E)  
**Date:** 16-09-2026  

---

## 1. Objective
The objective of Step 4E is to bridge the material detection dataset gaps identified in previous audits by acquiring, verifying, and ingesting **legally cleared, public computer-vision datasets** with authentic licensing and provenance, without blocking the project on physical scrap-yard field photography.

### Strict Non-Negotiables Maintained:
* **Zero Model Training:** No training scripts were launched, no weights (`best.pt`) were produced, and no ONNX models were exported.
* **Zero Client Integration:** No code was modified in the React frontend, and `visionClassifier.ts` remains untouched.
* **Zero Business Workflow Modifications:** Collector, Recycler, Admin, Supabase, GPS, Mandi pricing, and Ledger services remain 100% operational and isolated.
* **Zero Fabricated Data:** No synthetic images, no AI-generated graphics, and no fabricated bounding boxes.
* **Preservation of Base Dataset:** The original 160 images from Step 4C were preserved completely untouched.

---

## 2. Previous Dataset Status (End of Step 4C / 4D)
Prior to Step 4E, [`dataset_ewaste_v1/`](file:///d:/Sih_229Anti/dataset_ewaste_v1) contained:
* **Total Images:** 160
* **Total Labels:** 160
* **Annotated Bounding Boxes:** 129
* **Verified Hard Negatives:** 50 (0-byte text files)
* **Classes Represented:**
  - Class 0 (PCB): 60 instances
  - Class 3 (LCD/LED Display): 22 instances
  - Class 7 (Mixed E-Waste): 47 instances
  - Classes 1 (Battery), 2 (CRT), 4 (Cable), 5 (Motor), 6 (Magnet): **0 instances**
* **QC Integrity:** Passed (0 corrupt, 0 missing labels, 0 invalid boxes, 0 duplicates, 0 leakages).

---

## 3. Sources Investigated

```
+-------------------------------------------------------------------------------------------------------+
| SOURCE INVESTIGATION AUDIT MATRIX                                                                     |
+----+-----------------------------+-----------------------+----------------------+---------------------+
| #  | Source Candidate            | Platform              | Claimed Classes      | Investigation Date  |
+----+-----------------------------+-----------------------+----------------------+---------------------+
| 1  | SanderGi / PCB-Detection    | Hugging Face / GitHub | Whole PCBs           | 16-09-2026          |
| 2  | Google Open Images v7       | Google Storage / S3   | Electronics & Litter | 16-09-2026          |
| 3  | TACO (Trash Annotations)    | GitHub                | Litter & Hard Negs   | 16-09-2026          |
| 4  | akhil2808 / YoloDataset     | Hugging Face          | Battery, LCD, PCB    | 16-09-2026          |
| 5  | TRCProject E-Waste Model    | Roboflow Universe     | Battery, Cable, HDD  | 16-09-2026          |
| 6  | Bruce / motor-stator        | Roboflow Universe     | Motor Stators        | 16-09-2026          |
| 7  | Kaggle archive.zip          | Kaggle (akshat103)    | 10 Category folders  | 16-09-2026          |
| 8  | Stanford TrashNet           | GitHub                | 6 Waste categories   | 16-09-2026          |
| 9  | Zenodo EV Battery / Cables  | Zenodo Open Research  | Battery, Connectors  | 16-09-2026          |
| 10 | KratosWen / Gear8           | Hugging Face          | Window Motor Gears   | 16-09-2026          |
+----+-----------------------------+-----------------------+----------------------+---------------------+
```

---

## 4. Sources Accepted

| Accepted Source | Platform | License | Ingestion Role | Justification |
| :--- | :--- | :--- | :--- | :--- |
| **SanderGi / PCB-Detection** | Hugging Face Hub | **MIT License** | Class 0 (`PCB_Circuit_Board`) | Permissive MIT open-source license. High-resolution raw photography of printed circuit boards with exact OBB coordinates converted to axis-aligned bounding boxes under the Overarching PCB Rule. |
| **Google Open Images v7** | Google Cloud / AWS S3 | **CC BY 4.0** | Class 3 (`LCD_LED_Display`), Class 7 (`Mixed_EWaste`), Hard Negatives | Permissive CC BY 4.0 terms. Fully audited bounding-box annotations with normalized coordinates for computer monitors, keyboards, mice, phones, headphones, and domestic litter. |
| **TACO Dataset** | GitHub Repository | **CC BY 4.0** | Hard Negatives (0-byte background rejection) | Peer-reviewed academic open dataset (Pedro F. Proença & Pedro Simões). High-resolution outdoor non-electronic litter scenes (bottles, cans, cartons) verified with 0-byte labels. |

---

## 5. Sources Rejected / Quarantined

| Rejected / Quarantined Source | Investigated Target | Stated License | Operational Verdict | Technical & Legal Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **akhil2808 / YoloDataset** | Batteries, LCDs, PCBs | Academic (Gated) | **QUARANTINED** | Endpoint returned `401 Unauthorized` (`gated: manual`). Requires individual author verification and manual access grant under Nature *Scientific Reports* terms. |
| **TRCProject (Roboflow)** | Batteries, Cables, HDDs | CC BY 4.0 (Community) | **QUARANTINED** | Programmatic HTTP download blocked by Cloudflare anti-bot security (`403 Forbidden`). Origin clearance of underlying web images cannot be independently verified. |
| **Bruce / motor-stator** | Motor stators | Community Upload | **QUARANTINED** | Automated HTTP download blocked by Cloudflare anti-bot firewall (`403 Forbidden`). Stator images cannot be verified without manual browser export. |
| **Kaggle archive.zip** | 10 E-waste classes | Apache 2.0 | **REJECTED** | Images are downsampled to $150 \times 150$ pixels and organized in classification folders with **zero bounding boxes**. Converting would require fabricating annotations. |
| **Stanford TrashNet** | General waste | Unspecified Academic | **REJECTED** | Classification directory structure only (zero bounding boxes); white posterboard backgrounds unrepresentative of recycling streams. |
| **Zenodo EV Battery / Cables** | Batteries & wires | CC BY 4.0 | **REJECTED** | Dataset designed for robotic keypoint grasping and plug insertion (spatial coordinates/masks), not normalized YOLO bounding boxes. |
| **Open Images Television (`/m/07c52`)** | CRT vs. LCD | CC BY 4.0 | **QUARANTINED** | Generic tag mixes curved cathode ray glass tubes with modern slim LCD/LED flatscreens. In accordance with Section 8 & 9 rules, ambiguous tags are quarantined. |

---

## 6. License / Provenance Evidence

1. **SanderGi / PCB-Detection:**
   - License: `MIT License`
   - Evidence: Verified official `LICENSE` file in source GitHub repository (`https://github.com/SanderGi/PCB-Detection/blob/master/LICENSE`).
   - Copyright: (c) 2023 Sander Gielisse. Permissive terms permit commercial use, modification, and redistribution with attribution.
2. **Google Open Images v7:**
   - License: `Creative Commons Attribution 4.0 International (CC BY 4.0)`
   - Evidence: Published by Google Research (`https://storage.googleapis.com/openimages/web/factsfigures.html`). Bounding box annotations licensed under CC BY 4.0; underlying images licensed under CC BY 2.0.
3. **TACO Litter Dataset:**
   - License: `Creative Commons Attribution 4.0 International (CC BY 4.0)`
   - Evidence: Verified `LICENSE` file in official GitHub repository (`https://github.com/pedropro/TACO/blob/master/LICENSE`). Pedro F. Proença and Pedro Simões (2020).

---

## 7. Images Imported Per Source (Step 4E Delta)

```
+------------------------------------+--------------------------+-----------------------+
| Source Dataset                     | Ingested in Step 4E      | Cumulative Ingested   |
+------------------------------------+--------------------------+-----------------------+
| SanderGi / PCB-Detection           | +80 images / +80 labels  | 140 images / 140 lbls |
| Google Open Images v7              | +130 images / +130 labels| 190 images / 190 lbls |
| TACO Dataset                       | 0 (Retained base 40)     | 40 images / 40 lbls   |
+------------------------------------+--------------------------+-----------------------+
| TOTAL EXPANSION                    | +210 images / +210 labels| 370 images / 370 lbls |
+------------------------------------+--------------------------+-----------------------+
```

---

## 8. Images Imported Per Class (Cumulative Distribution)

```
+----+--------------------------+---------------+---------------+--------------------+------------------+
| ID | Frozen Class Name        | Base (Step 4C)| Step 4E Delta | Final Active Boxes | Target Quota     |
+----+--------------------------+---------------+---------------+--------------------+------------------+
| 0  | PCB_Circuit_Board        | 60            | +80           | **140**            | 200 – 300        |
| 1  | Battery                  | 0             | 0             | **0**              | 150 – 250 !      |
| 2  | CRT                      | 0             | 0             | **0**              | 100 – 150 !      |
| 3  | LCD_LED_Display          | 22            | +47           | **69**             | 150 – 200        |
| 4  | Cable_Wire               | 0             | 0             | **0**              | 150 – 250 !      |
| 5  | Electric_Motor           | 0             | 0             | **0**              | 400 – 500 !      |
| 6  | Magnet_bearing_Assembly  | 0             | 0             | **0**              | 150 – 250 !      |
| 7  | Mixed_EWaste             | 47            | +74           | **121**            | 200 – 300        |
+----+--------------------------+---------------+---------------+--------------------+------------------+
| -  | Hard Negatives (Bkgrnd)  | 50            | +50           | **100** (0-byte)   | 100 – 200 (MET)  |
+----+--------------------------+---------------+---------------+--------------------+------------------+
|    | TOTAL INSTANCES          | 179           | +251          | **430** instances  | 1,500 – 2,500    |
+----+--------------------------+---------------+---------------+--------------------+------------------+
```

---

## 9. Annotation Conversion Performed

### A. SanderGi OBB $\rightarrow$ YOLO Conversion
* **Input (Oriented Bounding Box):** 4-point polygon `0 x1 y1 x2 y2 x3 y3 x4 y4`.
* **Math:**
  $$x_{min} = \min(x_1, x_2, x_3, x_4), \quad x_{max} = \max(x_1, x_2, x_3, x_4)$$
  $$y_{min} = \min(y_1, y_2, y_3, y_4), \quad y_{max} = \max(y_1, y_2, y_3, y_4)$$
  $$w = x_{max} - x_{min}, \quad h = y_{max} - y_{min}$$
  $$cx = x_{min} + \frac{w}{2}, \quad cy = y_{min} + \frac{h}{2}$$
* **Overarching PCB Rule Enforced:** Encloses whole circuit board in Class 0. Inductors, coils, heatsinks, and capacitors remain internal features and are never labeled as motors.

### B. Open Images BBox $\rightarrow$ YOLO Conversion
* **Input:** CSV normalized boundaries `[XMin, XMax, YMin, YMax]`.
* **Conversion:** $w = XMax - XMin$, $h = YMax - YMin$, $cx = XMin + \frac{w}{2}$, $cy = YMin + \frac{h}{2}$.
* **Target Classes:**
  - `/m/02522` Computer monitor $\rightarrow$ Class 3 (`LCD_LED_Display`)
  - `/m/01m2v` Keyboard, `/m/020lf` Mouse, `/m/050k8` Phone, `/m/01b7fy` Headphones $\rightarrow$ Class 7 (`Mixed_EWaste`)
  - Pure background scenes with only `/m/04dr76w` (Bottle), `/m/09j5n` (Footwear), `/m/025dyy` (Box) $\rightarrow$ 0-byte label files.

---

## 10. Motor Coverage (Class 5)
* **Total Images:** `0`
* **Total Instances:** `0`
* **Coverage Status:** `0.0% (CRITICAL DEFICIT)`
* **Forensic Finding:** Public web datasets contain zero open bounding-box datasets for stripped or dismantled electric motors, ceiling fan stators, or rusted pump housings. Time-series vibration benchmarks (IEEE-IES, SKAB) exist, but visual object detection data is absent.
* **Status:** `ELECTRIC MOTOR GAP REMAINS`

---

## 11. Magnet Coverage (Class 6)
* **Total Images:** `0`
* **Total Instances:** `0`
* **Coverage Status:** `0.0% (CRITICAL DEFICIT)`
* **Forensic Finding:** Extracted voice-coil neodymium actuator brackets and ferrite speaker rings are completely unrepresented in public bounding-box repositories. Complete hard disk drives cannot be mapped to magnet-bearing assemblies without dedicated magnet-level bounding boxes.
* **Status:** `MAGNET-BEARING ASSEMBLY GAP REMAINS`

---

## 12. Battery Coverage (Class 1)
* **Total Images:** `0`
* **Total Instances:** `0`
* **Coverage Status:** `0.0% (HIGH DEFICIT)`
* **Forensic Finding:** Candidate dataset `akhil2808/YoloDataset` on Hugging Face is gated (`401 Unauthorized`). Roboflow community battery datasets are blocked by Cloudflare anti-bot security (`403 Forbidden`). Open Images 600 boxable classes do not include standalone battery cells.
* **Status:** `BATTERY GAP REMAINS`

---

## 13. CRT Coverage (Class 2)
* **Total Images:** `0`
* **Total Instances:** `0`
* **Coverage Status:** `0.0% (HIGH DEFICIT)`
* **Forensic Finding:** Open Images `/m/07c52` Television conflates modern slim LCD screens with curved glass cathode ray tubes. In accordance with strict mapping rules, ambiguous television labels were quarantined rather than falsely labeled as CRT.
* **Status:** `CRT GAP REMAINS`

---

## 14. Cable Coverage (Class 4)
* **Total Images:** `0`
* **Total Instances:** `0`
* **Coverage Status:** `0.0% (HIGH DEFICIT)`
* **Forensic Finding:** Public wire datasets on Zenodo focus on robotic connector keypoints for automated factory plugging, rather than tangled scrap copper bundles.
* **Status:** `CABLE / WIRE GAP REMAINS`

---

## 15. LCD Coverage (Class 3)
* **Total Instances:** `69` (was 22, +47 added from Open Images `/m/02522`)
* **Coverage Status:** `PARTIALLY SATISFIED`
* **Target Quota:** 150 – 200 instances (Progress: 46.0% of target).

---

## 16. PCB Coverage (Class 0)
* **Total Instances:** `140` (was 60, +80 added from SanderGi)
* **Coverage Status:** `SUBSTANTIALLY SATISFIED`
* **Target Quota:** 200 – 300 instances (Progress: 70.0% of target).
* **Rule Compliance:** 100% adherence to Overarching PCB Rule.

---

## 17. Mixed Coverage (Class 7)
* **Total Instances:** `121` (was 47, +74 added from Open Images)
* **Coverage Status:** `SUBSTANTIALLY SATISFIED`
* **Target Quota:** 200 – 300 instances (Progress: 60.5% of target).
* **Constituents:** Keyboards, mice, smartphones, wireless headphones.

---

## 18. Hard-Negative Coverage
* **Total Images:** `100` (was 50, +50 added from Open Images & TACO)
* **Coverage Status:** `TARGET MET (100 / 100–200)`
* **Format:** Exactly 100 verified 0-byte `.txt` files.
* **Non-e-waste items:** PET plastic bottles, footwear, corrugated cardboard cartons, aluminum drink cans.
* **Target Constraint:** Zero target e-waste components in any hard-negative frame.

---

## 19. Duplicate / QC Results

Running [`ai/training/dataset_check.js`](file:///d:/Sih_229Anti/ai/training/dataset_check.js) across [`dataset_ewaste_v1/`](file:///d:/Sih_229Anti/dataset_ewaste_v1):

```
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
[STATUS] AUDIT PASSED — Dataset is structurally valid for YOLOv8/YOLO11 training.
```

* **Deduplication:** An initial collision check detected 25 duplicate images between base `oi_neg_*` files and newly downloaded candidates; all 25 duplicates were permanently purged. Final duplicate count: **0**.
* **Session Leakage:** Board session IDs (`BCG-E2422B`, `HackRF`, `Zedboard`, etc.) are partitioned exclusively into single partitions. Cross-partition leakage count: **0**.

---

## 20. Remaining Class Gaps

```
+----+--------------------------+---------------+---------------+---------------+
| ID | Frozen Class Name        | Active Count  | Target Quota  | Net Deficit   |
+----+--------------------------+---------------+---------------+---------------+
| 0  | PCB_Circuit_Board        | 140           | 200 – 300     | -60 instances |
| 1  | Battery                  | 0             | 150 – 250     | -150 instances|
| 2  | CRT                      | 0             | 100 – 150     | -100 instances|
| 3  | LCD_LED_Display          | 69            | 150 – 200     | -81 instances |
| 4  | Cable_Wire               | 0             | 150 – 250     | -150 instances|
| 5  | Electric_Motor           | 0             | 400 – 500     | -400 instances|
| 6  | Magnet_bearing_Assembly  | 0             | 150 – 250     | -150 instances|
| 7  | Mixed_EWaste             | 121           | 200 – 300     | -79 instances |
| -  | Hard Negatives           | 100           | 100 – 200     | MET           |
+----+--------------------------+---------------+---------------+---------------+
```

---

## 21. Training Readiness Verdict

```
STRUCTURALLY VALID — COVERAGE INCOMPLETE
TRAINING NOT READY — DATA COVERAGE INSUFFICIENT
```

### Forensic Justification:
While [`dataset_ewaste_v1/`](file:///d:/Sih_229Anti/dataset_ewaste_v1) satisfies all 12 structural quality gates (0 corrupt files, 0 label syntax errors, 0 duplicates, 0 leakages, exact bounding boxes), **model training must NOT be initiated**:
1. **Empty Minority Classes:** Classes 1 (Battery), 2 (CRT), 4 (Cable), 5 (Motor), and 6 (Magnet) have exactly **0 instances**. A model trained on this dataset would have 0% recall on 5 of the 8 target streams.
2. **Severe Class Imbalance:** The dataset currently consists solely of PCB ($42.4\%$), LCD ($20.9\%$), Mixed ($36.7\%$), and Hard Negatives. Training now would bias the model and fail to solve the primary problem statement.
3. **Action Required:** Targeted public acquisition with manual API access (for Roboflow / Hugging Face) or direct field capture is required to supply Motors, Magnets, Batteries, Cables, and CRTs.

---

## 22. Production-Safety Attestation

A forensic inspection of the repository confirms that zero production components have been modified:

```
==================================================
STEP 4E PRODUCTION SAFETY ATTESTATION
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
Client Runtime:           NOT INTEGRATED
Git Tracking:             NOT COMMITTED / NOT PUSHED
==================================================
```
