# Production Route Audit Trigger

Purpose: trigger the PR-based live production route audit against `https://harbourview-platform.vercel.app` after production middleware hardening.

Commit under audit: `0d93209e3b738bdd0b1f6af2fc5a37cb10596506`.

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

GO requires no legacy homepage, no legacy submit/wanted/commercial-intelligence dependencies, no standalone `/marketplace/listings` page, anonymous `/admin` denial and zero forbidden leakage strings.
