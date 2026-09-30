# Local vision verification

The original failure was a missing `ort-wasm-simd-threaded.jsep.mjs` runtime loader.
The inference engine now imports the matching CPU-only loader and WASM binary from
the installed ONNX Runtime package via Vite asset URLs. No cloud vision dependency
or model weights were added or replaced.

Verified in headless desktop Chrome with external traffic blocked:

- Model input: float32 [1,3,416,416]; output: [1,12,3549].
- Blank image: NO_DETECTION, not an invented category.
- 24 existing labelled test-split images, first three single-class files per class:
  zero runtime failures; six confident, label-matching classifications and eighteen
  abstentions before the additional multi-material guard. This is a small deterministic
  smoke sample, NOT mAP, independent field accuracy, or a guaranteed success rate.
- Built app gallery-upload UI: battery image produced a real model score of about 87%.
  A model score is not a guarantee of correctness.

Remaining limitations: CRT, magnets and other weak examples need improved labelled
training data and independent held-out evaluation. The training class Mixed_EWaste
does not prove plastic casing, so it requires manual selection. Low-score candidates
are labelled tentative; the 0.50 confident threshold was not lowered. Physical
Android camera capture and new user field photos have not been evaluated here.

Run from frontend with a compatible Node runtime and Playwright:

    node scripts/verify-vision-browser.mjs <path-to-playwright/index.mjs> --dataset

Use VISION_ORIGIN=http://127.0.0.1:5174 and --production for the built upload UI.
Tests do not create lots or write to the live database.
