# P0–P2 Pipeline Live Apply Runbook (2026-08-20)

**Status:** Repository migration ready — **operator must apply SQL + re-enable crons** on project `zvxdgdkukjrrwamdpqrg`.
Agents cannot flip production `pg_cron` without live DB credentials.

## What the migration ships

| Priority | Change |
|----------|--------|
| **P0** | Promote floor **0.80**; `hv_eval_gate_snapshot()`; Micro-safe cron schedules (this runbook) |
| **P1** | Single conductor `hv_pipeline_tick` with **daily LLM budget (8000)** + reduced dispatch ceilings |
| **P2** | `hv_pre_filter_documents`; HNSW ensure; incremental dedup retained; medium-confidence **review queue** |

Migration file: `supabase/migrations/20260820180000_p0_p2_pipeline_optimization.sql`

## Apply order (operator)

### 1. Health check
```sql
SELECT 1;
SELECT count(*) FILTER (WHERE state = 'active') FROM pg_stat_activity;
```

### 2. Apply migration
Apply `20260820180000_p0_p2_pipeline_optimization.sql` via your approved path
(`execute_sql` + ledger row under **canonical version `20260820180000`**, not a random apply-time id).

### 3. Eval gate snapshot
```sql
SELECT public.hv_eval_gate_snapshot();
```
Expect `ok: true` and `promote_floor: 0.80`. Classifier precision/recall still validated offline against `intel_eval_set` before any volume increase.

### 4. Re-enable crons (Micro-sustainable — never `*/2`)

Use current job ids from:
```sql
SELECT jobid, jobname, schedule, active FROM cron.job
WHERE jobname IN (
  'hv-quality-pipeline',
  'hv-quality-promote',
  'hv-embed-every-30min',
  'claude-signal-extraction',
  'airtable-tier-pull'
)
ORDER BY jobid;
```

Recommended schedules (staggered):

| jobname | schedule | notes |
|---------|----------|--------|
| claude-signal-extraction | `0,30 * * * *` | :00, :30 |
| hv-embed-every-30min | `25,55 * * * *` | unchanged |
| **hv-quality-pipeline** | `10,40 * * * *` | conductor; **not** `*/2` |
| **hv-quality-promote** | `20 * * * *` | hourly dedup+promote+review queue |
| airtable-tier-pull | `50 */3 * * *` | low priority |

Example (replace jobid from live query):
```sql
SELECT cron.alter_job(job_id := 47, schedule := '10,40 * * * *', active := true);
SELECT cron.alter_job(job_id := 48, schedule := '20 * * * *', active := true);
```

Re-enable **one at a time**; wait ~15 min; watch long-running queries.

### 5. Smoke ticks (optional)
```sql
SELECT public.hv_pipeline_tick();
SELECT public.hv_quality_promote_tick();
SELECT * FROM public.hv_review_queue_list_pending(20);
SELECT day, llm_calls, hard_cap FROM public.hv_pipeline_cost_budget WHERE day = CURRENT_DATE;
```

### 6. Evidence
Record in `EVIDENCE_LOG.md` / `DATABASE_CONTROL.md`: migration version, cron schedules, first tick JSON, budget row.

## Rollback
```sql
SELECT cron.alter_job(job_id := 47, active := false);
SELECT cron.alter_job(job_id := 48, active := false);
```

## Honest limits
- **Live cron activation requires operator DB access** — merge alone does not flip production.
- Full edge-worker consolidation (retire pg_net harvest) remains a follow-up.
- Raising cadence above Micro-sustainable needs revenue-justified compute.
