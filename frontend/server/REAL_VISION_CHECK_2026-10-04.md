# Real Gemini check — 2026-10-04

Local-only; no deployment, database writes or model-weight replacement.

## Confirmed diagnosis

The configured gemini-2.5-flash listed generateContent in model metadata but the
actual generation request returned 404: unavailable to new users. Provider error
recommended gemini-3.8-flash. The ignored local configuration was updated to that
model. No API key values are included here or in browser responses.

The new model produced real responses, but also returned 503 high demand. Added
distinct error codes for unavailable model, quota, access, busy service and
incomplete output. One retry is allowed only for 503; both attempts share the
same 25-second deadline. No retries on quotas or ambiguous network failures.

## Evidence, not an eight-category accuracy benchmark

- Motor source example motor_rf_train_001_6aced16e.jpg: actual middleware 200;
  identified electric motor, component, MOTOR. No automatic selection/save.
- cable_rf_train_001_53df284a.jpg: actual middleware 200; power adapter, whole
  device, material null. This image includes an adapter and attached cable;
  it does NOT prove isolated wire/copper-category performance.
- PCB 02412d7...: simple direct image probe correctly described a PCB. Structured
  app-path attempts encountered provider busy/timeout; do not count as app pass.
- Initial flat-panel, battery and CRT structured requests returned upstream errors.
- Retry run also encountered deadline expiry on flat-panel and PCB examples.
- No verified magnet/plastic-body examples tested. No eight-category pass claimed.

Automated mocked-provider security tests and TypeScript/build passed. Mock tests
are not cloud-accuracy evidence. Physical Android validation remains pending.
This endpoint is Vite dev-only; pushing the frontend does not deploy this backend.
Production requires separately approved authenticated server deployment and tests.

Do not label current cloud feature submission-ready or outage-free. Manual/offline
flow stays available; existing trained models remain unchanged.
