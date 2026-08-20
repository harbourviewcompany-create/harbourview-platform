# Intel Pipeline Optimization — Apply Checklist (2026-08-20)

**PR:** #1598  
**Migrations:**
1. `20260820130000_hv_pipeline_optimization.sql`
2. `20260820131000_hv_review_queue_resolve.sql`

## Pre-apply

- [ ] PR reviewed
- [ ] DB healthy (no long-running queries, `/rest/v1` 200s)
- [ ] Confirm Nano/Micro compute posture still in force (no upgrade assumed)

## Apply

- [ ] Apply both migrations to production `zvxdgdkukjrrwamdpqrg`
- [ ] Confirm tables exist: `hv_signal_review_queue`, `hv_pipeline_stage_log`
- [ ] Confirm functions exist: `hv_prefilter_signal`, `hv_review_queue_approve`, `hv_review_queue_reject`, `hv_review_queue_list_pending`
- [ ] Reconcile migration ledger (`schema_migrations`)

## Re-enable crons (only after healthy apply)

Follow `INTEL_CRON_REENABLE_RUNBOOK.md` one job at a time:

- [ ] `hv-quality-pipeline` → `10,40 * * * *`
- [ ] `hv-quality-promote` → `20 * * * *`
- [ ] Latency check between each step

## Post-enable verification

```sql
-- Stage activity
SELECT stage, metrics, created_at
FROM public.hv_pipeline_stage_log
ORDER BY created_at DESC
LIMIT 20;

-- Pending borderline reviews
SELECT * FROM public.hv_review_queue_list_pending(25);

-- Feed health
SELECT
  count(*) FILTER (WHERE reviewed) AS reviewed,
  count(*) FILTER (WHERE reviewed AND reviewed_at > now() - interval '7 days') AS reviewed_7d
FROM public.signals;
```

## Rollback

Disable crons via `cron.alter_job(..., active := false)`.  
Functions are CREATE OR REPLACE; prior definitions can be restored from baseline migration if needed. Tables are additive (safe to leave).
