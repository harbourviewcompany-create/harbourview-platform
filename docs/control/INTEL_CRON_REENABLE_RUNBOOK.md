# Intel Pipeline Cron Re-Enable Runbook (2026-07-21 incident follow-through)

**Status:** PREPARED — awaiting operator apply-time sign-off. Nothing here is applied yet.
**Context:** the 2026-07-21 Data API outage was caused by the intel pipeline's tick/dispatch
crons overwhelming a burstable Micro compute. 5 jobs were disabled live to recover
(`EVIDENCE_LOG.md` 2026-07-21 outage entry; `DATABASE_CONTROL.md` cron load-shed entry).
The pipeline itself is healthy and spec-aligned (classifier-gated promotion, dedup, guards
`reviewed_by LIKE 'human:%'`, feed avg-confidence 0.86) — this is an **availability**
re-cadence, not a correctness fix. Verified read-only, 2026-07-21.

## Hard precondition (do not skip)

- [ ] **Compute upgraded Micro → Small** (`FINAL_PRODUCTION_READINESS_AUDIT.md` Gate 15).
      Do NOT re-enable jobs 47 or 48 on Micro — that reproduces the outage. Jobs 14/13/26 are
      30-min/low-cost and *could* run on Micro, but re-enable everything only after Small so
      the box has headroom while the 7,491-row backlog drains.

## Target cadences (re-cadence at re-enable time, do not restore `*/2`)

| jobid | jobname | old | **new** | rationale |
|---|---|---|---|---|
| 14 | claude-signal-extraction | `*/30 * * * *` | `*/30 * * * *` (keep) | already 30-min, not a tipping point; extraction/bounded(25) |
| 13 | hv-embed-every-30min | `25,55 * * * *` | `25,55 * * * *` (keep) | embed worker, 30-min cadence, bounded |
| 47 | hv-quality-pipeline (`hv_pipeline_tick`) | `*/2 * * * *` | **`*/15 * * * *`** | #1 CPU consumer (translate+classify+embed+entities dispatch, external API calls); 4×/hr is ample to drain backlog without pegging. Never `*/2`. |
| 48 | hv-quality-promote (`hv_quality_promote_tick`) | `*/10 * * * *` | **`*/30 * * * *`** | dedup(0.90,400)+promote, 41 s/call; 30-min keeps the feed fresh without back-to-back heavy runs |
| 26 | airtable-tier-pull | `*/2 * * * *` | **`*/30 * * * *`** | ~0 CPU but was failing every 2 min; 30-min is plenty for a tier pull |

## Ordered re-enable (one at a time, verify between each)

Run each step, then wait ~10–15 min and check `pg_stat_activity` (no >5 s active pileup),
DB CPU (Reports → Database → CPU, well under ceiling), and `/rest/v1` health (200s) BEFORE
the next. Abort/disable and reassess if any step degrades latency.

1. `SELECT cron.alter_job(job_id := 14, schedule := '*/30 * * * *', active := true);`
2. `SELECT cron.alter_job(job_id := 13, schedule := '25,55 * * * *', active := true);`
3. `SELECT cron.alter_job(job_id := 47, schedule := '*/15 * * * *', active := true);`  ← heaviest; watch closely
4. `SELECT cron.alter_job(job_id := 48, schedule := '*/30 * * * *', active := true);`
5. `SELECT cron.alter_job(job_id := 26, schedule := '*/30 * * * *', active := true);`

Verification query between steps:
```sql
SELECT clock_timestamp() AS t,
  (SELECT count(*) FROM pg_stat_activity WHERE state='active' AND now()-query_start > interval '5 seconds' AND pid<>pg_backend_pid()) AS long_running,
  (SELECT count(*) FROM pg_stat_activity WHERE state='active') AS active_now;
```

## Post re-enable — confirm the pipeline is working, not just running

- Feed still healthy: `SELECT count(*) FILTER (WHERE reviewed), count(*) FILTER (WHERE reviewed AND date > now()-interval '30 days') FROM public.signals;` (fresh count should climb again; was 1,197/1,234 pre-freeze).
- Backlog draining: `SELECT count(*) FROM public.signals WHERE NOT reviewed;` (was 7,491; should trend down).
- No human rows touched: `SELECT count(*) FROM public.signals WHERE reviewed_by LIKE 'human:%';` (promotion guards these; must not change unexpectedly).

## Rollback

Disable any job that degrades the box: `SELECT cron.alter_job(job_id := N, active := false);`
(Reversible; same lever used during the incident.)

## Separate, non-blocking follow-ups (NOT part of this runbook)

- **Promotion confidence floor τ:** `hv_promote_signals` is called with `0.0`. Harmless today
  only because the `quality_label='signal'` gate carries min-confidence 0.80 — set τ to the
  eval-set-tuned bar (spec §10 proposes p≥0.9; 202-row `intel_eval_set` exists). Robustness, not urgent.
- **Stage 5 orchestrator consolidation** (spec §8): the ~24 racing crons are the structural
  cause; consolidating to one conductor is the durable fix. This runbook is the interim measure.
- **Human-review queue:** `pipeline_manual_review_queue` exists but `human_reviewed = 0`;
  medium-confidence triage (spec §6.3) isn't feeding a person.

## Approval

- [ ] Operator (Tyler) sign-off to apply, AFTER the compute upgrade. Record apply evidence in
      `EVIDENCE_LOG.md` and update `DATABASE_CONTROL.md` (cron state → re-enabled).
