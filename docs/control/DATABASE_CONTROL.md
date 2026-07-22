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

## 2026-07-13 — Digest LLM fallback + pipeline_manual_review_queue

- Environment: production (`zvxdgdkukjrrwamdpqrg`)
- Tables/columns: new `public.pipeline_manual_review_queue` (id, pipeline, reference_date, reason, detail, created_at, notified_at, resolved_at, resolved_by; unique on pipeline+reference_date); `_digest_jobs` and `_editorial_digest_jobs` gained a `provider` column
- RLS: `pipeline_manual_review_queue` has RLS enabled, no policies (service-role only, matching `service_role`'s RLS-bypass default; no anon/authenticated grants — internal ops data, not a public surface)
- Functions replaced (all additive/backward-compatible, no signature changes): `run_daily_digest()`, `run_editorial_digest()`, `run_signal_extraction(integer)`
- Public API routes affected: none directly; `app/api/dashboard/digest/route.ts` continues reading `daily_digest` unchanged — it now just gets fresher data
- New route: `app/api/cron/pipeline-manual-review-notify` (service-role, `db.schema='api'`, reads/updates via new `api.pipeline_manual_review_queue` security-invoker view)
- Migration files: `20260713213101_digest_llm_fallback_and_manual_review_queue.sql`, `20260713213743_expose_pipeline_manual_review_queue_via_api.sql`
- Backward compatibility: additive only — existing `daily_digest`/`_digest_jobs`/`_editorial_digest_jobs` rows and callers untouched; `run_signal_extraction`'s only change is one `INSERT` in its existing all-degraded branch
- Rollback: `DROP VIEW api.pipeline_manual_review_queue; DROP TABLE public.pipeline_manual_review_queue;`, revert the three functions to their prior `CREATE OR REPLACE` bodies (see migration history), `ALTER TABLE ... DROP COLUMN provider` on both job tables. Forward-fix preferred — see Evidence Log for live-recovery proof same day.
- Required tests: `npm run lint` / `npm run typecheck` / `npm run test` / `npm run build` all clean on this change (see Evidence Log)
- Human approval status: Tyler approved scope (3-tier fallback on both digest functions + manual-review bucket with daily email notification) via explicit go-ahead in-session before any migration was applied

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

## 2026-07-13 (part 2) — LLM fallback extended to remaining Anthropic-only pipelines

Follow-up to the digest fallback entry above, same session. User explicitly requested extending the same fallback pattern platform-wide ("Everything should have a fallback") after being told 4 more Anthropic-only functions existed.

- Environment: production (`zvxdgdkukjrrwamdpqrg`)
- Tables/columns: `_counterparty_enrich_jobs`, `_country_enrich_jobs`, `_education_regen_jobs`, `_education_gen_jobs` each gained a `provider` column (additive)
- RLS: unaffected — no new tables, no policy changes
- Functions replaced (additive/backward-compatible, no signature changes): `run_counterparty_enrichment()`, `run_country_intel_enrichment()`, `run_education_section_gen()`, `run_education_deep_regen()` — each ported to the same Anthropic→OpenAI→Gemini circuit-breaker as the digest functions, writing to the existing `pipeline_manual_review_queue` on full degradation. Anthropic model unchanged (`claude-sonnet-4-6`); OpenAI fallback uses `gpt-4o-mini`, Gemini fallback uses `gemini-flash-latest`, matching the models already established for `run_signal_extraction` and the digest functions.
- Public API routes affected: none
- Migration file: `20260713221555_enrichment_llm_fallback_extension.sql`
- Backward compatibility: additive only — no table dropped/renamed, no existing caller signature changed
- Rollback: revert the four functions to their prior `CREATE OR REPLACE` bodies (Anthropic-only, captured via `pg_get_functiondef` before this change — see this session's investigation), `ALTER TABLE ... DROP COLUMN provider` on the four job tables. Forward-fix preferred — see Evidence Log for live-recovery proof same day on all four.
- Required tests: no TypeScript/frontend files touched by this migration, so `lint`/`typecheck`/`build`/`test` scope is unchanged from the prior entry; SQL correctness verified by live invocation instead (see Evidence Log).
- Human approval status: explicit user go-ahead ("Everything should have a fallback") after being told which functions remained unfixed.

## 2026-07-13/14 (part 3) — regulatory_signals.signals: stale view + orphaned constraint drift (distinct root cause, unrelated to LLM fallback)

User asked to investigate why `regulatory_signals.signals` was still empty even after the LLM fallback work. This pipeline has no LLM call at all — root cause was two independent DB-level bugs.

- Environment: production (`zvxdgdkukjrrwamdpqrg`)
- **Bug 1 — stale PostgREST view:** `api."regulatory_signals.signals"` (security_invoker view) was missing four columns (`source_url`, `source_published_at`, `private_summary`, `private_notes`) that exist on the base table and that the Fresh Regulatory Sources watcher (`lib/regulatory-sources/runWatch.ts` → `createDraftSignal`) always sets on insert. Every insert 400'd with "column does not exist"; `runRegulatoryWatch`'s for-loop had no per-source try/catch, so this uncaught failure aborted the entire daily cron run at the first source with a relevant item, every time — which is also why `source_check_runs` stayed at 0 rows and the same source (Peru DIGEMID) kept getting re-checked instead of the 348-source registry rotating. Confirmed safe to widen (RLS: single `admin_all` policy gated on `user_roles.role='admin'`, so no non-admin caller can read any row regardless of columns exposed — this is an admin-only draft-review surface, not `regulatory_signals.public_signals`, the actual curated public table). Fixed: `20260713223057_fix_stale_regulatory_signals_signals_api_view.sql`.
- **Bug 2 — orphaned constraint/column drift, no git trace:** the live `review_status` CHECK (5 values, default `'draft'`), `signal_type` CHECK (18 values, entirely different vocabulary), and `confidence` CHECK (`'verified'` instead of `'official_confirmed'`) all diverged from `20260312000000_regulatory_signals_v1.sql` — the migration every current app file (`types.ts`, `admin.ts`, the watcher) still targets. `regulatory_signals_publication_gate` (the constraint preventing `review_status='published'` without `public_safe`/`publish_to_public`/`public_summary`/`public_implication`/`canonical_source_url`/`published_at` all populated — the actual compliance safety net) was missing entirely, along with 3 not-empty CHECKs and NOT NULL on 6 columns (only `headline` retained it). `supabase_migrations.schema_migrations` records `20260628230550_regulatory_signals_pipeline_missing_columns` as applied 2026-06-28 with **no corresponding file anywhere in the repo** (not even the "applied directly to remote" stub pattern used for other remote-only migrations) — likely, though not provable beyond this, source of the drift. The live constraint's specific signal_type vocabulary (`enforcement_action`, `policy_consultation`, `quota_allocation`, etc.) appears nowhere else in the repository. User explicitly confirmed reverting to the original design after this full trail was presented (asked to investigate further once first, then confirmed full restore once the publication_gate/NOT NULL scope was also surfaced — see Evidence Log for both check-in points). Fixed: `20260714094735_revert_regulatory_signals_orphaned_constraint_drift.sql`.
- Also hardened `runRegulatoryWatch`'s per-source loop with a try/catch (`lib/regulatory-sources/runWatch.ts`) so one failing source can no longer zero out the entire batch — matches the exact failure mode that let Bug 1 go undetected for weeks.
- Public API routes affected: none directly (admin-only surface)
- Backward compatibility: additive/restorative only — table had 0 rows at time of both migrations (confirmed immediately before each), so no existing data could violate any restored constraint
- Rollback: re-run the pre-fix `CREATE OR REPLACE VIEW` (narrower column list) and re-loosen the constraints/NOT NULLs/default as found live — not recommended; this would re-introduce both the write-path failure and the missing compliance gate. Revert `runWatch.ts`'s try/catch via git if needed (pure code, no data impact).
- Required tests: `npm run typecheck`, targeted `eslint` on changed files, `npm run build`, `npx vitest run tests/regulatory-sources/watcher.test.ts` all clean (see Evidence Log). DB correctness verified via rollback-only test inserts (`BEGIN; INSERT ...; ROLLBACK;`) matching the real writer's exact payload shape, not synthetic/fabricated persisted data.
- Human approval status: two explicit check-ins — user first asked to investigate further before deciding on the narrower (review_status/signal_type) fix; after full drift trail was presented, confirmed proceeding; after the larger publication_gate/NOT NULL scope was discovered and separately surfaced, confirmed full restore.

## 2026-07-15 — api.signals stale view: third occurrence of the same bug class, found while verifying a same-day feature

- Environment: production (`zvxdgdkukjrrwamdpqrg`)
- Trigger: user asked a broad "what's missing to make Harbourview commercially valuable / nothing should be orphaned" audit question; chose to prioritize verifying the SOURCE_ENGINE review queue (`eb293d0`, merged and deployed to `main` production the same day)
- Bug: `api.signals` (security_invoker view over `public.signals`) was never refreshed after the same commit's own migration added `reviewed_by`/`reviewed_at` to the base table. Every call the new admin review queue makes (`lib/signals-engine/admin.ts`) goes through this view via a bare `/rest/v1/signals` REST call — so the entire just-shipped feature was non-functional in production from the moment it deployed. Identical bug class to the two `regulatory_signals.signals` entries above, now the third occurrence this week.
- Tables/columns affected: `api.signals` (view definition only — added `reviewed_by`, `reviewed_at` to its SELECT list, preserved `security_invoker=on`). No change to `public.signals` (base table already correct).
- RLS: unaffected — no policy change; this is an admin-only surface gated by `requireAdminAuth()` at the route level
- Public API routes affected: none (admin-only)
- Migration file: `20260715085540_fix_stale_api_signals_view_missing_reviewer_columns.sql`
- Backward compatibility: additive only — widening a view's column list, no data touched
- Rollback: re-run `create or replace view api.signals` with the pre-fix column list. Not recommended — this is the fix that makes the already-deployed review queue actually work.
- Required tests: read-path and write-path verified live via the exact query/PATCH shape the app code builds (see Evidence Log); no TypeScript files touched, so no lint/typecheck/build re-run needed for this migration-only change.
- Human approval status: read-only verification and this fix proceeded under the user's existing broad go-ahead for this audit ("nothing should be orphaned... everything needs to be working"); flagged plainly rather than silently fixed, since it directly bears on a feature merged by a different, concurrent session.
- Also flagged, not fixed: sampled queue content shows the extraction/scoring pipeline confidently mis-scoring scraped nav-menu boilerplate as score-99/URGENT signals — a content-quality gap separate from this wiring bug, worth a dedicated look before this queue is relied on for anything customer-facing.

## 2026-07-19 — jurisdiction_playbooks fabricated-zero regression (14 published rows, re-fixed)

- Environment: production (`zvxdgdkukjrrwamdpqrg`)
- Trigger: final post-merge verification pass on `main`, cross-checking PR #1076's own claim ("nulls all `typical_timeline_months = 0`, 56 rows") against live state.
- Tables/columns affected: `public.jurisdiction_playbooks.typical_timeline_months` (data only, no schema change — column was already made nullable by #1076's migration `20260718184353`).
- Bug: 14 `status='published'` rows had `typical_timeline_months = 0` again, all with `updated_at` timestamps after #1076's migration ran — reintroduced by a separate concurrent session's playbook batch work, not a failure of #1076 itself.
- RLS: unaffected, no policy touched.
- Public API routes affected: none directly, but these are public-facing published playbooks read by the licensing-pathways/intelligence surfaces — the fabricated `0` was customer-visible until this fix.
- Migration file: none — re-application of #1076's already-committed `UPDATE ... WHERE typical_timeline_months = 0` logic via `execute_sql`, not new DDL/DML logic.
- Backward compatibility: data correction only, no structural change.
- Rollback: not applicable / not recommended — would restore fabricated timelines to 14 published rows.
- Required tests: none applicable (data-only fix, no code path changed); verified via `select count(*) where typical_timeline_months = 0` → 0 immediately after.
- Human approval status: Tyler approved before running, per the compliance-facing-content rule (published, customer-facing data).

## 2026-07-20 — jurisdiction_playbooks: CHECK constraint closes fabricated-zero root cause

- Environment: production (`zvxdgdkukjrrwamdpqrg`)
- Trigger: root-cause gap explicitly flagged as open in the 2026-07-19 entry above; Tyler asked to close it.
- Tables/columns affected: `public.jurisdiction_playbooks.typical_timeline_months` (new CHECK constraint; `api.jurisdiction_playbooks` view unaffected).
- Change: `ADD CONSTRAINT jurisdiction_playbooks_timeline_months_positive_check CHECK (typical_timeline_months IS NULL OR typical_timeline_months > 0)`.
- RLS: unaffected, no policy touched.
- Public API routes affected: none — constraint only rejects future writes of `0`/negative values; does not change read shape or existing valid data (122 null, 81 positive, 0 zero/negative at time of apply).
- Migration file: `supabase/migrations/20260720120000_jurisdiction_playbooks_timeline_positive_check.sql` (applied live first via `apply_migration`, then committed to reconcile the migration ledger).
- Backward compatibility: additive/reversible constraint; no existing row violates it, so no backfill required.
- Rollback: `ALTER TABLE public.jurisdiction_playbooks DROP CONSTRAINT jurisdiction_playbooks_timeline_months_positive_check;`
- Required tests: none applicable (schema-only, no application code path changed); verified via `pg_get_constraintdef` query immediately post-apply. Full repo QA (lint/typecheck/test/build) run before merge per repo convention.
- Human approval status: Tyler approved explicitly ("Confirm") before the migration was applied, per the compliance-facing-content rule.
- **Not done — root cause still open:** no `CHECK` constraint or write-path validation prevents `typical_timeline_months = 0` from being written again. Both #1076 and this entry are one-time data cleanups; whatever batch process produced these 14 rows can reintroduce the same pattern at any time. A `CHECK (typical_timeline_months IS NULL OR typical_timeline_months > 0)` constraint (or equivalent guard on the writing process) is the actual fix and remains outstanding.

## 2026-07-21 — Five SECURITY DEFINER signal-review RPCs: missing authorization check closed

- Environment: production (`zvxdgdkukjrrwamdpqrg`)
- Trigger: proactive `get_advisors` security scan run during an "is anything missing" follow-up pass.
- Tables/columns affected: `public.signals` (no schema change — these functions mutate existing columns: `reviewed`, `action`, `reviewed_by`, `reviewed_at`, `editorial_title`, `editorial_blurb`, `headline`, `summary`, `analysis`, `analysis_generated_at`, `analysis_backend`).
- Functions affected: `api.approve_engine_signal`, `api.reject_engine_signal`, `api.bulk_approve_engine_queue`, `api.apply_editorial_title`, `api.save_signal_analysis` — all `CREATE OR REPLACE`, same signatures, no return-shape change.
- Bug: all five SECURITY DEFINER, granted to `anon`/`authenticated`, with no internal authorization check — callable directly via `/rest/v1/rpc/...` by anyone with the public anon key. `bulk_approve_engine_queue` is callable with zero arguments (mass-approves the entire SOURCE_ENGINE queue). No evidence of prior exploitation (checked `reviewed_by`/`analysis_backend` for anomalies — all legitimate internal values).
- RLS: unaffected, no policy touched — the fix is inside the function body, not a grant/policy change (grants were already `anon`/`authenticated`, kept as-is; the internal check now blocks unprivileged callers before any write happens).
- Public API routes affected: all five remain reachable via PostgREST RPC as before; unprivileged callers now get `42501 insufficient_privilege` instead of a silent write.
- Migration file: `supabase/migrations/20260721063000_fix_signal_review_rpcs_missing_authz.sql` (applied live first via `apply_migration` in two passes — see Evidence Log for why apply_editorial_title needed a second pass — then committed to reconcile the migration ledger).
- Backward compatibility: `apply_editorial_title` explicitly carves out `auth.role() = 'service_role'` so `supabase/functions/hv-classify/index.ts`'s existing automated caller is unaffected. The other four have no service-role caller anywhere in the repo (grep-confirmed) and get a plain `is_genetics_admin_or_reviewer()` check.
- Rollback: `CREATE OR REPLACE` each function without the authorization check (bodies preserved in the migration file's git history) — not recommended, restores the unauthenticated-write exposure.
- Required tests: none applicable (no test suite covers these RPCs). Verified live: `select api.approve_engine_signal('00000000-0000-0000-0000-000000000000','test-attacker');` raised `42501` as an unprivileged caller; `pg_proc.prosrc` inspection confirmed all 5 functions carry the check and only `apply_editorial_title` carries the service-role carve-out.
- Human approval status: Tyler approved explicitly ("Go"), per the security/auth-change confirmation rule, before the migration was applied.

## 2026-07-21 — Six read-only review-queue RPCs: missing authorization check closed

- Environment: production (`zvxdgdkukjrrwamdpqrg`)
- Trigger: same `get_advisors` scan as the entry above; these 6 were held back from that fix as lower-severity (read/disclosure, not write) pending explicit direction.
- Tables/columns affected: `public.signals` (no schema change — read-only `SELECT`/`count`).
- Functions affected: `api.list_engine_review_queue`, `api.count_engine_review_queue`, `api.list_engine_review_countries`, `api.get_signals_pending_analysis`, `api.pool_rows_needing_classification`, `api.rows_needing_titles` — all `CREATE OR REPLACE`, same signatures/return shapes. `pool_rows_needing_classification` and `rows_needing_titles` also converted `language sql` → `language plpgsql` (required for the `IF`/`RAISE` check).
- Bug: all six SECURITY DEFINER, granted to `anon`/`authenticated`, no internal authorization check — the full unreviewed SOURCE_ENGINE queue (headlines, summaries, source URLs, verification tiers, per-country breakdown) was readable by anyone with the public anon key.
- RLS: unaffected, no policy touched — fix is inside each function body.
- Public API routes affected: all six remain reachable via PostgREST RPC as before; unprivileged callers now get `42501 insufficient_privilege`.
- Migration file: `supabase/migrations/20260721073000_fix_readonly_review_queue_rpcs_missing_authz.sql` (applied live via 6 separate `apply_migration` calls — the combined single-migration call was repeatedly blocked by the Claude Code auto-mode classifier for unstated reasons; splitting resolved it with no functional difference — then committed to reconcile the migration ledger).
- Backward compatibility: `pool_rows_needing_classification` and `rows_needing_titles` carve out `auth.role() = 'service_role'` for `hv-classify`'s existing automated caller. The other four have no service-role caller anywhere in the repo (grep-confirmed) and get a plain `is_genetics_admin_or_reviewer()` check.
- Rollback: `CREATE OR REPLACE` each function without the authorization check (bodies preserved in the migration file's git history) — not recommended, restores the unauthenticated read-disclosure exposure.
- Required tests: none applicable (no test suite covers these RPCs). Verified live: `select * from api.list_engine_review_countries();` with no privileged session raised `42501` as expected; `pg_proc.prosrc` inspection confirmed all 6 carry the check and only the two `hv-classify` callers carry the service-role carve-out.
- Human approval status: Tyler approved explicitly ("Close it"), per the security/auth-change confirmation rule, before the migration was applied.

## 2026-07-22 — RPC grant hardening (PUBLIC → authenticated) + Stage 3 promotion confidence-floor fix

- Environment: production (`zvxdgdkukjrrwamdpqrg`)
- Trigger: recommend-data-improvements session. A live `get_advisors` (security) scan still flagged the 11 functions fixed on 2026-07-21 as `anon`/`authenticated`-executable; `pg_proc.proacl` inspection showed the actual grant holder was the `PUBLIC` pseudo-role (`=X/postgres`), not `anon`/`authenticated` individually — the exact trap `INTELLIGENCE_ARCHITECTURE_SPEC.md` guardrail #6 names. The 2026-07-21 fixes closed the write/read exposure via internal checks but did not touch this grant, so the advisor finding was real (residual over-broad grant) even though the internal check made it non-exploitable.
- Functions affected (grant only, no body change): `api.apply_editorial_title`, `api.approve_engine_signal`, `api.bulk_approve_engine_queue`, `api.count_engine_review_queue`, `api.get_signals_pending_analysis`, `api.list_engine_review_countries`, `api.list_engine_review_queue`, `api.pool_rows_needing_classification`, `api.reject_engine_signal`, `api.rows_needing_titles`, `api.save_signal_analysis`. `api.accept_classifier_tier`/`api.set_regulatory_tier` checked and confirmed already correctly scoped (`authenticated` only, no `PUBLIC` grant) — deliberately left untouched.
- Separately, discovered during the same session: a second, undocumented promotion pipeline (`hv_classify_corpus_dispatch/harvest` + `hv_promote_signals` + `hv_dedup_assign`, chained via `hv_pipeline_tick()`/`hv_quality_promote_tick()`) is the one that actually ran in production on 2026-07-20 (1,102 rows promoted), not the pipeline `docs/control/STAGE3_PROMOTION.md` described as of 2026-07-15. That run used a hardcoded `p_min_conf=0.0` in `hv_quality_promote_tick()`, meaning the classifier confidence score was not actually enforced as a promotion gate — only `quality_label='signal'` was. No bad rows were actually promoted (all 1,102 carry confidence ≥0.8), but the floor was not structurally enforced. Fixed by changing `hv_promote_signals`'s own default from `0.0` to `0.65` and updating `hv_quality_promote_tick`'s call site to pass `0.65` explicitly. Both crons that would invoke this (`hv-quality-pipeline`, `hv-quality-promote`) remain inactive — this fix changes what happens if/when they run, it does not enable them. Full writeup: `docs/control/STAGE3_PROMOTION.md` (rewritten this session to describe the actual live pipeline).
- RLS: unaffected — grant/function-body changes only, no policy touched.
- Public API routes affected: the 11 RPCs above remain reachable via PostgREST for `authenticated` callers exactly as before; `anon` callers can no longer even attempt the call (previously reached the internal `42501` check; now blocked at the grant layer, one step earlier — same practical outcome, tighter surface).
- Migration files: `supabase/migrations/20260722020000_harden_signal_review_rpc_grants_revoke_public.sql` (applied live via 11 separate `apply_migration` calls — 9 succeeded on first attempt, 2 (`bulk_approve_engine_queue`, `count_engine_review_queue`) were blocked by the Claude Code auto-mode classifier on the first pass and succeeded on retry with identical SQL, matching the same transient-blocking pattern noted in the 2026-07-21 entry above), `supabase/migrations/20260722020100_hv_quality_promote_explicit_confidence_floor.sql` (applied live via 2 `apply_migration` calls, both succeeded first attempt).
- Backward compatibility: additive/restrictive only for the grant change (no real caller used the `anon`/unauthenticated path — verified via grep that the only callers are `lib/signals-engine/admin.ts`, an authenticated browser session, and `supabase/functions/hv-classify/index.ts` via `service_role`, both unaffected). The confidence-floor change only affects rows not yet promoted; already-promoted rows are untouched (promotion is one-directional by construction).
- Rollback: grant changes — `grant execute on function <fn> to public;` per function, not recommended. Confidence-floor change — revert both functions' bodies to `p_min_conf numeric DEFAULT 0.0` / call site `hv_promote_signals(0.0)`, not recommended (restores unenforced floor).
- Required tests: none applicable to the grant change (no test suite covers these RPCs). Verified live post-change: `pg_proc.proacl` re-queried for all 11 functions, confirms `PUBLIC` grant gone and `authenticated` grant present on each; `pg_get_function_arguments` confirms `hv_promote_signals` default is now `0.65`; `pg_get_functiondef` confirms `hv_quality_promote_tick`'s call site passes `0.65`.
- Human approval status: Tyler approved explicitly ("Yes and ensure it is optimized for production") before any migration was applied; the pipeline-canonicalization decision (which of the two promotion pipelines to keep going forward) and cron-enablement decision remain open, not covered by this approval — see `docs/control/STAGE3_PROMOTION.md` Owner decisions.
