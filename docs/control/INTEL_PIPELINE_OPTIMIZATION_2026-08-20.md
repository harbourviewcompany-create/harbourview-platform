# Intelligence Pipeline Optimization — 2026-08-20

**Status:** Docs-only control plan. Awaiting operator (Tyler) sign-off before any cron, migration, or edge-function change.
**Owner:** Agent session (Grok) at operator request.
**Scope:** Optimize Pipeline B (`hv_*`) for real intelligence + full automation without repeating the 2026-07-21 Nano-tier outage.

## Registry impact

- Control-document registration only.
- No change to Vercel mapping, Supabase project ref, public routes, or HOLD gates.
- Does **not** authorize live `cron.alter_job`, migrations, or edge deploys.

## Current state (verified from repo docs)

- Canonical pipeline = Pipeline B (`hv_translate_*` → `hv_classify_*` → `hv_embed_*` → `hv_entities_*` → `hv_dedup_assign` → `hv_promote_signals`).
- Orchestrators: `hv_pipeline_tick`, `hv_quality_promote_tick`.
- Crons historically `*/2` and `*/10`; currently expected disabled or throttled per `INTEL_CRON_REENABLE_RUNBOOK.md`.
- Promotion gate: `quality_label='signal'` + representative; confidence largely uncalibrated.
- Eval set exists (`intel_eval_set`, 202 rows) but is not wired into promote path.
- pg_net dispatch/harvest is the active path; proper edge workers (`hv-classify`, `hv-embed-worker`) exist but are not the sole conductor.

## Optimization goals

1. Single conductor (retire parallel/shadow paths).
2. Measured quality gate before any auto-promote.
3. Micro-sustainable cadence (no `*/2`).
4. Incremental dedup + HNSW.
5. Cost cap + stage observability.
6. Cheap pre-filter at ingest.
7. Medium-confidence human review queue (no silent drop).
8. Full automation once gates are green.

## Safe first action (operator apply only)

Follow `docs/control/INTEL_CRON_REENABLE_RUNBOOK.md` exactly:

| job | target schedule |
|-----|-----------------|
| hv-quality-pipeline (`hv_pipeline_tick`) | `10,40 * * * *` |
| hv-quality-promote (`hv_quality_promote_tick`) | `20 * * * *` |

Re-enable one-at-a-time; abort on latency creep. Record evidence in `EVIDENCE_LOG.md`.

## Implementation sequence (post sign-off)

### Phase A — Conductor + safety (no volume increase)
- Drive classify/embed from existing edge workers; stop new pg_net shadow work.
- Wire `intel_eval_set` precision/recall gate into promote (require ≥0.90 precision, ≥0.70 recall on `signal` before raising volume).
- Keep `hv_promote_signals` promote-only, never touch `reviewed_by LIKE 'human:%'`.

### Phase B — Efficiency
- Add HNSW (or ivfflat) on `embedding_1024`; make `hv_dedup_assign` incremental (new rows only).
- Cheap pre-filter at ingest: min length, language detect, excluded domain list, basic boilerplate heuristics before LLM.
- Batch LLM calls; hard daily cost/request cap; alert on stage latency and stranded jobs.

### Phase C — Product intelligence
- Medium-confidence queue (borderline rows → human review surface, not silent drop).
- Relationship extraction (entity↔entity edges with provenance) after node extraction is stable.
- Interpretation layer: regulation → operator → trade-flow “so what” (product surface).

### Phase D — Full automation
- Once A–C green on Micro: tighten cadence only within measured headroom.
- Continuous backlog drain + fresh feed without operator intervention.
- Feedback loop (engagement + prediction resolution) for calibrated confidence.

## Explicit non-goals for this PR

- No migration files that alter live functions.
- No `cron.schedule` / `cron.alter_job` execution.
- No secret or compute upgrade.
- No public DTO or leakage-path changes.

## Next operator step

1. Review this plan.
2. Apply re-enable runbook if DB healthy.
3. Approve Phase A implementation PR(s) separately.

## References

- `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md`
- `docs/QUALITY_PIPELINE_HANDOFF.md`
- `docs/control/INTEL_CRON_REENABLE_RUNBOOK.md`
- `docs/control/STAGE3_PROMOTION.md`
- `docs/control/PROJECT_REGISTRY.md`
