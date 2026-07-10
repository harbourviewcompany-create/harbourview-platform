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

## 2026-07-10 — Restore deleted dev seed fixtures + fix country_education_overlay seed/migration (PR #989)

- **Environment:** local workspace only; no production Supabase push attempted. Live schema for `country_education_overlay` on project `zvxdgdkukjrrwamdpqrg` was read via `execute_sql`/`information_schema.columns` (read-only) to diagnose the issue below.
- **Tables affected:** `source_documents`, `source_chunks`, `entities`, `model_prompt_versions`, `signal_duplicate_groups`, `signal_candidates`, `signal_evidence`, `signal_risk_flags`, `model_call_logs`, `signal_jobs`, `signal_entity_mentions`, `signal_conversions`, `signal_processing_errors` (all restored, previously deleted wholesale by this PR's prior revision), plus `country_education_overlay`.
- **Migration:** `supabase/migrations/20260710140000_country_education_overlay.sql` (new — restores the `CREATE TABLE` for `country_education_overlay` that was missing from this branch/`main` entirely; the table already exists live on the shared project via unmerged PR #984).
- **Seed:** `supabase/seed.sql` — restored full original Signal Engine V1 dev fixture set (was replaced wholesale with a 4-row insert and a placeholder comment claiming the rest "would go here"), kept the 4 new `country_education_overlay` rows this PR added, and rewrote that insert to match the real table schema (see finding below), plus added 4 new `source_documents` rows as real citations for those rows.
- **Bug found and fixed:** the `country_education_overlay` insert as originally written used a column shape (`id` text, `topic_key`, `title`, `content_summary`, `key_actions`, `compliance_notes`, `published_at`, `review_status='approved'`) that does not exist on the real table and would have failed outright — `review_status='approved'` also violates the table's `CHECK` constraint (valid values are the `verified_*`/`review_pending`/`do_not_publish` vocabulary in `lib/education/types.ts`). Rewritten to the real columns (`id uuid`, `country_iso2`, `module_key`, `role_id`, `topics jsonb`, `action_label`, `source_ids uuid[]`, `review_status`, `last_verified_at`). `role_id` values (`importer`, `distributor`, `operator`) kept as originally authored — the column has no `CHECK` constraint, and the live table already holds rows using a third, different `role_id` convention (`cultivator_producer`, `investor_operator`, `general`), confirming there is no single enforced vocabulary here to conform to.
- **Sourcing added:** the table has no `source_url` column, but does have `source_ids uuid[]` referencing `source_documents`. Added one real citation per row: German AMG §72 (import licence) and BtMG (narcotics act) via `gesetze-im-internet.de`, Mexico's DOF cannabis regulation (COFEPRIS + SENASICA), and Congressional Research Service report R46709 (IRC §280E). `review_status` set to `review_pending` (not `verified_*`) since these are citation lookups, not a compliance/legal sign-off.
- **RLS impact:** unchanged from PR #984's original migration — RLS enabled, public `SELECT` only for `verified_*` review statuses; new seed rows are `review_pending` and therefore not publicly visible.
- **Backward compatibility:** additive only; nothing dropped or rewritten relative to the pre-PR-989 state of `main`.
- **Rollback/forward-fix path:** revert this fix commit; `supabase/seed.sql` and the new migration file are both self-contained additions/restorations with no other file dependencies.
- **Known coordination gap (not fixed here):** PR #984 (which actually owns `country_education_overlay`'s schema/app wiring) is applied live on the shared project but not merged into `main`. Whoever merges PR #989 should confirm PR #984's status first — the migration added here is idempotent (`create table if not exists`, `create policy` wrapped in an exception-guarded `do` block) so it is safe to apply locally, but the two PRs should not both attempt to be the schema's landing point without reconciling.
- **Required tests run:** see `docs/control/EVIDENCE_LOG.md` entry same date.
- **Human approval status:** pending review.
