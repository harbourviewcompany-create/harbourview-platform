# Production Redeploy Log

## 2026-05-05 contact/intake contact-runtime verification

Purpose: force a fresh Vercel production deployment after centralized contact configuration changes.

Verification target routes:
- /contact
- /intake

Required runtime values:
- legacy direct email rendering must be checked
- branded contact rendering must be checked

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
- stale network labels must not render
- old duplicated marketplace title must not render
- legacy direct email variants must not render
- branded contact email must render where contact information is shown
- /admin must deny anonymous access

Notes:
- Documentation-only deployment trigger.
- No application logic, route structure, API routes, Supabase schema, RLS policies or validation logic changed in this commit.

## 2026-05-06 production alias/source mismatch redeploy trigger

Purpose: force a fresh Vercel production deployment after live external fetches showed production still rendering stale public pages despite main source now using centralized branded contact configuration.

Observed mismatch:
- Vercel production alias metadata resolved the public domain to a READY production deployment from main.
- Live external HTML still rendered old marketplace, homepage and contact copy.
- Current main source uses centralized branded contact configuration in `lib/contact.ts`.

Verification target routes:
- /
- /marketplace
- /contact
- /intake
- /signals
- /intelligence
- /admin

Required runtime values:
- stale network labels must not render
- old duplicated marketplace title must not render
- legacy direct email variants must not render
- branded contact email must render where contact information is shown
- /admin must deny anonymous access

Notes:
- Documentation-only deployment trigger.
- No application logic, route structure, API routes, Supabase schema, RLS policies or validation logic changed in this commit.
