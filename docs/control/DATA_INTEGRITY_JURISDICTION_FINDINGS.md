# Data Integrity Findings: Jurisdiction Briefings + Personal-Tracker Tables

Status: findings verified live against the database this session. One migration proposed
(revoke-only, reversible). Requested by Tc, 2026-07-23, as the "data integrity" track from
`docs/control/FRONTEND_DASHBOARD_OPTIMIZATION_PLAN.md` (PR #1083), Finding 4.

## Finding A: legacy `jurisdiction_briefings` table/view — stale, dead, but still publicly exposed

Verified via direct query:
- `public.jurisdiction_briefings`: 20 rows, no recent writes.
- `public.cc_jurisdiction_briefings`: 302 rows, actively written and read.

Verified via source: both app-side consumers of jurisdiction data —
`app/actions/getJurisdictionBriefing.ts` and `lib/command-centre/jurisdictionBriefingData.ts` —
query `cc_jurisdiction_briefings` exclusively. Neither references `jurisdiction_briefings`.

Verified via grants: `api.jurisdiction_briefings` (the PostgREST-exposed view over the legacy
table) still grants `SELECT` to `anon` and `authenticated`. RLS is enabled on the base table
(`relrowsecurity = true`), so this isn't a raw data leak, but it is dead API surface: stale
20-row country-briefing data reachable by anyone via `GET /rest/v1/jurisdiction_briefings`, with
no product code pointing at it.

**Included in this PR:** `supabase/migrations/<timestamp>_revoke_legacy_jurisdiction_briefings_grants.sql`
— revokes `SELECT` on `api.jurisdiction_briefings` from `anon` and `authenticated`. Does not drop
the table or view (fully reversible via re-grant); touches no data.

**Not included:** actually dropping `jurisdiction_briefings`/`api.jurisdiction_briefings`. Revoking
grants is enough to close the exposure; dropping is a separate, higher-blast-radius decision that
doesn't need to ride along with this fix.

## Finding B: `opportunities`, `engagements`, `projects` — NOT orphaned product tables

The original optimization plan (PR #1083) flagged these three tables as possibly-orphaned. Checked
this session:
- Each has exactly 3 rows.
- `ops/tyler-work-os-v1/projects_master.csv` exists in the repo alongside them, strongly indicating
  these back a personal work-tracking tool ("tyler-work-os"), not the Harbourview product.
- The product's actual "opportunities" feature (`app/opportunities`,
  `lib/marketplace/liveOpportunities.ts`) reads from `marketplace_public_listings_v1`, a completely
  different table.

**Correction to the record:** these tables are not dashboard/product orphans and don't need
cleanup. Recommend the FRONTEND_DASHBOARD_OPTIMIZATION_PLAN.md doc be updated to drop this from its
findings list, so a future session doesn't re-flag or try to "clean up" someone's personal tracker.

## Not addressed this session: the 7 static-data dashboard panels (plan Finding 1)

Still requires a source-of-data decision per panel (banking/insurance/logistics/job-board/
industry-events/price-benchmarks/landed-cost) — each is its own scoping exercise, not a quick fix,
per the original plan doc. One sub-item, the market_metrics price cross-check, has a full
implementation-ready spec already written (`docs/control/PRICE_CROSSCHECK_SPEC.md`, on the
still-open `docs/frontend-dashboard-optimization-plan` branch / PR #1083) — that's the one item in
this bucket ready to build directly, as its own PR.

## GO/HOLD
Decision: HOLD (draft). The grant-revoke migration is low-risk and reversible but still touches
production RLS/grants — sign-off remains with Tc before merge, per this repo's standing practice
for anything in that category.
