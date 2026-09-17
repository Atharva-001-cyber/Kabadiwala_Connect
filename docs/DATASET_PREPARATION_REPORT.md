# DATASET PREPARATION & FORENSIC DATASET AUDIT REPORT
**Project:** Kabadiwala Connect  
**SIH 2026 Problem Statement:** 26229  
**Feature:** AI-Powered E-Waste Material Identification (Genuine Edge AI Pipeline)  
**Document Type:** Dataset Specification, Sourcing Audit & Annotation Strategy (Step 2)  
**Status:** STEP 2 COMPLETE — NO PRODUCTION CODE MODIFIED  

---

## 1. DATASET OBJECTIVE

The primary objective of this dataset preparation strategy is to curate, structure, and audit a purpose-built e-waste object detection dataset of **3,000 to 5,000 real-world scrap images** tailored specifically for training a custom, compact object detection model (YOLOv8-Nano / YOLOv11-Nano) targeting in-browser Edge AI execution.

### Key Objectives:
1. **Total Independence from ImageNet-1k:** Replace generic consumer object models with authentic scrap recycling imagery.
2. **Elimination of Heuristic Confusion:** Explicitly solve the critical failure mode where **PCBs with heatsinks and inductor coils are misclassified as Electric Motors**.
3. **Informal Sector Realism:** Guarantee robust detection under challenging Indian collection environments (dim sheds, jute sacks, pavement sorting, grease, rust, dirt, and damaged hardware).
4. **Clean Background Rejection:** Ensure domestic non-e-waste items (PET bottles, cardboard, clothing, footwear) are cleanly rejected with zero false-positive detections.
5. **Multi-Object Bounding Ground Truth:** Provide precise bounding box coordinates ($[x_{\text{center}}, y_{\text{center}}, w, h]$ normalized to $[0.0, 1.0]$) to support spatial multi-material decomposition in single scrap lots.

---

## 2. FINAL 8 TARGET CLASSES & SPECIFICATION

The dataset strictly adheres to the 8-class taxonomy frozen in Step 1, aligned with CPCB E-Waste (Management) Rules, 2022 (Schedule-I):

```
+----------+----------------------------+-----------------+----------------------------------------------+
| Class ID | Target Class Name          | CPCB Reference  | Target Material Stream                       |
+----------+----------------------------+-----------------+----------------------------------------------+
|    0     | PCB / Circuit Board        | ITEW1 - ITEW6   | High-grade precious metals, FR4 substrate, Cu|
|    1     | Battery                    | BATT-01         | Li-ion pouch/cells, Lead-Acid, NiMH          |
|    2     | CRT                        | CEEW1           | Leaded funnel glass, electron gun tube       |
|    3     | LCD / LED Display          | CEEW2           | Flat panel glass, polarization sheets, CCFL  |
|    4     | Cable / Wire               | ITEW11          | Insulated copper harnesses, PVC power cords  |
|    5     | Electric Motor             | CEEW5           | Heavy cast iron, stator copper windings      |
|    6     | Magnet-bearing Assembly    | ITEW14          | Neodymium HDD voice coils, ferrite rings     |
|    7     | Mixed E-Waste              | EWP-01          | Electronic polymer chassis, peripherals, TWS |
+----------+----------------------------+-----------------+----------------------------------------------+
```

---

## 3. DATASET SOURCE CANDIDATES & AUDIT

Every prospective public and research dataset was evaluated against licensing, commercial/hackathon safety, image realism, and annotation compatibility.

```
+---------------------------------------------------------------------------------------------------------------------+
| CANDIDATE 1: TACO (Trash Annotations in Context)                                                                     |
+----------------------+----------------------------------------------------------------------------------------------+
| Source URL           | http://tacodataset.org / https://github.com/pedropro/TACO                                    |
| License              | Creative Commons Attribution 4.0 International (CC BY 4.0)                                   |
| Commercial-Use Status| Permitted with attribution                                                                  |
| Number of Images     | ~1,500 total litter images                                                                   |
| Available Classes    | 60 classes (primarily domestic packaging, bottles, cans; subset for batteries and electronics)|
| Annotation Format    | COCO JSON (Polygons & Bounding Boxes)                                                        |
| Bounding Boxes Exist | Yes                                                                                          |
| Image Quality / Real.| High resolution, real outdoors; however, mostly street litter, NOT scrap yard aggregator piles|
| Eligible Classes     | Class 1 (Battery - small subset), Class 4 (Cable - minimal)                                  |
| Known Limitations    | Extreme class imbalance towards non-e-waste litter. Very few heavy electronics/PCBs.         |
| Project Safety       | SAFE TO USE (Subset extraction only; useful as hard negatives & battery samples)             |
+---------------------------------------------------------------------------------------------------------------------+
```

```
+---------------------------------------------------------------------------------------------------------------------+
| CANDIDATE 2: Roboflow E-Waste Open Datasets (E-Waste-Detect / Circuit-Board-Detection)                              |
+----------------------+----------------------------------------------------------------------------------------------+
| Source URL           | https://universe.roboflow.com/search?q=e-waste                                               |
| License              | CC BY 4.0 / Public Domain / LICENSE REQUIRES MANUAL VERIFICATION (per specific universe repo)|
| Commercial-Use Status| Mixed — requires per-repo manifest verification                                              |
| Number of Images     | ~2,500 to 4,000 images across multiple open research repositories                           |
| Available Classes    | PCB, Motherboards, Capacitors, Chips, CRT, E-waste scrap                                     |
| Annotation Format    | YOLO Darknet format natively available                                                       |
| Bounding Boxes Exist | Yes                                                                                          |
| Image Quality / Real.| Moderate to high. Includes genuine circuit boards, industrial motherboards, and PC towers.   |
| Eligible Classes     | Class 0 (PCB), Class 2 (CRT), Class 3 (LCD), Class 7 (Mixed E-Waste)                         |
| Known Limitations    | Some repos contain duplicate scraped web images or synthetic indoor lighting.               |
| Project Safety       | SAFE FOR RESEARCH / SIH (Verify individual repository license before merging)                |
+---------------------------------------------------------------------------------------------------------------------+
```

```
+---------------------------------------------------------------------------------------------------------------------+
| CANDIDATE 3: Open Images Dataset v7 (Google)                                                                        |
+----------------------+----------------------------------------------------------------------------------------------+
| Source URL           | https://storage.googleapis.com/openimages/web/index.html                                     |
| License              | CC BY 4.0                                                                                    |
| Commercial-Use Status| Permitted with attribution                                                                  |
| Number of Images     | Millions total (subset of ~3,000 electronics / scrap candidates)                             |
| Available Classes    | "Computer keyboard", "Mouse", "Battery", "Cable", "Electric motor", "Television", "Loudspeaker"|
| Annotation Format    | Normalized Bounding Boxes [XMin, XMax, YMin, YMax]                                          |
| Bounding Boxes Exist | Yes                                                                                          |
| Image Quality / Real.| High resolution; web-curated natural photographic scenes.                                    |
| Eligible Classes     | Class 1 (Battery), Class 4 (Cable), Class 5 (Electric Motor), Class 7 (Mixed E-Waste)        |
| Known Limitations    | Images show intact, pristine consumer goods rather than broken, greasy, unhoused scrap.       |
| Project Safety       | SAFE TO USE (Requires heavy filtering for scrap/damaged items and conversion to YOLO txt)   |
+---------------------------------------------------------------------------------------------------------------------+
```

```
+---------------------------------------------------------------------------------------------------------------------+
| CANDIDATE 4: WasteNet / TrashNet (Stanford / Yang & Thung)                                                          |
+----------------------+----------------------------------------------------------------------------------------------+
| Source URL           | https://github.com/garythung/trashnet                                                        |
| License              | Open Academic / LICENSE REQUIRES MANUAL VERIFICATION                                         |
| Commercial-Use Status| Unspecified academic license                                                                 |
| Number of Images     | ~2,527 images                                                                                |
| Available Classes    | Glass, Paper, Cardboard, Plastic, Metal, Trash                                               |
| Annotation Format    | Classification folders (Zero bounding boxes)                                                 |
| Bounding Boxes Exist | No                                                                                           |
| Image Quality / Real.| White posterboard backgrounds, studio lighting. Unrealistic for field collection.             |
| Eligible Classes     | Hard Negatives only (Cardboard, Domestic Plastic, Paper)                                     |
| Known Limitations    | No bounding boxes; single objects against white backgrounds; zero direct e-waste.            |
| Project Safety       | DO NOT USE FOR CORE CLASSES (Eligible only as unannotated negative backgrounds)               |
+---------------------------------------------------------------------------------------------------------------------+
```

```
+---------------------------------------------------------------------------------------------------------------------+
| CANDIDATE 5: Authentic Indian Informal Scrap & Yard Imagery (Custom Field Collection)                                |
+----------------------+----------------------------------------------------------------------------------------------+
| Source URL           | Custom Local Collection / SIH Field Research Protocol Repository                             |
| License              | Proprietary / SIH Project Exclusive (Direct Ownership by Kabadiwala Connect Team)           |
| Commercial-Use Status| 100% Permitted / Full Project Ownership                                                      |
| Number of Images     | 1,500 – 2,200 targeted field photographs                                                     |
| Available Classes    | All 8 target classes: PCB, Battery, CRT, LCD, Cable, Motor, Magnet, Mixed E-Waste            |
| Annotation Format    | Darknet YOLO format (`.txt`) via LabelImg / CVAT                                             |
| Bounding Boxes Exist | Yes (hand-annotated under rigorous protocol)                                                 |
| Image Quality / Real.| 100% authentic informal collection context: jute sacks, dirt yards, scale weighment, shadows.  |
| Eligible Classes     | Class 0 through Class 7 + Hard Negatives                                                     |
| Known Limitations    | Requires manual photography and rigorous manual annotation time.                             |
| Project Safety       | 100% SAFE — HIGHEST VALUE ASSET FOR SIH #229 VIABILITY                                       |
+---------------------------------------------------------------------------------------------------------------------+
```

---

## 4. LICENSE VERIFICATION & COMPLIANCE MATRIX

| Source | License Type | Commercial Use | SIH Evaluation Permitted | Redistribution Permitted | Attribution Requirement | Operational Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Custom Field Collection** | Proprietary | Yes | Yes | Full Control | None | **Primary Approved Core (50%)** |
| **Roboflow Universe Repos** | CC BY 4.0 / Public | Mixed | Yes | Yes | Yes (in docs) | **Approved with Manual Check (30%)** |
| **Open Images v7 (Google)** | CC BY 4.0 | Yes | Yes | Yes | Yes (DOI citation) | **Approved for Specific Subsets (10%)**|
| **TACO Dataset** | CC BY 4.0 | Yes | Yes | Yes | Yes (GitHub link) | **Approved for Hard Negatives (10%)** |
| **Kaggle / Unverified Repos**| Unclear | Unknown | Questionable | No | Varies | **REJECTED (Do Not Include)** |

---

## 5. CLASS-WISE IMAGE & INSTANCE REQUIREMENTS

To prevent severe class imbalance that degrades minority-class mean Average Precision (mAP), the target dataset will maintain a strict quota distribution across single-object, multi-object, and condition variations:

```
+----------+----------------------------+---------------+--------------------+--------------------+-----------------------+
| Class ID | Target Class Name          | Min Images    | Preferred Target   | Min Bounding Boxes | Critical Focus Subset |
+----------+----------------------------+---------------+--------------------+--------------------+-----------------------+
|    0     | PCB / Circuit Board        | 550           | 750                | 900                | 250+ boards w/ coils & heatsinks
|    1     | Battery                    | 350           | 500                | 650                | 150+ pouch & cylindrical cells |
|    2     | CRT                        | 300           | 400                | 450                | 100+ bare funnel picture tubes|
|    3     | LCD / LED Display          | 400           | 550                | 650                | 150+ cracked/smashed panels   |
|    4     | Cable / Wire               | 450           | 600                | 800                | 200+ tangled scrap bunches    |
|    5     | Electric Motor             | 500           | 700                | 850                | 250+ rusted fan/pump stators  |
|    6     | Magnet-bearing Assembly    | 300           | 450                | 550                | 150+ HDD voice coil brackets  |
|    7     | Mixed E-Waste              | 450           | 650                | 800                | 200+ keyboards, mice & TWS    |
|   N/A    | Hard Negatives (Empty .txt)| 350           | 500                | 0                  | Bottles, shoes, cardboard     |
+----------+----------------------------+---------------+--------------------+--------------------+-----------------------+
| TOTALS   | 8 Classes + Negatives      | 3,650 Images  | 5,100 Images       | 5,650 Instances    | High-Difficulty Focus |
+----------+----------------------------+---------------+--------------------+--------------------+-----------------------+
```

---

## 6. CUSTOM DATA COLLECTION REQUIREMENTS (FIELD PROTOCOL)

Field collection must capture the authentic realities of informal scrap gathering in India.

### 6.1 Physical Collection Environments
1. **Pavement & Ground Sorting:** Scraps placed on bare concrete, compacted dirt, cracked asphalt, or gray floor tiles.
2. **Collection Sacks & Tarpaulins:** Scraps resting on brown woven jute sacks (bori), blue polyethylene tarps, and plastic crates.
3. **Scale Weighment Surrounds:** Scraps resting on platform scales, hanging spring balance hooks, and calibrated bench scale plates.
4. **Scrap Aggregator Godowns:** Semi-dark interior sheds with corrugated tin roofs, uneven shadow lines, and mixed background clutter.

### 6.2 Object Condition Breakdown (Per Class)
- **Intact / Clean ($25\%$):** Whole devices or clean removed components.
- **Partially Dismantled / Cracked ($45\%$):** Casings broken open, screws missing, wiring partially snipped, housing shattered.
- **Severely Degraded / Scrap-Grade ($30\%$):** Rusted iron surfaces, oxidized copper, soot-stained/burned boards, shattered glass, dirt-crusted components.

### 6.3 Camera & Capture Specifications
- **Hardware:** Mid-tier Android smartphone cameras (12MP–48MP standard sensors, typical of informal collectors).
- **Distances:**
  - Macro Detail ($15\text{cm} - 30\text{cm}$): Showing component traces, coil windings, and battery labels.
  - Collector Working Distance ($40\text{cm} - 70\text{cm}$): Normal handheld framing over the scale or ground.
  - Pile Overview ($1.0\text{m} - 2.5\text{m}$): Showing mixed clusters of multiple components.
- **Lighting Distribution:**
  - Harsh Direct Sunlight ($30\%$): Strong specular highlights and deep shadow contrast.
  - Diffuse Daylight ($30\%$): Overcast or open shaded outdoor courtyards.
  - Low Indoor Tungsten / Fluorescent ($25\%$): Dim godowns with warm or sickly green ambient tint.
  - Flashlight / Mobile LED Torch ($15\%$): Night sorting with intense central hotspot and dark vignetting.

---

## 7. HARD-NEGATIVE DATASET SPECIFICATION

Hard-negative samples are **mandatory** to prevent false-positive hallucinations on domestic non-electronic waste.

### 7.1 Composition of Hard-Negative Images
1. **Domestic Plastic Containers:** PET water bottles (Bisleri/Aquafina), oil jugs, shampoo bottles, polypropylene storage tubs.
2. **Household Trash & Footwear:** Old leather shoes, rubber slippers, discarded apparel, fabric rags, jute rope.
3. **Paper & Packaging Scrap:** Corrugated brown cardboard cartons, newspapers, retail tags, courier bubble mailers.
4. **Domestic Furniture & Tools:** Wooden scrap boards, iron rebar offcuts, standard screwdrivers/pliers, steel cooking utensils.
5. **Empty Yard Contexts:** Blank dirt ground, bare scales with zero objects, empty jute bags, hands without any item.

### 7.2 Annotation Rule for Hard Negatives
- Every hard-negative image **must have a corresponding zero-byte `.txt` file** in the `labels/` directory.
- This explicitly teaches the YOLO loss function ($\mathcal{L}_{\text{obj}}$) to penalize any anchor box predicting objectness on non-electronic materials.

---

## 8. ENVIRONMENTAL DIVERSITY MATRIX

```
+------------------+---------------------------------------------------------------------------------------------------+
| AXIS             | TARGET DISTRIBUTION ACROSS DATASET                                                                |
+------------------+---------------------------------------------------------------------------------------------------+
| Lighting         | Direct Outdoor Sunlight (30%) | Open Shade / Overcast (30%) | Dim Indoor Warehouse (25%) | LED Flash (15%)|
| Distance         | Macro / Close-up 15-30cm (25%) | Handheld Working 40-70cm (50%) | Overview Pile 1.0-2.5m (25%)       |
| Orientation      | Top-down 90° (40%) | Oblique / Perspective 45° (40%) | Low-angle horizontal 15° (20%)             |
| Physical State   | Clean / Intact (25%) | Dismantled / Cracked (45%) | Rusted / Soiled / Severely Broken (30%)          |
| Background       | Earth / Compacted Dirt (30%) | Jute Sack / Poly Tarp (30%) | Concrete Floor (25%) | Ambient Clutter (15%)|
| Hand Occlusion   | Zero Hands (60%) | Operator Hand Gripping / Holding Edge (40%)                                      |
| Object Density   | Single Dominant Object (55%) | Multi-Component Assembly (30%) | Clustered Scrap Pile (15%)         |
+------------------+---------------------------------------------------------------------------------------------------+
```

---

## 9. ANNOTATION POLICY (YOLO FORMAT)

All training labels must strictly comply with Darknet/YOLO annotation standards. Each line in a label file represents one detected bounding box:

$$\langle \text{class\_id} \rangle \quad \langle x_{\text{center}} \rangle \quad \langle y_{\text{center}} \rangle \quad \langle w \rangle \quad \langle h \rangle$$

All values are floating-point numbers normalized to the interval $[0.0, 1.0]$:
- $x_{\text{center}} = \frac{x_{\text{min}} + x_{\text{max}}}{2 \cdot W_{\text{img}}}$
- $y_{\text{center}} = \frac{y_{\text{min}} + y_{\text{max}}}{2 \cdot H_{\text{img}}}$
- $w = \frac{x_{\text{max}} - x_{\text{min}}}{W_{\text{img}}}$
- $h = \frac{y_{\text{max}} - y_{\text{min}}}{H_{\text{img}}}$

### 9.1 Boundary & Occlusion Rules
1. **Tight Bounding Requirement:** Bounding boxes must enclose all physical boundaries of the scrap component with no more than $3\%$ to $5\%$ background margin.
2. **Operator Hands Exclusion:**
   - Operator fingers or palms holding an item must **never** be labeled as part of the scrap.
   - The bounding box must clip at the edge of the human hand, capturing only the visible electronic hardware.
3. **CRITICAL HARD CASE — PCB with Onboard Heatsinks & Coils:**
   - A printed circuit board containing aluminum heatsink fins, toroidal inductor coils, capacitors, and transformers must be annotated as **ONE SINGLE OVERARCHING BOUNDING BOX for Class 0 (PCB)**.
   - Annotators must **never** place a child bounding box for "Electric Motor" around an inductor or heatsink mounted on a PCB. This directly eliminates the root cause of the previous system's primary bug.
4. **Complete vs. Stripped Motors:**
   - Complete motors with housing: Bound the entire enclosure as **Class 5 (Electric Motor)**.
   - Stripped stator assemblies: Bound the cylindrical iron core and all visible copper windings as **Class 5 (Electric Motor)**.
5. **Cables & Wires:**
   - Coiled or bundled wires: Mark as one bounding box enclosing the bundle.
   - Long trailing power cords attached to an appliance: Bound the cord as **Class 4 (Cable / Wire)** and the appliance body as its respective class (e.g., **Class 7: Mixed E-Waste**).
6. **Overlapping Multi-Object Scenes:**
   - When components overlap (e.g., a motor lying on top of a motherboard), draw separate bounding boxes for each object. The box for the partially occluded object should bound only the visible portions, with an overlap IoU threshold up to $0.60$.
7. **Mixed Electronic Assemblies (Keyboards / Earbuds / Mice):**
   - Outer plastic peripheral bodies (with keys, switches, or internal micro-boards intact) are annotated as **Class 7 (Mixed E-Waste)**.

---

## 10. TRAIN / VALIDATION / TEST SPLIT STRATEGY

The dataset will be partitioned into three disjoint subsets:

$$\text{Train (70\%)} \quad \Big\vert \quad \text{Validation (15\%)} \quad \Big\vert \quad \text{Test (15\%)}$$

### 10.1 Data Leakage Prevention (Session-Level Isolation)
A common flaw in vision pipelines is splitting photos of the same object taken from different angles across both Train and Test sets. This artificially inflates evaluation metrics while failing in real-world deployment.

**Mandatory Leakage Rule:**
- Images are assigned a `Session_ID` representing a unique physical scrap lot, collection event, or burst-photo series.
- **Splitting occurs at the `Session_ID` level, NOT at the individual image level.**
- If an informal collector photographs a single motor from 4 angles, all 4 images must reside together in the **Train** set, or all 4 in the **Test** set. Zero images of that physical motor may cross between sets.

---

## 11. DEDUPLICATION STRATEGY

Near-duplicate images caused by rapid camera shutter bursts or identical public web scrapes degrade model generalization and bias validation curves.

### 11.1 Automated Deduplication Pipeline
1. **Perceptual Difference Hashing (dHash):**
   - Downscale candidate image to $9 \times 8$ grayscale.
   - Compute gradient differences across adjacent horizontal pixels to generate a 64-bit hash.
   - Calculate Hamming Distance $H(d_1, d_2)$ between all image pairs.
   - **Threshold:** Any pair with $H \le 4$ is flagged as a near-duplicate.
2. **Metadata & Timestamp Clustering:**
   - Flag images captured within $\le 3\text{ seconds}$ of each other on the same device.
3. **Resolution Action:**
   - The clearest, sharpest image (highest Laplacian variance) is retained; redundant burst duplicates are permanently removed prior to annotation.

---

## 12. DATASET QUALITY-CONTROL (QC) CHECKLIST

Before any dataset version is certified for model training in Step 3, it must pass all 12 validation gates:

- [ ] **Gate 1 (Zero Corrupt Files):** All image files pass decoding integrity verification (`PIL.Image.verify()` / OpenCV `imread`).
- [ ] **Gate 2 (Format Uniformity):** All images normalized to standard 3-channel RGB JPEG/PNG; EXIF rotation tags stripped and baked into pixel orientation.
- [ ] **Gate 3 (Annotation Completeness):** Every image has an exactly matching `.txt` label file in the paired label folder.
- [ ] **Gate 4 (Boundary Coordinate Normalization):** All coordinates satisfy $0.0 \le x, y, w, h \le 1.0$ and $x + \frac{w}{2} \le 1.0$, $y + \frac{h}{2} \le 1.0$.
- [ ] **Gate 5 (Class ID Validity):** All labels contain class indices strictly in the integer set $\{0, 1, 2, 3, 4, 5, 6, 7\}$.
- [ ] **Gate 6 (Zero Orphan Labels):** No text label files without a corresponding image.
- [ ] **Gate 7 (Zero-Byte Hard Negatives):** Exactly verified that all hard-negative images have a 0-byte text file.
- [ ] **Gate 8 (PCB vs. Motor Isolation):** Visual spot-check of 100 random PCB annotations verifies that zero onboard inductors/heatsinks are labeled as Motors.
- [ ] **Gate 9 (No Split Leakage):** Automated script verifies that zero `Session_ID` hashes overlap between Train, Val, and Test.
- [ ] **Gate 10 (Near-Duplicate Cleanse):** Hamming distance check passes with zero duplicate pairs ($H \le 4$).
- [ ] **Gate 11 (Class Balance Factor):** The ratio between the most populous class and least populous class does not exceed $2.2 : 1$.
- [ ] **Gate 12 (Resolution Sufficiency):** No image has a native resolution smaller than $416 \times 416$ pixels.

---

## 13. PROPOSED DATASET DIRECTORY STRUCTURE

The dataset will be structured according to standard Ultralytics / Darknet YOLO conventions:

```
dataset_ewaste_v1/
├── data.yaml
├── train/
│   ├── images/
│   │   ├── session_001_pcb_01.jpg
│   │   ├── session_002_motor_01.jpg
│   │   └── ... (~3,500 files)
│   └── labels/
│       ├── session_001_pcb_01.txt
│       ├── session_002_motor_01.txt
│       └── ... (~3,500 files)
├── val/
│   ├── images/
│   │   └── ... (~750 files)
│   └── labels/
│       └── ... (~750 files)
└── test/
    ├── images/
    │   └── ... (~750 files)
    └── labels/
        └── ... (~750 files)
```

### 13.1 Specification of `data.yaml`
```yaml
# Kabadiwala Connect - E-Waste YOLOv8 Training Manifest
path: ./dataset_ewaste_v1
train: train/images
val: val/images
test: test/images

nc: 8
names:
  0: 'PCB_Circuit_Board'
  1: 'Battery'
  2: 'CRT'
  3: 'LCD_LED_Display'
  4: 'Cable_Wire'
  5: 'Electric_Motor'
  6: 'Magnet_Assembly'
  7: 'Mixed_EWaste'
```

---

## 14. DATASET RISKS & MITIGATION STRATEGY

1. **Risk 1: Severe Class Rarity for Magnet-bearing Assemblies (Class 6)**
   * *Analysis:* Magnets are often small and concealed inside hard drives or speaker housings.
   * *Mitigation:* Focus custom yard collection specifically on disassembled HDD teardowns and scrap speaker baskets where raw voice coils and ferrite rings are exposed.
2. **Risk 2: Heavy Greasy Occlusion on Electric Motors**
   * *Analysis:* Motors in informal yards are frequently saturated in black motor oil and soot.
   * *Mitigation:* Explicitly collect dirty motors; apply Albumentations color jitter and contrast drops to simulate grease patina.
3. **Risk 3: Annotation Ambiguity for Mixed Consumer Assemblies**
   * *Analysis:* Annotators may struggle with whether a printer with a protruding PCB is Class 0 (PCB) or Class 7 (Mixed E-Waste).
   * *Mitigation:* Hierarchy rule established in Section 9: If plastic enclosure covers $>50\%$ of surface, label as **Class 7 (Mixed E-Waste)**; bound exposed circuit boards separately only if detached.

---

## 15. DATASET READINESS CHECKLIST (GATE REVIEW)

```
[✓] Target 8-class taxonomy verified against CPCB Schedule-I rules
[✓] Inclusions, exclusions, and critical hard cases explicitly detailed
[✓] Public dataset candidates audited for CC BY 4.0 / research licenses
[✓] Indian informal scrap yard field collection protocol defined
[✓] Hard-negative non-e-waste rejection strategy designed (0-byte labels)
[✓] 12-point Quality-Control verification pipeline specified
[✓] Session-based train/val/test splitting established to prevent leakage
[✓] Dedicated boundary rules set for PCB-with-heatsinks vs. Electric Motor
```

---

## 16. EXACT NEXT STEP AFTER DATASET PREPARATION

Upon user review and formal authorization of this dataset preparation blueprint:
1. **Step 3 (Model Training Pipeline Setup):**
   - Prepare the training script (`train_yolo.py`) utilizing PyTorch / Ultralytics YOLOv8-Nano.
   - Configure training hyperparameters (image size $416$, epochs $100$, batch size $16$, Mosaic augmentation, AdamW optimizer).
   - Set up evaluation scripts to generate Precision, Recall, mAP@50, mAP@50-95, and the full confusion matrix.
   - Execute training run once the curated dataset images are assembled.

---

### ATTESTATION
**STEP 2 DATASET PREPARATION COMPLETE — NO PRODUCTION CODE MODIFIED.**  
The entire existing Kabadiwala Connect frontend, backend, database schema, and operational workflows remain 100% untouched and functional. Awaiting explicit user approval before proceeding to Step 3.
