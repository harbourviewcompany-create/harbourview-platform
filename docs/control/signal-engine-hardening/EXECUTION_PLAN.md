# Signal Engine Supabase Hardening Workspace

Date: 2026-06-03  
Project ref: `zvxdgdkukjrrwamdpqrg`  
Canonical spec: `docs/harbourview-signal-engine-v1.md` (`Harbourview Signal Engine V1`)

## Objective

Fix the current launch-blocking Signal Engine security posture without touching unrelated marketplace code:

- Move Signal Engine RLS helper logic out of the exposed `public` API schema.
- Pin helper function `search_path` so Supabase security-advisor function-exposure/search-path findings are not reintroduced.
- Keep all 14 canonical Signal Engine tables admin/operator-only for authenticated users.
- Keep the V1 service-role write surface limited to processing tables named in the canonical spec.
- Provide reproducible live Supabase advisor/log collection and post-migration verification steps.

## Scope

In scope:

- Signal Engine tables from the canonical V1 spec:
  - `source_documents`
  - `source_chunks`
  - `signal_duplicate_groups`
  - `signal_candidates`
  - `signal_evidence`
  - `signal_review_events`
  - `signal_jobs`
  - `signal_risk_flags`
  - `model_prompt_versions`
  - `model_call_logs`
  - `entities`
  - `signal_entity_mentions`
  - `signal_conversions`
  - `signal_processing_errors`
- RLS helper functions originally created as `public.is_signal_admin()` and `public.is_service_role()`.
- Verification scripts under `scripts/signal-engine/`.

Out of scope:

- Marketplace tables, marketplace RPCs, marketplace routes, and marketplace smoke helpers.
- Public application UI changes.
- Non-Signal Engine Supabase advisor warnings unless a live advisor record explicitly names one of the Signal Engine objects above.

## Advisor and Log Evidence Collection

Use the live Supabase Management API before and after applying the migration. The script intentionally writes sanitized JSON and redacts tokens, API keys, JWT-like strings, and project REST paths.

Required token permissions:

- `advisors_read`
- `analytics_logs_read`

Commands:

```bash
SUPABASE_ACCESS_TOKEN=... node scripts/signal-engine/fetch-live-supabase-signal-security.mjs \
  --start 2026-06-02T00:00:00Z \
  --end 2026-06-03T00:00:00Z \
  --out docs/control/signal-engine-hardening/pre-hardening-live.json

SUPABASE_ACCESS_TOKEN=... node scripts/signal-engine/fetch-live-supabase-signal-security.mjs \
  --start 2026-06-03T00:00:00Z \
  --end 2026-06-04T00:00:00Z \
  --out docs/control/signal-engine-hardening/post-hardening-live.json
```

If a token is unavailable, record the limitation in the PR validation notes and run the static workspace verifier instead. Do not paste raw logs, access tokens, API keys, JWTs, request bodies, or user-identifying values into the PR.

## Security Migration

Migration: `supabase/migrations/20260603000000_harden_signal_engine_security.sql`

The migration does the following:

1. Creates a non-exposed `private` schema for database-only helpers.
2. Creates `private.is_signal_admin()` as a `SECURITY DEFINER` SQL helper with `set search_path = ''` and fully qualified references to `public.user_roles` and `auth.uid()`.
3. Grants `authenticated` execute access to the private helper so Signal Engine RLS policies can evaluate admin/operator membership, while keeping the function outside exposed PostgREST schemas.
4. Revokes public-schema helper execution from `public`, `anon`, and `authenticated`.
5. Forces RLS on all 14 Signal Engine tables.
6. Replaces the `admin_all` policies so they call `private.is_signal_admin()`.
7. Recreates the service-role insert/update policies only on the processing tables listed in the canonical V1 spec.
8. Drops the legacy exposed `public.is_signal_admin()` and `public.is_service_role()` functions after dependent policies are replaced.

## Execution Steps

1. Capture pre-change advisors and logs:

   ```bash
   SUPABASE_ACCESS_TOKEN=... node scripts/signal-engine/fetch-live-supabase-signal-security.mjs \
     --start 2026-06-02T00:00:00Z \
     --end 2026-06-03T00:00:00Z \
     --out docs/control/signal-engine-hardening/pre-hardening-live.json
   ```

2. Verify local workspace shape:

   ```bash
   node scripts/signal-engine/verify-signal-engine-hardening.mjs
   ```

3. Apply only the Signal Engine hardening migration to project `zvxdgdkukjrrwamdpqrg` using the team-approved Supabase migration workflow:

   ```bash
   supabase link --project-ref zvxdgdkukjrrwamdpqrg
   supabase db push
   ```

4. Re-run Supabase Security Advisor from the dashboard or Management API.

5. Capture post-change advisors and logs:

   ```bash
   SUPABASE_ACCESS_TOKEN=... node scripts/signal-engine/fetch-live-supabase-signal-security.mjs \
     --start 2026-06-03T00:00:00Z \
     --end 2026-06-04T00:00:00Z \
     --out docs/control/signal-engine-hardening/post-hardening-live.json
   ```

6. Confirm the post-change advisor output has no Signal Engine findings for:

   - RLS disabled on public Signal Engine tables.
   - Policies existing while RLS is disabled.
   - Mutable search path on Signal Engine RLS helper functions.
   - Anonymous/authenticated executable `SECURITY DEFINER` helpers in exposed schemas.
   - Signal Engine helper functions exposed as public RPC endpoints.

7. Confirm admin UI/server paths that use `signal_candidates` still read/update through the server admin data client and that no public route exposes Signal Engine rows.

## Rollback Plan

If the migration blocks admin/operator access or causes unexpected Supabase advisor regressions:

1. Pause further Signal Engine writes.
2. Restore the previous public helper and policies with a targeted rollback migration that:
   - Recreates `public.is_signal_admin()` using the last known `public.user_roles` lookup.
   - Repoints `admin_all` policies back to `public.is_signal_admin()`.
   - Recreates `public.is_service_role()` only if a dependent policy or runtime path requires it.
3. Keep marketplace code untouched during rollback.
4. Re-run the live advisor/log capture script and attach sanitized before/after evidence.

## Acceptance Criteria

- Static verifier passes.
- Migration only touches Signal Engine security objects.
- Live advisor capture for `zvxdgdkukjrrwamdpqrg` shows no remaining launch-blocking Signal Engine RLS/function-exposure findings, or any remaining findings are documented with a precise object name and rationale.
- No secrets or private data are committed.
