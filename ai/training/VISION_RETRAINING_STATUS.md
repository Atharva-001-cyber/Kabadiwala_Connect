# Vision audit — 2026-09-30

## Update — 2026-10-01

The user supplied the Roboflow v44 YOLOv8 ZIP. A recognition-only candidate dataset
was prepared at `dataset_devices_v44_reviewed` (ignored dataset directory): 1,835
train / 1,106 validation / 461 test images, 11 recognition classes. The preparer
excluded 473 cross-split source overlaps, 166 same-split exact duplicates and one
visually suspect CRT-as-flat-panel image. All other-class images are excluded
whole, not relabelled as background. Perceptual/physical-device leakage and a full
semantic audit remain pending. Tablet/HDD data is sparse, so no accuracy claim.

`scratch/device-training-kit.zip` includes only public-source prepared data,
attribution and training scripts. `Device_Training_Colab.ipynb` is the GPU handoff.
Local GPU inventory found Intel Iris Xe, no NVIDIA CUDA GPU. Bundled Python lacks
torch. No long CPU or paid cloud job was started. The runner's local preflight
passed all 3,402 image hashes and canonical label hashes. Windows CRLF/Linux LF
portability is regression-tested. Model training, ONNX parity, calibration and
app integration of new weights remain pending. Existing app weights unchanged.

The rest of this document records the earlier diagnosis before the v44 upload.

## Status: retraining blocked; current weights NOT replaced

The model was executed locally in isolated Chrome against the two user photos.
No photos were uploaded to a service or added to training.

| Input | Existing model output | Interpretation |
|---|---|---|
| WhatsApp Image 2026-09-30 at 21.21.01.jpeg | LCD candidate, score 0.44175085; LOW_CONFIDENCE | Screen-bearing device; not confirmed as a detached LCD component |
| WhatsApp Image 2026-09-30 at 21.21.01 (1).jpeg | NO_DETECTION | Keyboard/part of laptop; outside the current eight-class taxonomy |

Scores are not measured classification accuracy. These two diagnostic examples
are not enough to estimate field performance and must not become training examples
while being presented as unseen tests.

## Confirmed data problems

The existing structural checker passed 759 images and 1,162 boxes. This only
checks format/readability, not semantic label correctness or all near-duplicates.

- `crt_rf_train_001_26b4f2b6.jpg`, `crt_rf_train_002_a8deeac5.jpg`, and
  `crt_rf_train_003_98e5ea96.jpg` were visually inspected. They show yellow/green
  footage, not visible CRT monitors/TVs. The imported source has a single class
  named `0`, which `ingest_step7.js` assigned to CRT. Quarantine the entire
  `crt_rf_` family pending expert review, not just these three files.
- `ingest_step7.js` maps whole HDD/internal HDD boxes to magnet assemblies.
  A whole drive is not an annotated exposed magnet. The `magnet_rf_` family
  requires relabelling, not automatic reuse.
- Mixed_EWaste is not Plastic Body. Whole-device identification needs separate
  recognition classes; do not change ledger/sale categories merely to fit labels.

`semantic_preflight.py` blocks known suspect imports without deleting originals.
`train_yolo.py` runs it and the structural check before training. The frontend
requires manual confirmation for current CRT/magnet predictions pending new weights.
This is a safety fix, NOT an accuracy improvement or a newly trained model.

## Source review

- Candidate: https://universe.roboflow.com/electronic-waste-detection/e-waste-dataset-r0ojc
  lists CC BY 4.0, 77 device classes, including screen/keyboard/phone categories.
  Version-specific ZIP, class list, attribution and underlying source review are
  required. It aggregates other datasets; avoid duplicate train/test source items.
- https://universe.roboflow.com/trcproject/e-waste-detection-model — CC BY 4.0;
  existing local export already contains Keyboard and Smart Phone. Keep their
  original meaning; do not convert whole devices into material components.
- https://www.kaggle.com/datasets/akshat103/e-waste-image-dataset — public page
  did not expose usable metadata through the reader; licence/format not verified.
- https://zenodo.org/records/17239217 — MMEWaste covers small electronic
  components (e.g. resistors/diodes), not the required whole-device taxonomy;
  full-release and licence details need checking. Not selected for this task.
- https://zenodo.org/records/12565131 — hyperspectral WEEE data is not a direct
  substitute for ordinary RGB phone photographs.

## What is still required

1. Obtain a versioned YOLO-format dataset export with true CRT/flat-panel screens,
   keyboards, phones and laptops, plus reviewed component data. Preserve attribution.
2. Visual review of labels; perceptual/source-session grouping before splitting.
3. Add recognition-only whole-device classes and keep existing sale categories
   unchanged; request collector confirmation rather than guessing PCB/plastic.
4. Training environment: bundled Python has Pillow but not torch, ultralytics,
   onnxruntime or PyYAML. GPU availability has not been verified. A suitable local
   environment or user-operated GPU notebook is needed; no paid job was started.
5. Train a new checkpoint on corrected data (not blindly continue contaminated
   class weights), tune on validation only, evaluate untouched test and field photos.
6. Report per-class precision/recall, abstention/coverage, false suggestions on
   non-e-waste and mixed scenes, and Android latency. Compare exported ONNX output
   with the training checkpoint before replacement. Retain rollback weights.

No public model's published metric is a metric for this app. No claim of 100%
accuracy, fresh training, Android validation or successful deployment is made.
