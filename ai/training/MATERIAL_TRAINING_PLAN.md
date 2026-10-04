# Material candidate: review before training

The device v2 rotation experiment regressed on validation. Keep existing deployed
weights unchanged. Do not expand the 11-class model and silently reinterpret its
class indexes. Prepare an isolated material candidate with a versioned class map;
browser integration must validate that map before accepting any future model.

## Proposed eight material meanings (not a change to current weights)

| ID | Candidate name | Include | Do not infer |
|---|---|---|---|
| 0 | PCB_Circuit_Board | Visible circuit boards | A complete phone/laptop is not a PCB box |
| 1 | Battery | Visible cells/packs | Chemistry, capacity or safety from appearance alone |
| 2 | CRT | CRT TVs/monitors or recognizable CRT units | Arbitrary source class named 0 |
| 3 | LCD_LED_Display | Flat-panel monitors/TVs or identifiable display panels | A tablet is not automatically a saleable detached display |
| 4 | Cable_Wire | Electrical/electronic wires and cable bundles | Copper versus aluminium purity/value through insulation |
| 5 | Electric_Motor | Visible motor assemblies | Every fan/mixer appliance is not a motor component box |
| 6 | Magnet_bearing_Assembly | Identifiable exposed magnet-bearing assemblies | Whole HDDs/speakers without an annotated identifiable assembly |
| 7 | E_Waste_Plastic_Body | Identifiable separated electronic casing/body | Mixed scrap piles, household plastic, complete keyboards |

ID 7 is a NEW proposed meaning; legacy Mixed_EWaste labels must not be renamed.
Ambiguous objects require review/exclusion rather than forced labels. All relevant
visible targets in multi-object scenes need annotation. Never ask users to open
batteries, CRTs or otherwise dismantle hazardous equipment to obtain photos.

## Evidence and workflow

1. `prepare_material_review.py` inventories each legacy image, hash, original
   labels and split into a fresh CSV. No source files are changed. All rows start
   PENDING; the CSV is not proof of verified labels or training readiness.
2. Review source permissions, original pixels and each box; quarantine bad CRT
   and whole-HDD imports. Annotate genuine plastic casings separately. The inventory
   records hashes but does not itself decode images or detect near duplicates.
3. Record reviewer, source/use permission, physical device/session group and notes.
   Obtain replacements for missing classes. Correct labels in a NEW candidate
   dataset, never overwrite the legacy dataset during review.
4. Before training, validate image decoding, box syntax and all class meanings;
   group original devices/sessions and near duplicates before splitting. Keep
   training/validation and untouched field evaluation separate. Existing test data
   already examined is not a new independent final benchmark.
5. Train a baseline on the corrected data first. Compare one change at a time on
   validation. Report every class, negatives, missed objects and abstention—not
   just average mAP. Do not optimize thresholds on the final holdout.
6. Verify ONNX numerical parity, Android latency/camera uploads and workflow
   regressions before local candidate activation. Preserve rollback weights.

Training is currently BLOCKED on semantic/source review and missing valid magnet/
plastic examples. Colab GPU is a later execution step, not a substitute for data.
No revised material training kit or trained material candidate is claimed yet.
