# Harbourview recovery checkpoint — 2026-10-09

**Status: NOT ready for production cutover.** This is a reconstruction in the separate Free-plan project `vxosexkwpqbswusapook` (ca-central-1), not restoration of the original project or its data. The Vercel production application still targets the original project `zvxdgdkukjrrwamdpqrg` (us-west-2). Do not change production Supabase settings without separate authorization and a verified data/account migration.

## Verified database state (2026-10-09, 11:30–11:40 UTC)

- Recovery SQL connection succeeds and project reports ACTIVE_HEALTHY.
- 291 countries; 32 canonical v2 dimensions; 9,312 dimension-state records and 9,312 capture jobs.
- 1,224 migration ledger versions; the unfulfilled repository migration `20260924162000_regulator_evidence_depth_backfill.sql` asserts at least **55** provenance-backed regulator jurisdictions; this has **not** been applied or marked complete.
- 643 source-registry records; 510 capture snapshots, of which 49 succeeded and 461 failed; 49 content-qualified snapshots across 36 primary-regulator jurisdictions. Zero `regulatory_market_access_primary_sources` rows.
- Zero `auth.users` accounts in the recovery project. Therefore this is not a recovery of existing user identities, authentication state, or production business data.
- No production cutover or merge occurred.

## Original production outage

- Metadata says ACTIVE_HEALTHY, but the SQL endpoint still returns ECONNREFUSED on port 5432.
- Postgres logs from 09:30–11:30 UTC on 2026-10-09 include 1,300 `No space left on device` events and **zero** `ready to accept connections` messages. The original WAL/system-disk crash loop is not resolved. Supabase support/platform remediation is required if self-service recovery remains ineffective.
- Do not delete, truncate, manipulate WAL files, or alter the original project.

## Recovery ingestion bug and mitigation

- The snapshot capture worker was writing `network_status='http_error'` or `'error'`; the database check constraint only accepts `online`, `degraded`, `offline`, or `quarantined`. Errors from the failed status update were not handled, so broken URLs were re-selected every two minutes.
- Corrected on this recovery branch: use valid statuses; defer 401/403/404/410 and certificate errors; handle NUL in source text; cap stored extracted text at 100,000 characters; avoid duplicate raw-payload storage. Deployed `source-snapshot-capture` version 5 on the recovery project.
- Controlled two-source invocation returned HTTP 403/404 and created no duplicate snapshots. Both sources are now `quarantined`, with retry delayed for seven days. Fourteen heavily failing sources were deferred by 72 hours after repeated failures.
- **All 14 cron jobs on the recovery project are paused** (active=false) as of this checkpoint, retaining schedules for safe re-enablement. This prevents unintended writes, wasteful retries, and outbound calls back to the broken original project. Some replayed jobs still refer to original-project URLs or require unavailable secrets. Restore those dependencies before selectively re-enabling jobs.

## Release gates

1. Recover the original database/WAL through Supabase infrastructure support, or obtain a verified original-data backup and explicitly approve a replacement cutover.
2. Restore and reconcile original `auth.users`, user roles, identities, business records, storage objects, and provider/Edge Function secrets before migration/cutover. Do not infer these from migration files.
3. Obtain at least 55 real, provenance-backed first-party regulator evidence records with matching live snapshot hashes before applying the remaining evidence-depth migration. Never fabricate evidence or bypass its assertion.
4. Audit remaining cron jobs and old project URLs, resume only tested, resource-bounded jobs, and monitor database bytes/WAL growth and failed captures.
5. Prove authenticated globe → route → dashboard flow, Auth/PostgREST health, and Vercel target alignment, with a reversible rollback plan.
6. Keep all recovery changes separate from `main` and production until the above checks and explicit promotion approval.

No paid upgrade, deletion of business data, or live application configuration change was performed during this checkpoint.
