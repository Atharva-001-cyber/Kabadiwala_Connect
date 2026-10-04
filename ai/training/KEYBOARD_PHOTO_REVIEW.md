# Supplied keyboard photos: local diagnostic review

Date: 2026-10-03. Existing device-candidate-v1 ONNX; weights unchanged.
Nine user-supplied clipboard PNGs were evaluated with real inference in isolated
headless desktop Chrome on localhost:5173. External requests were blocked; no
lot was saved and no database write was performed. The reusable runner is
`frontend/scripts/review-device-photos.mjs` (Playwright module path, then photos).

## Results (attachment order)

Scores are model scores, NOT measured accuracy or calibrated probabilities.

| Photo | Clipboard filename ID | Result | Review |
|---|---|---|---|
| 1 | c5cdf118-6b04-48e5-89ff-3ebdd60ce2c6 | Keyboard .869, .549; SUGGESTION | Many visible keyboards not separately detected |
| 2 | 5e56611a-618f-4538-a242-bc7b43fe1d06 | Keyboard .721, .496, .457; SUGGESTION | One large box covers a group, not a single keyboard |
| 3 | 6b44b58c-280d-40dc-ac4f-386f751e74f0 | No candidates; UNCERTAIN | Missed keyboards; Alamy watermark |
| 4 | 2ac28ed4-2ccb-4ea1-9c6a-9fc03593e903 | No candidates; UNCERTAIN | Missed keyboards and visible mouse; 275x183 input |
| 5 | 236027b2-79f0-4e3d-9e3e-6cb65bd80ca3 | No candidates; UNCERTAIN | Missed keyboards in clutter/rotated view |
| 6 | e33507f1-009b-41bb-94e7-8a64f5d5a875 | Laptop .408; UNCERTAIN | Wrong weak class; Alamy watermark |
| 7 | d3836f88-be80-4894-9d45-25d47a5eb0bb | Keyboard .303, PCB .264, Laptop .259; UNCERTAIN | Weak/confused; overlapping boxes |
| 8 | 68b4bad9-3934-481d-a0fd-d9637006b83e | Keyboard .928, Mouse .298; SUGGESTION | Keyboard found; false Mouse box over recycling graphic |
| 9 | a607e470-dbf7-4c57-b069-cf069b66079d | Keyboard .905; SUGGESTION | Hand-held keyboard found |

Four images produced strong keyboard suggestions; one additional image contained
a weak keyboard candidate. This is NOT 4/9 object-detection accuracy: complete
ground-truth boxes are unavailable, photos are selected keyboard examples, and
prior training overlap/source provenance is unknown. Object recall and precision
cannot be established from this review. Safe abstention does not erase misses.

The integrated material category stayed null on all nine. No forced Keyboard-to-
Plastic/PCB mapping was introduced. Combined device and material inference took
1.42–2.29 seconds per image on this desktop run; not an Android latency guarantee.
This runner evaluates source images, not the camera/gallery compression UI.

## Dataset gate and next action

These photos have NOT been merged into training or used to change weights or
thresholds. Source/use permission remains unverified; especially photos 3/6 need
licence review. Do not remove watermarks to bypass this check.

For a new training round, obtain usable source permissions or original replacement
photos, annotate each identifiable supported object (including mice), review
occlusion/group-box policy, check duplicates against existing data, and split by
physical device/source/session. Include rotated, piled, rear-facing, low-resolution
and hand-held keyboards plus graphic/non-device negatives. Keep a separately
collected unseen evaluation set; do not advertise these reviewed examples as an
untouched final benchmark. New GPU training remains pending this data preparation.

No application workflow changes, new training, live deployment, commit or push
were performed for this diagnostic batch.
