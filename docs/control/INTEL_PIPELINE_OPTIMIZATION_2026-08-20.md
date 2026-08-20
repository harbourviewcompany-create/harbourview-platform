# Intelligence Pipeline Optimization — 2026-08-20

**Status:** Implementation PR (migration + control). Crons still operator-gated.
**Migration:** `supabase/migrations/20260820130000_hv_pipeline_optimization.sql`
**Registry impact:** New tables `hv_signal_review_queue`, `hv_pipeline_stage_log`; function replacements for classify dispatch, dedup, promote, ticks. No public route / DTO change.

## What shipped in this PR

1. **Pre-filter** `hv_prefilter_signal(headline, summary, url)` — rejects empty/nav/excluded-domain/off-topic before LLM classify.
2. **Lower dispatch limits** in `hv_pipeline_tick` (translate 20, classify 40, embed 40, entities 20) for Micro sustainability.
3. **Promote confidence floor default 0.80** (was effectively lower). Rows 0.50–0.80 with `quality_label=signal` go to **`hv_signal_review_queue`** instead of silent drop.
4. **Incremental-leaning dedup** — only unassigned / recent rows in a 90-day window; ranks by `quality_confidence` not legacy `score`.
5. **HNSW index** on `signals.embedding_1024` (best-effort).
6. **Stage log** `hv_pipeline_stage_log` for tick/promote/dedup metrics.
7. **Eval helper** `hv_eval_gate_ok()` — reads scoring view when present; fail-open if missing.
8. **Still no cron enable** — must use `INTEL_CRON_REENABLE_RUNBOOK.md` after apply.

## Operator apply order

1. Review this PR + migration.
2. Apply migration to production Supabase (ledger reconcile after).
3. Confirm DB healthy.
4. Run staggered re-enable from `INTEL_CRON_REENABLE_RUNBOOK.md`:
   - `hv-quality-pipeline` → `10,40 * * * *`
   - `hv-quality-promote` → `20 * * * *`
5. Watch `hv_pipeline_stage_log` and latency query from the runbook.
6. Review pending rows in `hv_signal_review_queue`.

## Safety invariants preserved

- `hv_promote_signals` only flips `reviewed false → true`.
- Never touches `reviewed_by LIKE 'human:%'`.
- Excluded domains still blocked.
- No public exposure of new tables (RLS + revoke from anon/authenticated).

## Follow-ups (not in this PR)

- Wire `hv_eval_gate_ok()` as a hard block inside promote once eval metrics are continuously produced.
- Full edge-worker conductor (retire remaining pg_net shadow paths).
- Entity relationship edges (not just nodes).
- Cost hard-cap table + alerting webhook.
