# Candidate integration — 2026-10-03

## Local preview only, not production approval

Imported `device-candidate.onnx` from the user-returned results ZIP to a separate
`frontend/public/models/device-candidate-v1.onnx` file. SHA-256 verified against
the report: `7e9521f5f6b28ff66e0c291ff904f38abc6494d40af819959c4380b19495bdb1`.
The old `best.onnx` was not overwritten. No new training or deployment occurred.

The candidate has 11 recognition classes, NOT the legacy 8 material classes.
The browser validates its [1,15,N] output layout, applies per-class NMS, and
returns device names without mapping them to material categories or prices.
Thresholds (0.25 candidates, 0.65 stronger suggestion) are provisional safety
settings, not calibrated accuracy guarantees. CRT, Smartphone, Tablet, HDD and BarPhone always
remain uncertain; competing device types also require manual clarification.

Whole-device candidates at >=0.45 suppress automatic component suggestions so a
keyboard does not become plastic, a phone does not become PCB, or a drive a magnet.
Matching component predictions keep their existing workflow. Missing candidate
model/network failures return UNAVAILABLE without breaking material capture.
Download timeout: 15 seconds. First-time model acquisition requires connectivity;
the existing production service worker can cache the versioned local model after use.
Development-server offline behavior is not advertised as verified.

## Actual local checks

- Isolated Chrome, no external requests and no database writes.
- Original reflective-screen photo: user-confirmed Tablet, but the raw model
  predicts Smartphone, score 0.6873. This is a known model error, not a success.
  Phone/tablet predictions now always request clarification with a grouped label;
  the UI hides their score rather than implying a calibrated grouped probability.
  This changes safe presentation, not model weights or accuracy.
- The known tablet photo is reserved as a regression case and excluded by the
  dataset preparer. It is not an untouched benchmark after policy tuning.
- Original keyboard close-up: Keyboard suggestion, score 0.8486.
- Both integrated outputs have material category `null`: collector confirmation.
- Real gallery upload (including app compression) displays keyboard suggestion.
- Real tablet upload displays phone/tablet clarification, not a Smartphone claim.
- Blank canvas returns uncertain, not a device suggestion. This is only a smoke
  negative, not a representative non-e-waste benchmark.
- Blocking model download preserves capture/manual behavior.
- Policy tests cover weak classes, multiple categories, nonfinite scores,
  component disagreement and unavailable-device fallback.

## Still pending

Independent real-photo benchmark (including reflections, hands, clutter, mixed
objects and non-e-waste), source/label review, ONNX/PyTorch numerical parity,
threshold calibration, physical Android camera/latency/memory checks. Returned
test report has mAP50 0.6131 and recall 0.5635; field accuracy is not established.
Tablet/HDD/CRT need improved data before claiming reliable coverage. No 100%
accuracy or no-failure guarantee is made. Keep the UI marked experimental.
