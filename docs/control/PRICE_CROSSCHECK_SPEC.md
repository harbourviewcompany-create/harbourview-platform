# Spec: live cross-check annotation for PRICE_BENCHMARKS

Status: proposed, unstarted. Ready for implementation in an environment with a real checkout and
working `npm run lint`/`typecheck`/`test`/`build` — this chat session has none of those, so this is
a spec handoff, not a diff. Read `AGENTS.md` and `CLAUDE.md` first if you haven't already.

## What this is NOT

Not a replacement of `PRICE_BENCHMARKS` (`components/dashboard/data/priceIntelligence.ts`) with
`market_metrics`. That data is curated, structured by country × product-type × quality-tier, with
analyst notes explaining each trend — comparable in kind to the `CORRIDOR_AUTHORITY`/`CORRIDOR_BANKING`
reference content, which turned out to be legitimate authored content, not something to blindly
swap for a live table (see the corrected Finding 1 in `FRONTEND_DASHBOARD_OPTIMIZATION_PLAN.md`).

Checked `market_metrics` directly: of its rows, only 6 are price-related across all countries, in
inconsistent units (EUR/g, CAD/g, PLN/g, EUR/kg), mixing retail-pharmacy and wholesale prices, with
irregular period coverage. It cannot support or replace the ~100+ structured `PRICE_BENCHMARKS`
entries. Treating this as a full data-source swap would be a quality downgrade, not an improvement.

## What this is

A small, honest addition: where a `market_metrics` row exists for the same country with a
`source_date` more recent than the matching `PRICE_BENCHMARKS` entry's `updatedQ`, show a subtle
"newer data available" cross-check link/tooltip on that benchmark card — nothing more. This lets a
user (or the ops team doing the quarterly `PRICE_BENCHMARKS` refresh) spot where the curated data
might be going stale, without presenting the sparse `market_metrics` row as an equivalent, wired-up
replacement.

## Data mapping

`PRICE_BENCHMARKS` entries have `country` (ISO2), `product`, `tier`, `minPrice`/`maxPrice`,
`currency`, `unit`, `updatedQ` (e.g. `"Q2 2026"`).

`market_metrics` rows relevant here have `country_iso2`, `metric_name`, `metric_value`,
`metric_unit`, `source_date`.

**On `metric_name`:** the migration (`supabase/migrations/20260622000001_market_metrics_time_series.sql`)
documents this as a controlled vocabulary and lists `avg_flower_price_per_gram_usd` as the canonical
price metric. Verified directly against live production data (2026-07-23): that canonical name has
**zero** rows today. The actual price-bearing rows use free-text, human-written names instead —
`Average Pharmacy Price 2025` (3 rows), `Average Pharmacy Price Q1 2026` (1 row), and
`Average Wholesale Flower Price 2025` (1 row), 5 rows total, all with `source_name` and `source_date`
populated. (A 6th `ilike '%price%'` match, `export_price_low_thc_resin_switzerland_2024`, is a
resin-export price, not a retail/wholesale flower benchmark — exclude it from this cross-check by
also requiring the metric name to mention "Pharmacy" or "Wholesale Flower", not just "price".)
So: **keep the `ilike` matching approach** — matching on the documented canonical name would return
nothing. This is a real data-quality gap (free-text drift from the documented vocabulary) worth its
own follow-up to standardize price-metric naming upstream, but that's a separate task from this
spec; re-verify this list against live data before implementing, since ingestion may have changed it.

There is no reliable product/tier match between the two — `market_metrics`' price rows are one
generic figure per country, not per product/tier. So the matching key is **country only**: if any
`market_metrics` price-ish row exists for a `PRICE_BENCHMARKS` entry's country with `source_date`
newer than the quarter implied by `updatedQ`, surface it as a cross-check, not a per-field match.

## Implementation

1. **New query function** in `lib/dashboard/dashboardLiveData.ts` (or a new
   `lib/dashboard/priceCrossCheck.ts` if keeping the existing file's scope tight is preferred):

   ```ts
   export type PriceCrossCheck = {
     countryIso2: string
     metricName: string
     metricValue: number
     metricUnit: string
     sourceName: string | null   // market_metrics.source_name is a nullable column
     sourceDate: string | null   // market_metrics.source_date is a nullable column
   }

   export async function getPriceCrossChecks(countryIsos: string[]): Promise<Record<string, PriceCrossCheck[]>> {
     // .from('market_metrics').select(...).in('country_iso2', countryIsos)
     //   .or(`metric_name.ilike.%pharmacy price%,metric_name.ilike.%wholesale flower price%`)
     // group results by country_iso2 in the return value
     // (narrower than a bare '%price%' match — excludes non-benchmark price rows like
     // export_price_low_thc_resin_switzerland_2024; re-check this pattern against live data
     // before shipping, since new metric_name values get added outside this migration)
   }
   ```

   Call this once with the distinct set of countries present in `PRICE_BENCHMARKS`, not per-card —
   avoid an N+1 query pattern given there could be 100+ cards rendered at once.

2. **Parse `updatedQ`** (`"Q2 2026"` → a comparable date, e.g. end of that quarter) to compare
   against `source_date`. A small utility function, not a new dependency. Since `source_date` is
   nullable, **exclude rows where it's null before this comparison** — a row with no date can't be
   shown to be "newer," so don't surface it as a cross-check at all rather than treating null as
   either older or newer.

3. **UI**: on each price benchmark card, if a cross-check exists and is newer, add a small
   secondary-style badge or icon (not a competing headline number — the curated min/max range stays
   primary) with a tooltip showing the `market_metrics` figure, its source, and date. `sourceName`
   is nullable — fall back to a generic label (e.g. "Harbourview market data") in the tooltip when
   it's null rather than rendering a blank/undefined source. Follow `DESIGN_SYSTEM.md` for the exact
   visual treatment; this spec intentionally doesn't prescribe colors/spacing.

4. **No write path needed** — this is read-only, unlike the corridor feature's submission form.

## Explicitly out of scope for this task

- Building a proper structured live pricing table (would be a much larger effort: real ingestion,
  consistent units, product/tier granularity) — that's a separate, bigger decision for Tyler, not
  bundled into this.
- Touching any of the other six confirmed-static panels (banking, insurance, logistics, job board,
  industry events, landed cost) — each needs its own scoping decision per the plan doc, not assumed
  to follow this same pattern.

## QA (per `PR_REVIEW_CHECKLIST.md`'s UI PR gate)

The list below is the gate for the **future PR that implements this spec** (real UI code touching
`CommandCentre.tsx`/`MobileCommandCentre.tsx`). It does not apply to *this* PR, which only adds this
spec document. This PR's own merge gate is the lighter docs-only tier per `AGENTS.md`: `npm run
lint:docs` (not defined in `package.json` as of this writing — skip if still absent) and `npm run
test -- --passWithNoTests`, with both commands' output quoted in `docs/control/EVIDENCE_LOG.md`
before merge.

- `DESIGN_SYSTEM.md` followed
- Mobile and desktop behavior both checked (this dashboard has `MobileCommandCentre.tsx` as a
  separate component — confirm whether this card type is shared or duplicated there before assuming
  one change covers both)
- No fake live data or unsupported market claims — the cross-check must be clearly labeled as a
  secondary/lower-confidence figure, never presented as replacing or outranking the curated range
- `npm run lint`, `typecheck`, `test`, `build` all run and output quoted in the PR body
- `docs/control/EVIDENCE_LOG.md` entry added before merge, per Merge Discipline
