# Next data round — phone/tablet failure, 2026-10-03

## Confirmed failure, not a success

User confirmed the reflective-screen image is a **tablet**. Candidate v1 predicted
Smartphone with raw score 0.6873. The image SHA-256 is
`d5bcfe4281886d20214efb331bce172ba4167233843a15b1f2b8b36151188907`.
The policy now requests phone/tablet clarification for ALL Smartphone/Tablet
predictions, including high scores; it does not alter raw model outputs.
This improves failure handling, NOT the trained model's classification accuracy.

The image stays excluded from training. It is a known regression example because
we used its failure to design the policy, NOT an untouched final benchmark.

## Data gap

Prepared training images: Smartphone 359 vs Tablet 7, HDD 4. Tablet has only
2 validation and 1 test image. No further accuracy claim or blind repeat of the
same training run is justified. Do not rebalance by moving known test images into
training or by calling augmented copies independent samples.

## Manual input requested

Start with 20–30 original tablet photos and 20–30 phone photos from several
different physical devices. Include front/back, cases, reflections, screen off/on,
handheld and normal shop/table backgrounds. Avoid private messages, faces and IDs.
This first batch is for diagnosis and label review, not a sufficient full training
dataset. More diverse licensed data will likely be required after audit.

Provide a local ZIP/folder, and for each photo:

- filename;
- confirmed type (Tablet or Smartphone);
- physical device ID (e.g. tablet_01) so angles of one item stay in one split;
- source/permission (your own photo or dataset link and licence);
- other visible devices/objects, if present.

Do not dismantle batteries or electronics to obtain training photos. Separate
training/development photos from a fresh, unseen final field test collected from
different devices and sessions. Annotation requires a box around every supported
visible object; do not fabricate boxes or infer hidden components.

## Before another Colab run

Audit new labels, source grouping and overlap, add licence provenance, preserve
independent device/session splits, and compare against candidate v1 on the SAME
validation set. Evaluate once on fresh held-out tests after choices are frozen.
Report precision/recall, false suggestions, abstention coverage and mobile speed.
Keep current candidate weights and a rollback path. Training requires the user's
Colab GPU step after the revised dataset is prepared. No new training was run here.
