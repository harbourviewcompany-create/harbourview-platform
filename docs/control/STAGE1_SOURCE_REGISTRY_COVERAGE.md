# Stage 1 — Unified Source Registry: Coverage-Gap Report

Per `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` Stage 1. Decision: **extend the existing
`source_registry` in place** (it already had 1,471 rows + language/tier/cadence) rather
than create a new `intel_sources` table — creating a third table would have spawned the
parallel estate the spec is trying to kill.

## Reconciliation (the two estates)
| estate | source | count |
|---|---|---|
| Intelligence | `source_registry` (pre-existing, live) | 1,487 |
| Marketplace | `lib/scrapers/sources.ts` (`scraperSources`) | 311 raw entries |

- 311 raw marketplace entries → **260 distinct URLs** (51 were **duplicate entries in
  `sources.ts`** — e.g. `spannabis-barcelona` appears 5×; a data-quality finding).
- Of the 260, **20 already existed** in `source_registry` as intelligence sources
  (estate overlap) → skipped by normalized-URL dedup.
- **240 new marketplace rows imported.** Registry total: 1,487 → **1,727**.

## Safety (Stage 1 = no pipeline behavior change)
The crawler `source-engine-fetch` selects only `is_active=true AND relevance_status='active'`.
All 240 marketplace rows were imported **dormant** (`is_active=false`,
`relevance_status='needs_review'`, `crawl_allowed=false`). Verified: **0** marketplace
rows are active/crawlable. The pipeline is untouched.

## Completeness (Stage 1 verify criteria)
- Every registry row now has `content_type`: **0 nulls**. (existing: regulatory 627 /
  market 449 / story 408 / research 3; marketplace: equipment + market.)
- Every active/crawled source has a `language`: **0 nulls**.

## Coverage gaps
- **Active crawled sources: 1,180**, across **22 languages** and **204 countries**.
- **The language gap (the spec's core thesis):** of 1,180 active sources, **1,148 (97%)
  are English**. Non-English active sources total **32** — es 7, fr 3, de 2, uk 2, pt 2,
  and ro/nl/id/ar/no/th at 1 each. This is why the raw signal pool is ~98% English and
  directly scopes **Stage 6** (language expansion): the firehose is English; adding
  non-English sources is where multilingual coverage will come from.
- Marketplace rows are all `language='en'` and dormant; they do not yet contribute to
  routing (that is Stage 6/7).

## Owner decisions still open (reversible)
- `content_type` backfill of two ambiguous buckets: `reference` (59) → regulatory, and
  `market_research` (1) → market. Either could be `research`. Flip on request.
- Marketplace `content_type` is derived from `sources.ts` `category`; a few sources are
  mis-categorized in the source file itself (e.g. news RSS tagged `new_products`). Since
  these rows are dormant and unrouted, this is refinable later, not load-bearing now.

## Not done (deliberately — later stages)
No reads were rewired. `source-engine-fetch` and the orchestrator still read
`source_registry` exactly as before. Routing by `content_type` is Stage 7.
