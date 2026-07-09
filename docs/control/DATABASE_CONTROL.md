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
- **Human approval status:** pending — this is a corrected version of the PR #1000 migration pushed to a review branch, not applied to any Supabase project. Requires sign-off before `apply_migration` or merge to a deploying branch.

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
