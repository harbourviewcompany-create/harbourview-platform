# P0–P2 Canonical Production Apply Runbook (2026-08-21)

**Target:** Supabase `zvxdgdkukjrrwamdpqrg`  
**Status:** Canonical corrective path. `20260820180000_p0_p2_pipeline_optimization.sql` is superseded/removed and must not be applied.

## Canonical migration order

1. `20260820130000_hv_pipeline_optimization.sql`
2. `20260820131000_hv_review_queue_resolve.sql`
3. `20260821100000_p0_p2_canonical_finish.sql`

The first two migrations are the repaired PR #1598 controls. The third supplies the hard 0.80 floor, aggregate 8,000-unit exact dispatch ceiling, FORCE RLS/ACL completion and read-only gate snapshot. None of the three mutates `pg_cron`.

## Preserved authorities

- Classifier dispatch keeps select-before-budget accounting, five-attempt retry retirement and unresolved manual-review exclusion.
- Translated `title_en` / `summary_en` values are evaluated by the pre-filter and dispatched; every decision has an explicit persisted disposition.
- `hv_dedup_assign` remains the current HNSW KNN implementation with `pg_catalog, public, extensions` search path.
- `idx_signals_embedding_1024_hnsw` remains the sole canonical HNSW index.
- `hv_pipeline_tick` remains the current implementation, including unharvested `hv_embed_jobs` exclusion.
- `classifier_validation.gate_passed = true` remains the mechanical publication gate.
- Review approval/rejection remains authoritative through the locked service-role RPCs.

## 1. Pre-apply live-state capture

Capture the migration ledger before any write:

```sql
select version
from supabase_migrations.schema_migrations
where version in ('20260820130000','20260820131000','20260820180000','20260821100000')
order by version;
```

Expected before this corrective release: none of those four versions are recorded. If `20260820180000` is present, stop; do not continue this runbook until the live body and ledger are reconciled.

Capture only the two relevant cron jobs by exact jobname:

```sql
select jobid, jobname, schedule, active, md5(command) as command_hash
from cron.job
where jobname in ('hv-quality-pipeline','hv-quality-promote')
order by jobname;
```

Observed on production 2026-08-21 before the corrective apply:

| jobname | schedule | active |
|---|---|---|
| `hv-quality-pipeline` | `*/30 * * * *` | true |
| `hv-quality-promote` | `10,40 * * * *` | true |

Require exactly one row for each jobname. A missing or duplicate name is a hard stop. Preserve the command hashes; never rewrite cron command bodies as part of this release.

Also capture `pg_get_functiondef` / `proconfig` for:

- `hv_classify_corpus_dispatch(integer,integer)`
- `hv_classify_corpus_harvest()`
- `hv_consume_dispatch_budget(text,integer)`
- `hv_dedup_assign(double precision,integer)`
- `hv_pipeline_tick()`
- `hv_promote_signals(numeric)`

Capture the current `hv_dispatch_budget` rows and current HNSW indexes on `signals.embedding_1024`.

## 2. Pause only the two quality crons, by jobname

Resolve the live job ID from the exact name at execution time; never hard-code historical job IDs.

```sql
select cron.alter_job(job_id := j.jobid, active := false)
from cron.job j
where j.jobname = 'hv-quality-pipeline';

select cron.alter_job(job_id := j.jobid, active := false)
from cron.job j
where j.jobname = 'hv-quality-promote';
```

Re-query both names and require `active = false` before applying any migration.

## 3. Apply only the canonical migrations

Apply the three canonical files in the order listed above under their exact numeric versions. Do not apply, repair into the ledger, or execute the removed `20260820180000` body.

After each migration, verify the exact version appears once in `supabase_migrations.schema_migrations`. After all three, `20260820180000` must still be absent.

## 4. Structural verification while crons remain paused

Required evidence:

- `hv_classify_corpus_dispatch` still contains five-attempt retirement, unresolved manual-review exclusion, translated text selection, persisted pre-filter dispositions and the broad August search path including `extensions`.
- `hv_dedup_assign` still contains the HNSW KNN `<=>` ordering/limit and `pg_catalog, public, extensions` search path.
- `hv_pipeline_tick` still excludes signals with an unharvested `hv_embed_jobs` row.
- `hv_promote_signals` has default 0.80, clamps callers to `>= 0.80`, requires `classifier_validation.gate_passed = true`, and blocks pending/rejected/skipped review rows.
- `hv_review_queue_approve` and `hv_review_queue_reject` lock the pending queue row before mutating `signals`.
- `hv_signal_review_queue`, `hv_classify_prefilter_dispositions`, `hv_pipeline_stage_log` and `hv_pipeline_cost_budget` have RLS and FORCE RLS enabled; `anon`/`authenticated` have no table access.
- Only `idx_signals_embedding_1024_hnsw` is present as the canonical HNSW index; the duplicate `signals_embedding_1024_hnsw_idx` is absent.

Run:

```sql
select public.hv_eval_gate_snapshot();
```

The snapshot is observability only. It must report `promote_floor = 0.80`, aggregate daily cap `8000`, and `publication_gate = classifier_validation.gate_passed`. It does not replace the classifier gate.

## 5. Budget behavior proof

The existing per-stage ceilings remain lower-level safety controls. `hv_consume_dispatch_budget` now locks both the addressed stage row and the aggregate day row, admits only the intersection of measured requested work, stage remaining and global remaining, and increments both by exactly the admitted amount.

Verify current rows without changing them:

```sql
select stage, budget_date, calls_used, daily_ceiling
from public.hv_dispatch_budget
order by stage;

select budget_date, dispatch_units, hard_cap, updated_at
from public.hv_pipeline_cost_budget
where budget_date = current_date;
```

Do not fabricate load solely to consume production budget. The first real smoke tick supplies the production accounting proof.

## 6. Restore the approved staggered cadence one job at a time

Approved post-release cadence:

| jobname | schedule |
|---|---|
| `hv-quality-pipeline` | `10,40 * * * *` |
| `hv-quality-promote` | `20 * * * *` |

First restore only the pipeline job:

```sql
select cron.alter_job(
  job_id := j.jobid,
  schedule := '10,40 * * * *',
  active := true
)
from cron.job j
where j.jobname = 'hv-quality-pipeline';
```

Confirm the row has the exact schedule and is active. Observe at least one successful execution in `cron.job_run_details` and verify no long-running overlap, budget overrun or unexpected dispatch error before enabling promotion.

Then restore only the promotion job:

```sql
select cron.alter_job(
  job_id := j.jobid,
  schedule := '20 * * * *',
  active := true
)
from cron.job j
where j.jobname = 'hv-quality-promote';
```

Again require one successful execution. If either job fails its first observed execution, keep the other not-yet-restored job paused and investigate before proceeding.

## 7. Post-restore evidence

Record:

- corrective PR head and merge SHA;
- exact applied migration versions;
- ledger proof that `20260820180000` is absent;
- before/after function hashes or bodies for preservation contracts;
- HNSW index definition;
- RLS/FORCE RLS and ACL matrix;
- `hv_eval_gate_snapshot()` output;
- before/after stage and aggregate budget counters from a real smoke tick;
- both cron rows with final schedules/active state;
- one successful `cron.job_run_details` row for each restored quality cron.

## Stop conditions

Stop with HOLD if the removed migration is already recorded in production, a canonical migration fails, a preservation function changes unexpectedly, browser access appears on an internal table/RPC, the classifier gate fails open, the HNSW authority changes, the aggregate budget can exceed 8,000, or the first restored cron fails its smoke execution.
