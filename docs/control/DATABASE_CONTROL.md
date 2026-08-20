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
- Required tests: full production-faithful zero-state replay through both files,
  same-database idempotent replay, PostgreSQL 17 targeted behavior,
  multilingual fixture recall, RLS/ACL assertions, SQL parse/static contracts,
  typecheck, build and security suites. Exact results are recorded in
  `EVIDENCE_LOG.md` and the PR body.
- Human approval status: authorized to repair and verify PR #1598 only.
  Production apply, cron mutation, deployment and merge remain unapproved.

## Remaining historical control entries

Historical database-control entries below this line are preserved in git history from prior DATABASE_CONTROL commits and in `docs/control/EVIDENCE_LOG.md`. New Decision Intel Stage 0 work is governed by the Stage 0 product boundary section above plus `INTEL_DECISION_OS_RLS_MIGRATION.md`.
