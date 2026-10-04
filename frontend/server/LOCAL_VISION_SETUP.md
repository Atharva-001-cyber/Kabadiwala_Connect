# Optional local-only Gemini second opinion

Offline detectors and manual selection remain unchanged. This is NOT a newly
trained model, production endpoint, verified accuracy improvement or deployment.

Create/edit the ignored `frontend/.env.local` on your computer (do not send keys
in chat). Add these server-only variables; never prefix them with VITE_:

```dotenv
LOCAL_VISION_ENABLED=true
LOCAL_VISION_API_KEY=your_key_here
LOCAL_VISION_MODEL=your_supported_image_understanding_model_id
```

Choose an image-understanding model enabled for your Google AI project. Model
availability, quota, billing and data-use terms must be checked in that account.
Restart the local Vite server after configuring. Open localhost or 127.0.0.1,
upload a photo, then explicitly consent in the separate second-opinion panel.
Checking consent alone sends nothing; pressing its button sends the selected
compressed image and language to Google's Gemini generateContent endpoint.
No existing browser/localStorage Gemini keys are reused.

The panel is dev-only and hidden when not configured. Backend accepts only
loopback requests with matching Host/Origin; LAN Android access is intentionally
not enabled. No photos/keys/provider errors are logged or saved by this endpoint.
Provider retention/data terms still apply. Requests have size limits, one-at-a-time
execution, a ten-second cooldown and a 25-second provider timeout. Manual category
confirmation stays necessary: no cloud response updates price, category or lots.

Automated tests use a mock transport only. Real provider accuracy, model ID/key
availability and end-to-end cloud calls remain unverified until configuration.
Do not deploy this dev endpoint as a public API. Production requires separate
authentication, abuse controls, privacy review and explicit deployment approval.

Protocol reference: https://ai.google.dev/api/generate-content
