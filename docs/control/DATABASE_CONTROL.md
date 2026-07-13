# Harbourview Database Control

## Purpose

This file controls Harbourview database, Supabase, RLS, service-role and data-model work. It prevents unsafe migrations, schema assumptions and public leakage of private marketplace or intelligence data.

## Required database ticket fields

Every database-affecting ticket must state:

- Environment: local, preview, staging or production
- Tables and columns affected
- RLS policies affected
- Functions, triggers or views affected
- Service-role paths affected
- Public API routes affected
- Migration file name
- Backward compatibility impact
- Rollback or forward-fix path
- Required tests
- Human approval status

## Current verified database-adjacent evidence

`docs/control/PROJECT_STATE.md` records production marketplace smoke evidence for:

- `quote_routing`
- `listing_submission`
- `wanted_request_submission`
- smoke cleanup to `closed`

This proves the recorded smoke path at the recorded commit. It does not prove unrelated database state.

## Data classification

| Data class | Examples | Public visibility |
|---|---|---|
| Public listing display fields | Approved title, category, general description | Only after review |
| Submission contact data | Name, email, phone, company, private notes | Never public by default |
| Buyer inquiry data | Quote request, requirements, buyer identity | Never public by default |
| Wanted request submitter data | Contact and negotiation details | Never public by default |
| Source/provenance data | Source URLs, evidence, review workflow | Admin/operator only |
| Admin workflow data | Status history, internal notes, decisions | Admin/operator only |
| Secrets | Supabase keys, tokens | Never logged or exposed |

## Public visibility rule

Public users must not see:

- Source URLs
- `View source listing`
- Evidence captured
- Provenance logs
- Internal review workflow
- Internal notes
- Raw submitter contact data
- Buyer identity fields
- Service-role diagnostics

## Migration rules

Every migration must:

- Be additive where possible
- State RLS impact
- Avoid destructive operations unless approved
- Preserve existing data unless approved
- Include rollback or forward-fix notes
- Avoid real confidential seed data
- Be testable locally or in a controlled environment

Forbidden without explicit approval:

- Dropping tables or columns
- Disabling RLS
- Broadening public select policies
- Granting write access to anon users beyond approved intake paths
- Exposing service-role behavior through public routes
- Backfilling production data without dry-run evidence

## RLS posture

- Public read is deny-by-default unless intentionally public
- Public insert may exist for controlled intake forms only
- Admin/operator access must be role-gated
- Service role access must remain server-only
- Provenance and evidence fields are private by default

## Service role rules

Service-role code must be server-side only, never log raw keys, validate inputs, avoid browser bundle exposure and return minimal diagnostics.

## Required verification

Database changes require static route/action review, migration review, RLS review, typecheck, build, targeted data-path tests and public leakage tests where public routes are affected.

## Completion criteria

Database work is complete only when environment, SQL/migrations, RLS impact, public/private exposure, tests and production approval status are all recorded.

## 2026-07-09 — PR #1000 marketplace ratings migration (review fixes)

- **Environment:** local workspace review only; migration not applied to any Supabase project (local, preview, or production) from this session.
- **Migration:** `supabase/migrations/20260709000000_add_ratings_to_listings.sql`.
- **Tables affected:** `public.listings` — adds `average_rating numeric(3,2)`, `review_count integer`, `ratings_updated_at timestamptz`, both with CHECK constraints.
- **RLS impact:** none added or changed. Listings RLS is row-level, not column-enumerated, so the new columns inherit existing policies. Not independently re-verified against live policies this session — flagged for a `get_advisors` pass before deploy.
- **Functions/triggers:** `update_ratings_timestamp()` trigger function, now scoped to `BEFORE UPDATE OF average_rating, review_count` with an `IS DISTINCT FROM` guard (original PR version fired on every listing update, corrupting `ratings_updated_at` as a "last rated" signal). Function now pins `SET search_path = public`, matching the precedent set in `20260501000002_set_marketplace_inquiries_updated_at_search_path.sql`. Trigger creation is now idempotent (`DROP TRIGGER IF EXISTS` before `CREATE TRIGGER`), consistent with the `IF NOT EXISTS` idiom used elsewhere in the file.
- **Public API routes affected:** none directly. Note: `hv_public.marketplace_listings_public` (the public marketplace DTO view) reads from `hv_marketplace.listings`, a separate table from `public.listings`. These new rating columns have no path to that public view as written — if PR #1000's stated goal of surfacing ratings on public listing cards is real, a follow-up decision is needed on how `public.listings` ratings reach the public surface (new view, sync job, or DTO addition). Not resolved in this session — left as an open item for the PR author/Tyler.
- **Backward compatibility:** additive only; no existing column, table, or constraint is altered or dropped.
- **Rollback/forward-fix path:** `ALTER TABLE listings DROP COLUMN IF EXISTS average_rating, review_count, ratings_updated_at; DROP TRIGGER IF EXISTS trigger_ratings_updated ON listings; DROP FUNCTION IF EXISTS update_ratings_timestamp(); DROP INDEX IF EXISTS idx_listings_avg_rating, idx_listings_review_count;` — safe pre-deploy; if already deployed, confirm no dependent reads before dropping.
- **Required tests:** not run this session (no local Supabase/Docker available in this environment). `mcp__Supabase__get_advisors` should be run against the target project after migration apply, before this is considered production-ready.
- **Human approval status:** ~~pending~~ **applied to production** 2026-07-09 at Tyler's explicit instruction — see update below.

## 2026-07-09 (update) — PR #1000 ratings migration applied to Supabase; live view drift found

- **Environment:** production — project `zvxdgdkukjrrwamdpqrg`, applied directly via `mcp__Supabase__apply_migration` (no staging/preview branch exists for this project; `list_branches` showed only `main` itself plus two unrelated, inactive preview branches for other PRs).
- **Migrations applied (in order):**
  1. `add_ratings_to_listings` — the corrected `20260709000000_add_ratings_to_listings.sql` from the entry above (scoped trigger, `search_path` pin, idempotent trigger creation). Applied successfully.
  2. `expose_ratings_on_public_listings_view` — new `supabase/migrations/20260709010000_expose_ratings_on_public_listings_view.sql`, adding `average_rating`/`review_count` to `public.marketplace_public_listings_v1` (the view `lib/server/listingsQuery.ts` actually queries over REST — distinct from the unrelated `hv_public.marketplace_listings_public`/`hv_marketplace.listings` pair).
- **Schema drift found:** the first attempt at migration 2 (copied from `20260601000000_marketplace_supply_engine.sql`'s view definition) failed — `ERROR 42703: column "public_summary" does not exist`. Queried live `information_schema.columns` and `pg_get_viewdef` directly: production `public.listings` has no `subcategory`, `location_region`, `summary`/`public_summary`, or `expires_at` columns, and `status` only ever filters on `'approved'` (not `'approved','published'`) — all of which the migration-file history assumes. The live view had already diverged from its own source migration file at some prior point not captured in `supabase/migrations/`. Rebuilt migration 2 from the actual live `pg_get_viewdef` output, appending only the two new columns, and re-applied successfully. Updated the checked-in migration file to match what's actually live rather than the stale assumption.
- **Verification:** re-queried `information_schema.columns` on `marketplace_public_listings_v1` post-apply — confirms `average_rating`/`review_count` are now present alongside the original 19 columns, nothing dropped.
- **Flag for Tyler:** the migrations-directory-vs-live-schema drift on `public.listings`/`marketplace_public_listings_v1` is a pre-existing gap, not something this session introduced or fully audited — worth a dedicated schema-diff pass (`supabase db diff` against `main`, or equivalent) at some point, since it means other checked-in migrations may not accurately reflect what a fresh environment would need either.
- **Not run:** `mcp__Supabase__get_advisors` — should still be run as a follow-up to confirm the new trigger function's `search_path` pin satisfies the linter and nothing else regressed.

## 2026-07-10 — PR #1004 second-review fixes (bigint, CONCURRENTLY, NULL default) — and a process finding

- **Environment:** local workspace only this session. No `mcp__Supabase__apply_migration` / `execute_sql` calls were made against `zvxdgdkukjrrwamdpqrg` — see "Process finding" below for why a production apply needs a separate, explicitly-approved step.
- **Migration files changed:**
  1. `supabase/migrations/20260709000000_add_ratings_to_listings.sql` — `review_count` changed from `integer` to `bigint` (overflow risk under real load); `average_rating` no longer defaults to `0.0` (now `NULL`, the correct "no ratings yet" value — see file header for why this is low-risk: every consumer already types/handles these columns as nullable); the two `CREATE INDEX` statements were removed from this file (see #2).
  2. `supabase/migrations/20260710160000_add_ratings_indexes_concurrently.sql` (new) — recreates `idx_listings_avg_rating` and `idx_listings_review_count` using `CREATE INDEX CONCURRENTLY`, to avoid locking `listings` at migration time. Split into its own file because `CONCURRENTLY` cannot run inside a transaction block and this migration's other statements (`ALTER TABLE`, `CREATE FUNCTION`, `CREATE TRIGGER`) are transactional DDL — matches the existing precedent of `20260622130000_add_missing_fk_indexes_jun22.sql`.
- **Process finding — read before applying anything:** `mcp__github__pull_request_read` confirms PR #1004 (`claude/pr-1000-review-pmm1up` → `main`) is **already merged and closed** (merged 2026-07-10T11:29:28Z), not open as assumed at the start of this task. `origin/main` already contains the unfixed migration (`integer` `review_count`, non-concurrent indexes, `0.0` default), and per the 2026-07-09 entry above, **that unfixed shape is also already live in production** (`zvxdgdkukjrrwamdpqrg`, applied directly via `apply_migration` at Tyler's instruction on 2026-07-09). Two consequences:
  1. Editing `20260709000000_add_ratings_to_listings.sql` in place only changes what a *fresh* environment would get from `IF NOT EXISTS`/`ADD COLUMN IF NOT EXISTS` re-runs — it does **not** retroactively fix the already-applied production columns/indexes, since those guards no-op once the objects exist.
  2. Continuing to push commits to `claude/pr-1000-review-pmm1up` does not feed back into the merged/closed PR #1004 or reach `main` on its own — a fresh PR is required to land this fix and trigger review/CI. Flagged in the session report; opening that follow-up PR is a separate, human-visible action.
- **Production forward-fix still required (not run this session — needs explicit sign-off):**
  ```sql
  ALTER TABLE listings ALTER COLUMN review_count TYPE bigint;
  ALTER TABLE listings ALTER COLUMN average_rating DROP DEFAULT;
  DROP INDEX CONCURRENTLY IF EXISTS idx_listings_avg_rating;
  DROP INDEX CONCURRENTLY IF EXISTS idx_listings_review_count;
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_avg_rating ON listings(average_rating DESC) WHERE average_rating > 0;
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_review_count ON listings(review_count DESC);
  ```
  This changes live production schema and is consequential (Rule 1/3c) — do not run without Tyler's explicit go-ahead.
- **Rollback/forward-fix path (for the checked-in migration files, fresh environments only):** `ALTER TABLE listings DROP COLUMN IF EXISTS average_rating, review_count, ratings_updated_at; DROP TRIGGER IF EXISTS trigger_ratings_updated ON listings; DROP FUNCTION IF EXISTS update_ratings_timestamp(); DROP INDEX IF EXISTS idx_listings_avg_rating, idx_listings_review_count;` (same as the prior entry — additive change, safe to reverse pre-deploy).
- **Required tests:** `npm run lint` (0 errors, 127 pre-existing warnings, none newly introduced), `npx tsc --noEmit` (0 errors), `npm run test` (all suites green, incl. `test:listing-quality`'s `publicProjection`/`unified-listings-dto` suites), `npm run build` (clean, all routes compiled). Migration dry-run against a real Postgres instance was **not possible this session** — no Docker daemon available in this sandbox (`docker info` fails to reach `/var/run/docker.sock`) and no local Supabase stack — consistent with the same limitation recorded in the 2026-07-09 entry above. SQL was manually verified instead: `CREATE INDEX CONCURRENTLY` cannot run inside a transaction (confirmed against Postgres docs and the existing `20260622130000` precedent file), a `CHECK` constraint automatically passes when the expression evaluates to `NULL` (so removing `average_rating`'s default needed no `CHECK` change), and `bigint` covers the full `int4` range with headroom.
- **Human approval status:** pending — fix is committed to `claude/pr-1000-review-pmm1up` and pushed, but since that PR is closed/merged, a new PR against `main` is needed for this to actually enter review. The production forward-fix SQL above is a separate, additional approval needed before any live database change.

## 2026-07-11 — api.set_regulatory_tier / api.accept_classifier_tier missing authorization (fixed same day)

- **Environment:** production (`zvxdgdkukjrrwamdpqrg`), applied directly via `apply_migration`, Tyler approved before execution.
- **Migration:** `supabase/migrations/20260711170000_fix_regulatory_tier_rpc_missing_authz.sql`.
- **Tables/functions affected:** new function `public.is_regulatory_tier_admin()`; `api.set_regulatory_tier` and `api.accept_classifier_tier` modified in place (`CREATE OR REPLACE FUNCTION`) to call the new guard as their first statement. No table schema changes.
- **RLS impact:** none directly (these are RPC functions, not table policies), but the fix closes an equivalent authorization gap — `SECURITY DEFINER` functions bypass RLS by design, and these two had no substitute check at all. `public.is_regulatory_tier_admin()` reads `user_roles` (`role = 'admin'`), same table/pattern as the existing `is_genetics_admin_or_reviewer()`.
- **Public API routes affected:** `/rest/v1/rpc/set_regulatory_tier`, `/rest/v1/rpc/accept_classifier_tier`. Both remain callable by `authenticated` at the grant level (required — admins are also `authenticated`, Supabase has no finer-grained Postgres role), but now reject any caller whose `user_roles` row isn't `role = 'admin'`.
- **Backward compatibility:** additive/restrictive only — no existing admin caller loses access (verified `user_roles` currently has `role = 'admin'` populated); only previously-unauthorized `authenticated` callers are newly blocked, which is the intended fix.
- **Rollback/forward-fix path:** revert to the pre-fix function bodies (see `EVIDENCE_LOG.md`'s 2026-07-11 entry for the exact statement) only if the guard causes an unexpected admin-access regression — prefer fixing the guard over a full revert, since reverting restores the original vulnerability.
- **Required tests:** functional verification only (no application code changed) — confirmed `is_regulatory_tier_admin()` returns `false` with no session, confirmed via live query that `user_roles` has at least one `admin` row (existing access preserved), re-ran `get_advisors` (security) post-fix.
- **Human approval status:** done — production fix applied and verified same session, Tyler explicitly chose "proper fix" (admin-check guard) over the alternative stopgap (revoke `authenticated` grant entirely).

## 2026-06-07 — Cannabis Data Contract v1.0 P0/P1 Foundation

- **Environment:** local workspace only; no production Supabase push was attempted.
- **Migration:** `supabase/migrations/20260607120000_cannabis_data_contract_v1_p0_p1.sql`.
- **Seed:** `supabase/seeds/cannabis_data_contract_v1_taxonomy.sql` seeds taxonomy and coverage matrix only.
- **Tables affected:** new `cannabis_intelligence` schema with P0/P1 raw intelligence tables for jurisdictions, taxonomies, sources, evidence claims, data gaps, legal regimes, regulators, thresholds, laws, responsibilities, licence types/registers/entities/licences, medical pathways, import/export rules, contradictions, review tasks, and generic fact-evidence links.
- **RLS impact:** RLS is enabled on every new raw table; anon grants are revoked; no anon-readable raw-table policy is created. Public exposure must use DTO allowlists or future approved public snapshot tables.
- **Functions/triggers:** coverage-gap generation runs after inserted jurisdictions and records mandatory `data_gaps` for required category/activity pairs without inventing legal facts; updated-at triggers maintain audit timestamps.
- **Public API routes affected:** none.
- **Backward compatibility:** additive only; no existing table is dropped, renamed, truncated, or rewritten.
- **Rollback/forward-fix path:** rollback by reverting the migration before deployment. If already deployed, create a follow-up migration to revoke schema use and drop only the newly introduced `cannabis_intelligence` objects after confirming no production data was populated.
- **Required tests:** focused Vitest migration/DTO boundary tests, TypeScript compile, lint, build, Supabase migration reset when Docker/local Supabase is available.
- **Human approval status:** pending release/operator review because local Supabase runtime verification is blocked by unavailable Docker in this workspace.
