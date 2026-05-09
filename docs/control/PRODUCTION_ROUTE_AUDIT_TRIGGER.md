# Production Route Audit Trigger

Purpose: trigger the live production route audit against the canonical production domain, `https://harbourview.vercel.app`.

Canonical production target: `https://harbourview.vercel.app`.

Legacy/unknown alias: `https://harbourview-platform.vercel.app` must not be used in production audit prompts, scripts, deployment checks or GO/HOLD decisions unless the task is explicitly investigating that alias.

Required production checks:
- `/`
- `/marketplace`
- `/marketplace/sell`
- `/marketplace/wanted`
- `/signals`
- `/intelligence`
- `/contact`
- `/intake`
- `/admin`
- `/marketplace/listings`

GO requires valid public routes, anonymous `/admin` denial, no standalone `/marketplace/listings` page and zero forbidden leakage strings.
