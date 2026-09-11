# SIH 2026 Problem Statement #229: Formal Scrap Collector Field Research & Usability Protocol

> [!IMPORTANT]
> **COMPLIANCE NOTICE — NO SYNTHETIC FIELD DATA**  
> Under SIH 2026 Problem Statement #229 guidelines, field research requires empirical investigation involving at least **TWO (2)** working scrap collectors (Kabadiwalas) or aggregators. This document establishes the standardized field interview protocol, data collection instrument, and empirical evaluation framework.  
> **Status**: `REAL FIELD VALIDATION REQUIRED FROM TEAM` — To be conducted physically by student researchers prior to final jury evaluation.

---

## 1. Ethical Guidelines & Research Consent
- **Voluntary Participation**: Every participant must be informed that participation is purely voluntary for academic and technological evaluation.
- **Anonymity & Privacy**: No sensitive PII (Aadhaar, home address, bank account numbers) is to be collected. Use anonymized reference identifiers (`CR-LKO-01`, `AR-PUN-02`).
- **Informed Consent**: Verbal or written consent must be obtained and documented prior to administering the protocol.

---

## 2. Participant Dossier & Operational Context

| Field Item | Description / Input Prompt | Collector Interview 1 (`CR-01`) | Collector Interview 2 (`CR-02`) | Aggregator Interview 3 (`AR-01`) |
|:---|:---|:---|:---|:---|
| **Collector / Aggregator Reference ID** | Anonymized identifier (e.g., `CR-LKO-01`) | `[Enter ID]` | `[Enter ID]` | `[Enter ID]` |
| **Operating Location** | Mandi / Ward / District (e.g. Aminabad, Lucknow) | `[Enter District/Mandi]` | `[Enter District/Mandi]` | `[Enter District/Mandi]` |
| **Years in Informal Scrap Collection** | Experience span (e.g. 5 yrs, 12 yrs) | `[Enter Years]` | `[Enter Years]` | `[Enter Years]` |
| **Daily / Weekly E-Waste Volume** | Average kg handled per week | `[Enter kg/week]` | `[Enter kg/week]` | `[Enter kg/week]` |
| **Primary Material Types Handled** | PCBs, Cables, Batteries, CRT, LCD, Motors, etc. | `[Enter streams]` | `[Enter streams]` | `[Enter streams]` |
| **Current Collection Channels** | Door-to-door, repair shops, small offices, auctions | `[Enter channels]` | `[Enter channels]` | `[Enter channels]` |

---

## 3. Commercial Dynamics & Baseline Informal Economics

| Field Item | Economic Parameter | Collector 1 Response | Collector 2 Response | Aggregator Response |
|:---|:---|:---|:---|:---|
| **Price Discovery Method** | Word-of-mouth, middleman dictation, phone call | `[Method used]` | `[Method used]` | `[Method used]` |
| **Typical Middleman Rate per kg** | Baseline rate paid by local scrap shop (e.g. ₹60/kg for PCB) | `[₹/kg received]` | `[₹/kg received]` | `[₹/kg paid]` |
| **Weight Deductions ('Kattai')** | Arbitrary scale cut imposed (e.g. 5–15% deduction) | `[Deduction %]` | `[Deduction %]` | `[Deduction %]` |
| **Moisture / Dirt / Casing Penalties** | Uncalibrated reduction applied by buyer | `[Observed cut]` | `[Observed cut]` | `[Observed cut]` |
| **Transportation Costs Incurred** | Handcart rental, tempo fare, fuel deduction | `[₹ spent per trip]`| `[₹ spent per trip]`| `[Transport mode]` |
| **Payment Settlement Medium** | Cash in hand, credit tally/khatta, partial delay | `[Settlement mode]` | `[Settlement mode]` | `[Settlement mode]` |
| **Average Delay in Payment** | Instant, 3–7 days, end-of-month | `[Payment delay]` | `[Payment delay]` | `[Payment delay]` |

---

## 4. Occupational Safety & Informal Hazard Practices

| Field Item | Safety Risk Under E-Waste Rules 2022 | Collector 1 Observation | Collector 2 Observation | Aggregator Observation |
|:---|:---|:---|:---|:---|
| **Wire & Cable Stripping Method** | Open-air combustion / burning vs mechanical stripping | `[Burning / Stripping]` | `[Burning / Stripping]` | `[Segregation method]` |
| **Battery Storage & Handling** | Stored loose in sack vs insulated terminals | `[Storage practice]` | `[Storage practice]` | `[Spill precautions]` |
| **CRT / LCD Breakage Incidence** | Tube implosion, mercury exposure, glass cuts | `[Incident history]` | `[Incident history]` | `[Storage condition]` |
| **Chemical Leaching / Acid Use** | Backyard aqua regia/nitric acid PCB stripping | `[Presence/Absence]`| `[Presence/Absence]`| `[Disposal method]` |
| **Personal Protective Equipment** | Gloves, boots, goggles, dust masks used | `[PPE used]` | `[PPE used]` | `[PPE used]` |
| **Safety Knowledge & Awareness** | Understanding of toxic heavy metals (Pb, Hg, Cd) | `[Awareness level]` | `[Awareness level]` | `[Awareness level]` |

---

## 5. Prototype Usability Evaluation (Hands-On Tasks)

Participants are handed an entry-level smartphone running `http://localhost:5173` in their native tongue (Hindi or Marathi):

| Usability Task | User Action Tested | Success Criteria | Collector 1 Result | Collector 2 Result | Usability Friction Encountered |
|:---|:---|:---|:---:|:---:|:---|
| **Task 1: Language & Audio** | Switch language to Hindi/Marathi and tap audio button (`निर्देश सुनें`) | Understood audio rate readout without reading text | `[PASS / FAIL]` | `[PASS / FAIL]` | `[Notes on volume, accent, speed]` |
| **Task 2: Photo Capture & Compression** | Take photo of scrap item using camera | Image captured in <10 seconds, canvas compressed | `[PASS / FAIL]` | `[PASS / FAIL]` | `[Notes on lighting, camera trigger]` |
| **Task 3: Category Confirmation** | Inspect rule-based suggestion and tap category | Understood `सामग्री सुझाव — पुष्टि आवश्यक` | `[PASS / FAIL]` | `[PASS / FAIL]` | `[Notes on icon recognition]` |
| **Task 4: Weight Input** | Select weight using 10kg/20kg preset or keypad | Entered valid weight without negative number | `[PASS / FAIL]` | `[PASS / FAIL]` | `[Notes on numeric keypad clarity]` |
| **Task 5: Recycler Comparison** | Compare 2 recycler offers and identify "Best Price" | Recognized higher quote & pickup badge | `[PASS / FAIL]` | `[PASS / FAIL]` | `[Notes on offer comparison clarity]` |
| **Task 6: Handover Verification** | Read 4-digit handover OTP to driver | Understood OTP verification step | `[PASS / FAIL]` | `[PASS / FAIL]` | `[Notes on OTP communication]` |
| **Task 7: Earnings Passbook** | Inspect ledger voucher & margin uplift | Understood cash vs digital voucher breakdown | `[PASS / FAIL]` | `[PASS / FAIL]` | `[Notes on pocket uplift clarity]` |

---

## 6. Qualitative Feedback, Pain Points & Feature Requests

1. **Top Pain Points Identified by Collectors**:
   - `[Document specific pain point 1]`
   - `[Document specific pain point 2]`
   - `[Document specific pain point 3]`
2. **Collector Comprehension of Vernacular Icons vs Words**:
   - `[Document feedback on icon usability vs technical English terms]`
3. **Collector Trust in Electronic Weighbridge Scale vs Hand Scale**:
   - `[Document collector attitude towards calibrated scale verification]`
4. **Collector Attitude towards Cash vs Digital Ledger Passbook**:
   - `[Document collector preference for cash settlement vs instant UPI transfer]`
5. **Requested Features or Workflow Simplifications**:
   - `[Document collector requested changes]`

---

## 7. Session Certification & Evidence Dossier

- **Session Date & Time**: `[YYYY-MM-DD HH:MM]`
- **Location of Interview**: `[Mandi / Yard Address]`
- **Student Researchers Conducting Fieldwork**: `[Names & Team Role]`
- **Evidence Attached**:
  - `[ ]` Audio recording of interview (with participant consent)
  - `[ ]` Photograph of participant interacting with prototype on smartphone
  - `[ ]` Field notebook scan / physical sign-off sheet
- **Empirical Status**: `PENDING PHYSICAL INTERVIEW EXECUTION BY STUDENT RESEARCH TEAM`
