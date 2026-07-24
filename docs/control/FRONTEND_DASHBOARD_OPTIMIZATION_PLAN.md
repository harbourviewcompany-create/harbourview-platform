# Frontend Dashboard Optimization Plan — Command Centre

Status: proposed, unstarted. Written for any agent session to pick up a piece independently.
Origin: findings from a Claude (chat) session auditing `CommandCentre.tsx`, `MobileCommandCentre.tsx`,
and `lib/dashboard/dashboardLiveData.ts` against the full Supabase schema, per AGENTS.md's
"Depth & Competitive Bar" entity-audit process. Read `AGENTS.md` and `CLAUDE.md` before picking up
any item below — this doc doesn't restate the PR/QA process, it defers to those.

## Method note (for whoever picks this up)

Naive `ilike '%table_name%'` grepping of `CommandCentre.tsx` against the schema produces a lot of
false negatives, because the component consumes typed wrapper functions from `lib/`, not raw table
names, and some panels (e.g. Compliance) are wired via dynamic import rather than the static import
block. Confirm any "missing" claim below by checking the relevant `lib/` module directly (e.g.
`grep` for the wrapper function, not the table name) before treating it as still true — this list
reflects state as of 2026-07-19 and the codebase moves fast (per HANDOFF.md, concurrent sessions
have shipped features mid-audit before).

## Finding 1 (revised 2026-07-19, same session): several "intelligence" panels are static mock data — but NOT the corridor one

**Correction to the original version of this finding:** the corridor banking/authority/cost data
(`CORRIDOR_BANKING`/`CORRIDOR_AUTHORITY`/`CORRIDOR_COSTS`, from `./data/corridorIntel.ts`) was
originally flagged here as static-only. That was wrong, and the mistake is worth naming so it
doesn't get repeated: the check that produced it only looked at `CommandCentre.tsx`'s top-level
import block. The corridor UI actually fetches live data on-demand (on row expand) from
`/api/corridors/data?key=<corridor>`, which queries `corridor_regulatory_alerts` directly and calls
a `get_corridor_stats` RPC (both confirmed to exist and be populated) — and there's a working
submission form (`/api/corridors/submit`) that writes to `corridor_processing_times`. This is a
fully live, two-way-wired feature sitting next to the static reference content (banking contacts,
regulator emails, cost estimates), not a replacement for it. **No further data-wiring work is
needed here** — the live plumbing already exists end-to-end. What's still open is a UX task, not a
data task: `corridor_regulatory_alerts` isn't surfaced as a first-class alert feed yet (see IA/UX
recommendation 2 below).

The lesson for whoever audits the remaining panels below: a top-level-import check produces false
negatives whenever live data is fetched on interaction (expand, tab switch, filter change) rather
than on initial render. Check for fetch calls to internal API routes and Supabase RPC calls inside
the component body, not just the import block, before concluding something is static.

**Confirmed still genuinely static (no backing table, no internal API route found anywhere in
`CommandCentre.tsx` for these — verified by grepping every internal API fetch call in the file,
which returned exactly three: `/api/dashboard/signals`, `/api/corridors/data`, `/api/country-intel`):**

- Banking providers — `./data/bankingProviders.ts`
- Insurance providers — `./data/insuranceProviders.ts`
- Logistics providers — `./data/logisticsProviders.ts`
- Job board — `./data/jobsBoard.ts`
- Industry events — `./data/industryEvents.ts`
- Price benchmarks — `./data/priceIntelligence.ts`
- Landed cost data — `./data/landedCostData.ts`

None of these seven have a matching Supabase table today (confirmed against the full public schema
table list). Wiring them live isn't a UI fix like the corridor case would have been — it's a new
data-sourcing decision (build a table + ingestion path, or keep as maintained static reference
content) and should be scoped as such, not assumed to be a quick swap.

**Partial exception worth a closer look:** `market_metrics` (a live, populated, per-country table
already used elsewhere on the dashboard) contains some overlapping data points — e.g. metric names
like "Average Wholesale Flower Price 2025" and "Average Pharmacy Price Q1 2026" — that could
partially inform `PRICE_BENCHMARKS`. It is not a clean drop-in replacement: `market_metrics` is
country-keyed general market data, not the product-type × tier structure `PRICE_BENCHMARKS` uses,
so this would need real mapping/aggregation logic, not a straight swap. Scoped as an additive
(not replacing) cross-check annotation — full implementation-ready spec at
`docs/control/PRICE_CROSSCHECK_SPEC.md`.

## Finding 2: RLS disabled on 19 tables (security, not UI, but found during this pass)

Most are internal job-queue/pipeline tables (lower risk since not customer-facing), but at least
`country_name_aliases` and `signal_geo_labels` are real reference data with RLS disabled — **potentially**
exposed to the anon key. This audit checked `pg_tables`/`pg_policies` only; it did not check table
grants or actual API-layer exposure, so treat "exposed" as unconfirmed until someone does that check.
Needs its own audit + PR either way — out of scope for this doc, flagging so it isn't lost. Check
`docs/control/EVIDENCE_LOG.md` to confirm whether this has already been addressed by the time you're
reading this.

## Finding 3: `CommandCentre.tsx` is a ~637KB / 16,000+ line single file

`MobileCommandCentre.tsx` is ~232KB. This is a maintainability and performance problem independent
of the data-freshness issue in Finding 1:
- Slow HMR / dev iteration speed
- No code-splitting — users download logistics/genetics/deals code paths even if they only touch
  compliance
- Makes exactly this kind of audit (what's live vs. static, what's wired vs. orphaned) much harder
  than it should be, which is likely part of why Finding 1 went unnoticed across multiple sessions

**Task:** split by domain (compliance, genetics, deals, marketplace, corridor/logistics, education)
into separately route-loaded components. This is a larger, higher-risk refactor — treat as its own
PR sequence, not a single change, and get explicit sign-off per CLAUDE.md before merging anything
that touches the main dashboard's render path.

## Finding 4: known-orphaned tables (carried over from prior HANDOFF.md audit, not re-verified here)

`opportunities`, `engagements`, `projects` — reads like a personal biz-dev tracker rather than
product data; `jurisdiction_briefings` — superseded by `cc_jurisdiction_briefings`, likely dead.
Confirm still true before acting; HANDOFF.md's Session Log has the original context.

## IA / UX recommendations (not yet scoped into individual tasks)

1. Fix Finding 1 before any visual/IA polish — a live-data platform showing static provider lists
   is a trust problem, not a cosmetic one.
2. Surface `corridor_regulatory_alerts` as a real alert feed — it's exactly the kind of
   "get ahead of your competitors" signal that justifies a subscription price, and it's currently
   invisible.
3. Unify the tier/entitlement vocabulary — HANDOFF.md flags three separate, partially-conflicting
   systems (`billing/entitlements.ts`, the regulatory-pathways gate, and a same-day pivot to
   per-report payment). Pricing-gated intelligence can't ship confidently until this is one system.
4. Add an in-UI indicator for the four-stage country funnel (directory → public brief →
   evidence-gated preview → authenticated dashboard) — already flagged in HANDOFF.md, still open.
5. Longer-term differentiation ideas (not scoped, for discussion): natural-language query over
   `ia_signals`/`ia_graph_entities`/`ia_graph_edges`; Supabase Realtime on alert-style tables instead
   of page-load snapshots; an agentic digest composing `daily_digest`/`editorial_items` per role.

## Suggested order of pickup

Finding 1 is really two separate tracks with very different blast radii — don't pick it up as one
undifferentiated item:

1a. `PRICE_BENCHMARKS` × `market_metrics` cross-check (`docs/control/PRICE_CROSSCHECK_SPEC.md`) —
    clearest scope, additive/read-only, smallest blast radius of anything in this doc. Pick up first.
1b. The other six static panels (banking, insurance, logistics, job board, industry events, landed
    cost) — each is its own new data-sourcing decision (new table + ingestion path, or keep as
    maintained static content). Larger and slower than 1a; scope each independently, don't batch them.
2. Finding 2 (RLS) — security, should not wait long, but is independent of frontend work.
3. Finding 4 — quick, mostly a deletion/cleanup PR once re-confirmed.
4. Finding 3 (monolith split) — largest and riskiest, do last and in smaller sequenced PRs.
