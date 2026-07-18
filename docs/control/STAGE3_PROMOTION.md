# Stage 3 — Correct Promotion Path

Per `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` Stage 3. Replaces score-driven publishing
with promotion driven by the **validated Stage 2 classifier**.

## What promotion actually is here (verified)
- `promote_snapshot_to_signals()` stages snapshots into `public.signals` with
  `reviewed = false`, using the inverted `score_signal_from_snapshot` for score/lanes.
- The live Intel feed reads `signals?reviewed=eq.true` (`lib/regulatory-signals/public.ts`).
- The entire SOURCE_ENGINE pool is `reviewed = false` — nothing auto-publishes today (the
  old score-based auto-qualifier was removed in cleanup).

So **promotion = deciding which `reviewed=false` rows become `reviewed=true`.** Stage 3
makes that decision from the classifier, not the score.

## Components
- `public.signal_classifications` — classifier output for the live pool (distinct from the
  202-row `intel_eval_predictions`, which is validation-only). Populated by an `hv-classify`
  pool run. Latest row per signal wins.
- `api.promote_classified_signals(p_min_confidence, p_dry_run, p_limit)` — the promoter.

## Two invariants, enforced structurally
1. **Promotion only ever promotes.** The single write is `reviewed false -> true` (guarded
   by `where reviewed = false`, so it's idempotent). No path sets `reviewed=false` or
   deletes. Un-publishing is out of scope by construction.
2. **Validation-gated + dry-run by default.** `p_dry_run` defaults to `true` — the function
   returns the candidate count and writes nothing. A real publish needs an explicit
   `p_dry_run => false`, and is intended to run **only after the classifier clears the
   eval-set bar** (spec §6.2). It is wired to **no cron**.

## Routing
On promote, `top_lane` is refreshed from `content_type`
(regulatory→Regulatory, market→Economic, else Trade), replacing the inverted-score lane.

## How it will run (once unblocked)
1. Deploy Stage 2 `hv-classify` and confirm it clears the gate on the human-labelled eval
   set (`api.intel_eval_scoring` ≥ owner's precision/recall bar).
2. Run the classifier over the live pool → `signal_classifications`.
3. `select * from api.promote_classified_signals(0.70, true);`  — dry run, review the count.
4. `select * from api.promote_classified_signals(0.70, false);` — publish, on your go.

## Status (2026-07-15)
Built as reviewed code; **nothing applied live and nothing deployed**. This is the most
sensitive stage — it writes the live feed's publish flag — so unlike the Stage 0/1 data
changes it is not applied until (a) the classifier is validated and (b) you approve. Even
if applied now it is a no-op (`signal_classifications` is empty and dry-run is the default).

## Owner decisions (spec §10)
- **Promotion confidence threshold** (`p_min_confidence`, default 0.70). Yours to set.

## Rollback
`drop function api.promote_classified_signals(numeric,boolean,int); drop table public.signal_classifications;`
Blast radius: none — not wired, not applied.
