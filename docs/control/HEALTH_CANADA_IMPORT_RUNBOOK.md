# Health Canada Operator Registry Import Runbook

## Seed placement

Place CSV exports from the corrected/reconciled workbook under:

`data/private/health-canada/`

Expected sheet exports:

- `raw_source_rows.csv`
- `canonical_operators.csv`
- `active_site_licences.csv`
- `outreach_ready_queue.csv`
- `first_25_send_order.csv`
- `exclusions_revoked_expired_suspended.csv`
- `duplicate_second_site_clusters.csv`
- `individual_name_verification_holds.csv`
- `conflict_resolution_notes.csv`

Do not commit private seed files unless a separate private-data policy explicitly approves it.

## Import command

Server-side only:

`npm run import:health-canada-operators`

Direct script form:

`tsx scripts/import-health-canada-operators.ts`

Dry run:

`HEALTH_CANADA_OPERATOR_IMPORT_DRY_RUN=1 tsx scripts/import-health-canada-operators.ts`

Required environment:

- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL` or compatible Supabase URL variable

## Validation command

`npm run validate:health-canada-operators`

The validation gate checks migration objects, RLS posture, importer sheet coverage, package scripts, docs requirements, and public leakage tokens.

## RLS/privacy model

All registry tables are private. RLS must remain enabled. Anonymous users are denied. Admin/operator may read/write. Viewer is denied. Analyst is not granted by default.

Service-role import must run server-side only. Do not create public routes for registry import or lookup.

## Leakage rules

Public marketplace routes, DTOs, APIs, HTML, search, listing cards, and client bundles must not expose registry table names, source row IDs, source snapshot IDs, outreach queue IDs, outreach readiness, conflict flags, verification holds, exclusion statuses, phone fields, source evidence, or admin notes.

## Rollback

For a bad import, remove staged rows by `source_snapshot_id` using a controlled admin SQL rollback. Do not delete tables unless the entire registry feature is being reverted.

For full feature rollback:

1. Disable admin route access by reverting the route shell commit.
2. Revert importer/validation scripts.
3. Drop the registry tables in dependency order if required:
   - `canadian_operator_outreach_queue`
   - `canadian_operator_individual_holds`
   - `canadian_operator_conflicts`
   - `canadian_operator_duplicate_clusters`
   - `canadian_operator_exclusions`
   - `canadian_operator_licence_sites`
   - `canadian_operator_canonical`
   - `health_canada_raw_source_rows`
   - `health_canada_source_snapshots`
4. Rerun leakage probes.

## HOLD condition

This seed remains `transcript/reconciled-hold` unless replaced by a direct official machine parse of the current Canada.ca licence-holder table. Do not claim proof-grade Health Canada completeness without row-by-row official source reconciliation.
