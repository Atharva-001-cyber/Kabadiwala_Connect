# Material source spot review — 2026-10-03

This is a TWO-image visual spot check, not approval of the 759-image dataset.
No original labels or deployed weights were modified.

## Motor example: annotation mismatch

`train/images/motor_rf_train_001_6aced16e.jpg`

SHA256: `6aced16ed6a8141acb5502e8328eeaa9db75edbbfdfa1d7d5520e6b1c31a8a40`

The image visibly contains a motor. The class-5 box is centered at (.177,.649),
size (.242,.495), covering its left cover rather than the whole motor assembly.
The local source `roboflow_motor/data.yaml` declares Electric-motor-housing and
rusty electric-motor-housing. Housing annotations cannot automatically establish
complete-motor detection labels. Review ALL motor_rf samples before candidate use.
Do not merely change class names and call this fixed.

## Cable example: adapter included in box

`train/images/cable_rf_train_001_53df284a.jpg`

The image shows an AC adapter with attached cable. Its class-4 box centered at
(.483,.496), size (.963,.690), spans the adapter plus cable rather than isolating
the visible cable. This demonstrates inconsistent component boundaries. Review
cable boxes before retraining; this spot check does not establish the cause of
the user's unseen failed cable photo.

## Licence evidence and limits

Local motor source metadata declares CC BY 4.0, project
`project-3swgf/electric-motor-housing1`, version 1. Local cables-nl42k README also
declares CC BY 4.0. These are source declarations, not proof of every upstream
image's rights. The sampled cable_rf filename came through another ingestion
route; do NOT assign cables-nl42k provenance to it without matching source records.

## Internet-photo handoff

User can supply original downloaded images plus original source page URLs and
the intended object label. Keep downloaded examples separate from real collector
field photos. For training, review use permission/licence and actual boxes first.
Watermarks must not be removed to evade rights checks. Web images may overlap
existing training data, so they are not automatically an unseen benchmark.

Prefer varied objects/backgrounds over many copies or crops of one stock photo.
Mixed scenes need labels for each relevant visible target. Do not dismantle
hazardous equipment for data collection. Final Android/camera evaluation still
needs actual device use, not just internet-image uploads.
