# AI SPECIFICATION FREEZE REPORT
**Project:** Kabadiwala Connect  
**SIH 2026 Problem Statement:** 26229  
**Feature:** AI-Powered E-Waste Material Identification (Genuine Edge AI Pipeline)  
**Document Status:** FROZEN & RATIFIED (Step 1 Specification Baseline)  

---

## 1. CORE OBJECTIVE & BASELINE
The goal of this system is to identify relevant e-waste materials and components from photographs captured by an informal scrap collector in real-world conditions, providing reliable, un-manipulated material identification to populate digital e-waste lots during formalization into the recycling chain.

### Deprecated Patterns (Strictly Forbidden in New Architecture):
- MobileNet v2 ImageNet-1k generic object classifier
- Handcoded regex/substring keyword mappings (e.g. `radiator` -> `MOTOR`)
- Synthetic confidence floors (`Math.max(0.92, ...)` up to `0.97`)
- Canvas pixel-heuristic bounding boxes
- Hardcoded explanatory text dictionaries
- False UI claims of `YOLOv8-Nano` without an actual trained YOLO model

---

## 2. FROZEN 8 TARGET CLASSES

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

### Critical Negative Constraints:
- Non-e-waste items (bottles, shoes, clothing, cardboard, domestic plastics, tools, concrete floors) are **Hard Negatives / Background Rejection Samples**.
- They must **never** become Class 8, Class 9, etc. They produce zero bounding boxes.

---

## 3. MULTI-OBJECT & AGGREGATION SPECIFICATION
- **Multi-Object Detection:** The detector localizes all scrap components in the scene ($N \ge 1$).
- **Dominant Item:** If one detection exceeds $65\%$ spatial area, it is suggested as Primary.
- **Mixed Pile:** If multiple components share co-equal space, suggested as **Class 7 (Mixed E-Waste)** with secondary component tags retained.
- **Multi-Photo Verification:** Consensus aggregation across multiple lot photos; conflicting predictions trigger user prompt rather than silently overwriting with the last photo.

---

## 4. CONFIDENCE & EVALUATION TARGETS
- **Unmanipulated Softmax:** Real model confidence only.
- **Targets (Not Claimed Until Measured):**
  - mAP@50 $\ge 0.82$
  - mAP@50-95 $\ge 0.58$
  - Per-class Precision $\ge 0.80$
  - Per-class Recall $\ge 0.78$
  - Inference latency $\le 85\text{ms}$ on browser WebAssembly/WebGL
  - ONNX bundle size $\le 12\text{MB}$
