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

## Decision Intelligence Stage 0 product boundary

Stage 0 customer/product reads are not direct table SELECTs. Authenticated Intel/operator product users consume only the tier-gated `SECURITY DEFINER` RPC `api.get_intel_event_dossier(text)` and `api.resolve_intel_event_route(text)`. Server dashboard hydration uses the service-role-only `api.resolve_intel_dashboard_routes(text[])` helper. Canonical bases, allowlisted dossier views and raw evidence remain staff/service paths. Full migration, RLS and publication rules live in `docs/control/INTEL_DECISION_OS_RLS_MIGRATION.md` and `docs/control/INTEL_DECISION_OS_EXISTING_TARGET.md`.

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

## 2026-08-20 — PR #1598 classifier pre-filter and authoritative review queue

- Environment: repository/local verification only. Production was inspected
  read-only for current function/cron authority; no SQL write, migration apply,
  cron change, deployment or merge was performed.
- Tables: proposed internal
  `public.hv_signal_review_queue`,
  `public.hv_classify_prefilter_dispositions` and
  `public.hv_pipeline_stage_log`.
- RLS/ACL: all three tables enable RLS; `anon` and `authenticated` receive no
  privileges; `service_role` receives read-only table access. Queue DML occurs
  through service-role-only `SECURITY DEFINER` RPCs. Classifier dispatch and
  promotion do not gain service-role execution.
- Functions changed:
  `hv_classify_corpus_dispatch(integer,integer)` extends the exact August 14
  budget/five-attempt/manual-review path with translated-text pre-filtering;
  `hv_promote_signals(numeric)` adds borderline queueing while retaining the
  `classifier_validation` gate; review approve/reject/list and pre-filter helper
  functions are added.
- Functions deliberately unchanged: `hv_classify_corpus_harvest`,
  `hv_dedup_assign`, `hv_pipeline_tick` and `hv_quality_promote_tick`. This
  preserves HNSW KNN, `pg_catalog, public, extensions` operator resolution and
  the pending-embedding exclusion.
- Indexes: no new vector index. `idx_signals_embedding_1024_hnsw` remains the
  sole canonical index; the draft duplicate
  `signals_embedding_1024_hnsw_idx` was removed from the migration.
- Cron state: read-only 2026-08-20 evidence records
  `hv-quality-pipeline = */30 * * * * / active` and
  `hv-quality-promote = 10,40 * * * * / active`. The migrations contain no cron
  mutation and the apply checklist requires pre/post equality.
- Public API/routes: none. The new objects contain internal operational
  dispositions and review state; no public DTO or customer-visible field is
  added.
- Migration files:
  `20260820130000_hv_pipeline_optimization.sql` and
  `20260820131000_hv_review_queue_resolve.sql`, ordered as listed.
- Backward compatibility: current function signatures remain callable; the
  classifier adds only a bounded selection gate. Filtered inputs receive an
  explicit stored disposition and changed translated input is re-evaluated.
  Human rejection writes an authoritative marker and blocks later automatic
  promotion.
- Forward-fix: use a new migration based on
  `20260814180000_bound_classify_retries.sql` (dispatch/harvest),
  `20260814143000_fix_hv_dedup_assign_search_path.sql` (dedup),
  `20260730184257_fix_duplicate_dispatch_translate_and_embed.sql` (tick), or
  `20260723084602_stage_c_classifier_validation_gate.sql` (promotion). Do not
  restore the stale July baseline or drop the additive audit tables.
- Replay fidelity: the temporary verification workspace alone restores the
  missing `pg_trgm` prerequisite and policy identities, skips absent
  production-local staging relations while hardening every extant relation,
  evaluates the reconstructed `source_registry.content_type text[]` shape
  correctly, places the recorded production-shape Clinical reconciliation before
  its fail-closed preflight, additively reconciles the recorded legacy and
  Prescriber OS concept, alias and claims-table contracts, resolves hard-coded
  cron IDs through the recorded by-name successor and gives each exact duplicate
  repository version a unique replay-only version. No checked migration
  filename/body or production-ledger row is changed.
- Required tests: full production-faithful zero-state replay through both files,
  same-database idempotent replay, PostgreSQL 17 targeted behavior,
  multilingual fixture recall, RLS/ACL assertions, SQL parse/static contracts,
  typecheck, build and security suites. Exact results are recorded in
  `EVIDENCE_LOG.md` and the PR body.
- Human approval status: authorized to repair and verify PR #1598 only.
  Production apply, cron mutation, deployment and merge remain unapproved.

## 2026-08-28 — run_signal_counterparty_extraction() CTE-scope defect

- Environment: production (`zvxdgdkukjrrwamdpqrg`). **Not applied.** Migration is
  committed and awaiting apply sign-off; production still carries the defect.
- Tables/columns: none. No schema object is created, altered or dropped. The only
  effect is the text of one function body.
- Defect: the collect branch of `public.run_signal_counterparty_extraction()`
  ends its `WITH resp -> parsed -> ok -> extracted -> ins -> mark_used -> done`
  chain with `select count(*) from ins into v_inserted;`, then references
  `(select provider from parsed)` from a *separate* `RETURN` statement. CTEs are
  scoped to the statement that defines them, so every collect-phase call raises
  `ERROR: relation "parsed" does not exist`, aborting the transaction and rolling
  back the `ia_counterparties` upserts, the `ia_signals.counterparty_extracted_at`
  marks and the `_counterparty_jobs.collected` flag written by the same statement.
- Observed impact (read-only `cron.job_run_details` query, 2026-08-28): the
  `counterparty-extraction` cron failed **161 consecutive runs**, every run since
  2026-08-24 18:10 UTC. Last success 2026-08-24 17:40 UTC. No counterparties were
  extracted in that window.
- Functions replaced: `public.run_signal_counterparty_extraction()` only. Signature,
  return shape and JSON keys are unchanged — `provider` is still returned, now via a
  variable resolved inside the CTE's own statement.
- Explicitly NOT changed: `run_daily_digest()` and `run_editorial_digest()` were both
  inspected and neither carries this defect. Both already resolve
  `(select provider from parsed)` inside their `select ... into v_signals` /
  `into v_items` statement and return the variable — which is the shape this fix
  adopts. Leaving them untouched is deliberate.
- Repository/production drift (pre-existing, NOT resolved here): the committed body
  in `20260704135057_fix_unprotected_http_content_cast.sql` returns no `provider`
  key at all and therefore has no defect. Production's live body has diverged — it
  carries a Gemini fallback, a provider-degradation check and a
  `pipeline_manual_review_queue` path that appear in no migration in this
  repository, and the `provider` key arrived with them. Closing that drift means
  adopting a body this repository has never reviewed; that is a separate decision
  with a separate blast radius and is not taken here.
- Migration file: `20260828022000_fix_counterparty_extraction_cte_scope.sql`. It is a
  targeted patch over `pg_get_functiondef()` (house pattern from
  `20260815234000_daily_brief_lineage_hardening.sql`), not a restated body —
  restating would silently revert the drifted live behaviour. It converges from
  either starting body: it patches the live body, no-ops on the committed body
  (which is already correct), and raises on anything else.
- Grants: unchanged. Current ACL is `postgres=X/postgres` — no `service_role` grant
  and no PUBLIC. `CREATE OR REPLACE` preserves the existing ACL, so the migration
  neither widens nor narrows it. The house `grant execute ... to service_role` line
  used by sibling digest migrations was deliberately **not** copied, because here it
  would be a privilege widening.
- Backward compatibility: the returned JSON keys and their meanings are identical.
  Callers see a successful collect phase where they previously saw an exception.
- Rollback: write a **new forward migration** applying the two replacements in
  reverse (`v_old` and `v_new` swapped). Do **not** edit and re-run the original
  file: once applied its version is recorded in
  `supabase_migrations.schema_migrations`, so it will not re-run, and editing a
  recorded migration breaks its content-hash binding under
  `check-pending-production-migration-decisions`. Reversal is mechanically
  possible because the marker the file guards on,
  `(select provider from parsed)`, survives the patch -- it moves into the
  `select ... into v_inserted, v_collect_provider` statement rather than being
  deleted -- so a reverse patch is not blocked by the guard; verified on a local
  PostgreSQL 16 cluster. No data is written; no object is created or dropped.
- Required tests: verified on a throwaway local PostgreSQL 16 cluster against a
  structurally faithful reproduction — production's failure reproduced
  byte-identically, the migration applied, the same call then returned
  `{"ok": true, "phase": "collect", "provider": "anthropic", "counterparties_touched": 1}`,
  and the previously-rolled-back side effects committed. Replay path and fail-loud
  path also verified. Full results in `EVIDENCE_LOG.md` and the PR body.
- Human approval status: Tyler approved the fix in-session after being shown the
  diagnosis. **Apply to production and merge remain unapproved.**

## Remaining historical control entries

Historical database-control entries below this line are preserved in git history from prior DATABASE_CONTROL commits and in `docs/control/EVIDENCE_LOG.md`. New Decision Intel Stage 0 work is governed by the Stage 0 product boundary section above plus `INTEL_DECISION_OS_RLS_MIGRATION.md`.
