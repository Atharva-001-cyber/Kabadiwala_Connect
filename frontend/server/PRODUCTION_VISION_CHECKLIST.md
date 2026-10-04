# AI Vision production adapter — prepared, NOT deployed

The Vercel function `api/vision.mjs` uses the same validated consent/image/provider
handler as localhost. Frontend chooses `/api/vision?action=status|analyze` in a
production build. No auth, pricing, lot or database logic was changed.

## Manual setup after explicit preview/deployment approval

In the Vercel project whose root directory is `frontend`, configure server-only
variables (never VITE_):

- VISION_ENABLED=true (omit/false keeps online panel disabled).
- VISION_API_KEY: Gemini API key, stored as a secret.
- VISION_MODEL: a generation-tested image-understanding model ID.
- VISION_ALLOWED_ORIGIN: exact HTTPS preview origin; later exact production origin
  `https://kabadiwala-connect2.vercel.app`, without trailing slash.
- VISION_ACCESS_TOKEN: separate randomly generated secret, at least 32 characters.
  Give this prototype code privately to authorized testers; NOT the Gemini key.

Scope preview and production variables separately. The code is entered only in
the optional AI panel, kept in component memory, not stored in localStorage or
bundled. Existing demo login is unchanged. Never publish this access code in a
public video, repository or screenshot. Rotate if exposed.

This shared prototype code is NOT per-user identity, organization isolation or a
public-service authorization system. The in-memory cooldown is per instance only;
configure provider budget/quota and deployment-level abuse limits before public
enablement. Origin checking alone is not authentication. Do not claim globally
enforced rate limits. No Vercel settings or external service settings changed here.

## Required preview tests before production

Verify Vercel root/runtime and function packaging, API route returning JSON rather
than SPA HTML, disabled config, wrong/missing code, denied consent, one real image,
service-busy/timeout fallback, mobile camera/gallery, and existing lot flow. No
need to save real transactions to test AI advice. Deploying preview also needs
user approval. Existing submitted production domain must remain untouched.

Local mock tests do not establish Vercel runtime correctness or eight-category
accuracy. Real Gemini tests previously encountered 503 overload/deadlines; those
remain external limitations. Magnet/plastic-body coverage is unverified. No new
custom model training or replacement is included in this adapter change.

Rollback: disable VISION_ENABLED to hide optional cloud advice on next status
check; retain offline/manual flows. Vercel environment changes may require a new
deployment. Keep the last stable deployment available for rollback.
