# Intel Pipeline Cron Re-Enable Runbook (2026-07-21 incident follow-through)

**Status:** PREPARED — awaiting operator apply-time sign-off. Nothing here is applied yet.
**Compute decision (2026-07-21):** **no paid compute upgrade** until the platform is revenue-generating.
This runbook therefore targets a **Micro-sustainable** re-enable — low duty cycle + staggered
cadences so a burstable instance's CPU stays healthy — NOT a Micro→Small upgrade.

**Context:** the 2026-07-21 Data API outage was verified CPU starvation under pipeline load
(`EVIDENCE_LOG.md` outage entry; `DATABASE_CONTROL.md` cron load-shed entry). 5 jobs were disabled
live to recover. The pipeline itself is healthy and spec-aligned (classifier-gated promotion,
dedup, guards `reviewed_by LIKE 'human:%'`, feed avg-confidence 0.86) — this is an **availability
re-cadence**, not a correctness fix. Verified read-only, 2026-07-21.

## Why Micro can carry this (and what actually broke it)

The outage was not "Micro is too small" — it was **duty cycle**: ~24 uncoordinated jobs, two firing
`*/2`, kept a burstable instance under continuous load until it throttled. On a burstable box,
infrequent + staggered heavy ticks let CPU recover between runs. So the strategy is: **≥30-min
cadence on every heavy job, staggered so no two heavy jobs fire in the same minute, re-enabled one
at a time while watching for latency creep.** No upgrade required.

## Precondition

- [ ] Confirm the DB is currently healthy (queries instant, `/rest/v1` serving 200s) before starting.
- [ ] Ideally pair with the free resilience win first: **cache the read path** (globe/country/briefing
      via ISR/CDN) so any future throttle is invisible to users. Not a hard blocker for re-enable, but
      recommended before adding load back.

## Target cadences (Micro-sustainable, staggered — do NOT restore `*/2`)

| jobid | jobname | old | **new** | minutes | rationale |
|---|---|---|---|---|---|
| 14 | claude-signal-extraction | `*/30 * * * *` | `0,30 * * * *` | :00, :30 | extraction, bounded(25); 30-min |
| 13 | hv-embed-every-30min | `25,55 * * * *` | `25,55 * * * *` | :25, :55 | embed worker; unchanged 30-min |
| 47 | hv-quality-pipeline (`hv_pipeline_tick`) | `*/2 * * * *` | `10,40 * * * *` | :10, :40 | #1 CPU consumer (translate+classify+embed+entities dispatch); 30-min, staggered. **Never `*/2`.** |
| 48 | hv-quality-promote (`hv_quality_promote_tick`) | `*/10 * * * *` | `20 * * * *` | :20 (hourly) | dedup(0.90,400)+promote, 41 s/call; heaviest per run → hourly |
| 26 | airtable-tier-pull | `*/2 * * * *` | `50 */3 * * *` | :50 every 3 h | low-priority tier pull; every 3 h is plenty |

No two heavy jobs (`14/47/48`) share a firing minute.

## Ordered re-enable (one at a time, verify between each)

Run each step, then wait ~15 min and check that latency is **not** creeping up (that is the early
warning of credit drain on a burstable box). Only proceed if healthy. Abort/disable and reassess if
any step degrades latency or returns `503`s.

1. `SELECT cron.alter_job(job_id := 14, schedule := '0,30 * * * *', active := true);`
2. `SELECT cron.alter_job(job_id := 13, schedule := '25,55 * * * *', active := true);`
3. `SELECT cron.alter_job(job_id := 47, schedule := '10,40 * * * *', active := true);`  ← heaviest; watch closely
4. `SELECT cron.alter_job(job_id := 48, schedule := '20 * * * *', active := true);`
5. `SELECT cron.alter_job(job_id := 26, schedule := '50 */3 * * *', active := true);`

Verification query between steps (latency/pileup early-warning — no CPU-credit metric is exposed to SQL, so latency creep is the proxy):

```sql
SELECT clock_timestamp() AS t,
  (SELECT count(*) FROM pg_stat_activity WHERE state='active' AND now()-query_start > interval '5 seconds' AND pid<>pg_backend_pid()) AS long_running,
  (SELECT count(*) FROM pg_stat_activity WHERE state='active') AS active_now;
```

If `long_running` climbs above ~2–3 or a plain `SELECT 1` starts taking seconds, stop and disable the
last job re-enabled.

## Post re-enable — confirm it works, not just runs

- Feed still healthy: `SELECT count(*) FILTER (WHERE reviewed), count(*) FILTER (WHERE reviewed AND date > now()-interval '30 days') FROM public.signals;` (fresh count should climb again; was 1,197/1,234 pre-freeze).
- Backlog draining (slower than on Small — expected tradeoff): `SELECT count(*) FROM public.signals WHERE NOT reviewed;` (was 7,491; should trend down over days).
- No human rows touched: `SELECT count(*) FROM public.signals WHERE reviewed_by LIKE 'human:%';` (promotion guards these; must not change unexpectedly).

## Honest tradeoff

On Micro at these cadences the feed refreshes less often and the 7,491-row backlog drains over days,
not hours. Acceptable pre-revenue. The durable fix without spend is **Stage 5 orchestrator
consolidation** (spec §8) — one conductor instead of ~24 racing crons — which frees enough headroom
to tighten cadences later. Revisit a compute upgrade only when revenue justifies it.

## Rollback

Disable any job that degrades the box: `SELECT cron.alter_job(job_id := N, active := false);`
(Reversible; same lever used during the incident.)

## Separate, non-blocking follow-ups (NOT part of this runbook)

- **Read-path caching** (free) — highest-value resilience: makes a throttle invisible to users.
- **Trim realtime** — drop `signals`/`market_metrics` from the `supabase_realtime` publication if
  nothing live-subscribes (~14% CPU back, free).
- **Free alerting** on `/rest/v1` 5xx so the next incident is caught in minutes, not by phone.
- **Promotion confidence floor τ:** `hv_promote_signals` is called with `0.0`. Harmless today only
  because the `quality_label='signal'` gate carries min-confidence 0.80 — set τ to the eval-set-tuned
  bar (spec §10 proposes p≥0.9; 202-row `intel_eval_set` exists). Robustness, not urgent.
- **Stage 5 orchestrator consolidation** (spec §8): the durable, no-spend structural fix.

## Approval

- [ ] Operator (Tyler) sign-off to apply. Record apply evidence in `EVIDENCE_LOG.md` and update
      `DATABASE_CONTROL.md` (cron state → re-enabled) once applied.
