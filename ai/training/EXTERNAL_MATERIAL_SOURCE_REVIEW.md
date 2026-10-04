# External material source research — 2026-10-03

No new source approved for all-eight-class training. No new model trained or
deployed in this review. The returned v2 rotation candidate remains unselected
because validation metrics regressed relative to v1.

## Sources inspected

| Source | Evidence | Decision |
|---|---|---|
| Local cables-nl42k COCO export | 4,816 train, 1,220 valid, 794 test images; zero annotations for category 0 `cables`; actual boxes are Antenne, Batterie, PSU, RBS and other telecom equipment | Reject as annotated Cable_Wire source; do not map supercategory to cable |
| Existing Roboflow v44 export | Its 77 named classes do not include Cable_Wire, Electric_Motor, magnet assemblies or separated plastic casings | Cannot fill the four material gaps by class renaming |
| https://universe.roboflow.com/ljh-iomy0/magnet-v4nzc | Page lists CC BY 4.0 and N_tip/S_tip classes | Reject direct mapping to e-waste magnet assemblies |
| https://universe.roboflow.com/pro-diuuk/ewaste | Page lists CC BY 4.0; generic plastic/metal/phone/battery/waste/gadgets/keys | Generic plastic is not verified electronic casing; not admitted |
| https://universe.roboflow.com/licenseplate-nf0dc/motor-detection-axpk3 | motorLight/motorWithPerson/licensePlate | Vehicles, not scrap electric motors; reject |
| https://github.com/holesond/movingcables | Author source: CC BY-SA 4.0 dataset, composed clips, small archive 11.5 GiB; sample 80.7 MiB contains test/0003 and test/0006 only | Potential separate cable evaluation source; do NOT train on sample test clips; no large download started |
| https://amsacta.unibo.it/id/eprint/6654/ | CC BY 4.0, 39 GB, chroma-key automatically generated segmentation images | Not ordinary unmodified collector photos; not silently introduced into current real-photo dataset |

Search also found motor signal/thermal/nameplate datasets: these do not establish
ordinary RGB whole-motor recognition. No exact suitable magnet/plastic-body
training dataset has been verified in this research. This is a search limitation,
not a claim that none exists anywhere.

## Implemented guard

`check_coco_source.py` counts actual category annotations, rejects unknown IDs and
reports zero target coverage even if the dataset title/supercategory matches.
It never marks a source training-approved. Unit test covers the misleading cables
supercategory case. This complements, not replaces, human/visual annotation review.

## Remaining blockers to final training

Correct full-object boxes for cable/motor sources; verified magnet/plastic-body
examples; source attribution/permissions; split-group review; GPU execution and
independent evaluation. Website photos alone do not supply object annotations.
Do not expand the app's material mapping or activate a candidate to conceal missing
coverage. Existing app weights and source datasets remain unchanged.
