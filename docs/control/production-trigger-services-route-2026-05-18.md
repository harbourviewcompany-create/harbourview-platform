# Production Trigger Note — Services Route Visibility

Date: 2026-05-18

Purpose: create a minimal control/evidence-only `main` commit to trigger a fresh Vercel Git production deployment after repeated Vercel redeploy actions kept rebuilding the old production deployment lineage.

Scope:

- Documentation/control note only.
- No runtime code change.
- No environment variable change.
- No domain or alias change.
- No Vercel configuration change.
- No Supabase, RLS, auth, package, lockfile, marketplace DTO allowlist, production data, private evidence, or source URL change.

Verification target after deployment:

- `https://harbourview-nu.vercel.app/marketplace/services`
- HTTP 200
- PR #328 Services route strings visible:
  - `Reviewed introductions only`
  - `Readiness and support`
  - `Request Service Introduction`
  - `Confidential Routing Request`
- Forbidden public leakage strings absent.
