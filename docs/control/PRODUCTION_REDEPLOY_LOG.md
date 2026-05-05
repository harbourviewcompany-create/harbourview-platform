# Production Redeploy Log

## 2026-05-05 contact/intake contact-runtime verification

Purpose: force a fresh Vercel production deployment after centralized contact configuration changes.

Verification target routes:
- /contact
- /intake

Required runtime values:
- harbourviewcompany@gmail.com must render
- harborviewcompany@gmail.com must not render
- hello@harbourview.co must not render

Notes:
- This file exists as a safe, non-runtime deployment trigger and audit record.
- No application logic, route structure, API routes, Supabase schema, RLS policies or validation logic changed in this commit.

## 2026-05-05 full public route redeploy verification trigger

Purpose: force a fresh Vercel production deployment after build-rate capacity returned, while preserving the application state introduced by commit `6724746936d37d2cf0d5b75a10f1cf1f3c7ad0d2`.

Verification target routes:
- /
- /marketplace
- /contact
- /intake
- /signals
- /intelligence
- /admin

Required runtime values:
- `Network v` must not render
- `Explore Network` must not render
- `Enter Network` must not render
- `Request Intake` must not render
- `Marketplace | Harbourview | Harbourview` must not render
- `harborviewcompany@gmail.com` must not render
- `harbourviewcompany@gmail.com` must not render
- branded contact email must render where contact information is shown
- /admin must deny anonymous access

Notes:
- Documentation-only deployment trigger.
- No application logic, route structure, API routes, Supabase schema, RLS policies or validation logic changed in this commit.
