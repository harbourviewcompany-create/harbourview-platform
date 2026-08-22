# P0–P2 Canonical Production Apply Runbook (2026-08-22)

**Target:** Supabase `zvxdgdkukjrrwamdpqrg`  
**Status:** Canonical corrective production path. Production execution is **HOLD** until every pre-write gate in this runbook is green.  
**Scope:** P0–P2 canonical migrations and the two quality cron jobs only. No unrelated migration, cron, application, data rewrite, ledger repair, or production change is authorized by this runbook.

## Canonical migration order

1. `20260820130000_hv_pipeline_optimization.sql`
2. `20260820131000_hv_review_queue_resolve.sql`
3. `20260821100000_p0_p2_canonical_finish.sql`

`20260820180000_p0_p2_pipeline_optimization.sql` from PR #1606 is superseded/removed and must never be executed or repaired into the ledger.

The first two migrations are the repaired PR #1598 controls. The third supplies the hard 0.80 automatic-promotion floor, aggregate 8,000-unit exact dispatch ceiling, FORCE RLS/ACL completion and read-only gate snapshot. None of the three mutates `pg_cron`.

## Preserved authorities

- Classifier dispatch keeps select-before-budget accounting, five-attempt retry retirement and unresolved manual-review exclusion.
- Translated `title_en` / `summary_en` values are evaluated by the pre-filter and dispatched; every decision has an explicit persisted disposition.
- `hv_dedup_assign` remains the current HNSW KNN implementation with `pg_catalog, public, extensions` search path.
- `idx_signals_embedding_1024_hnsw` remains the sole canonical HNSW index.
- `hv_pipeline_tick` remains the current implementation, including unharvested `hv_embed_jobs` exclusion.
- `classifier_validation.gate_passed = true` remains the mechanical publication gate.
- Review approval/rejection remains authoritative through the locked service-role RPCs.

## Hard release invariants

A production GO requires all of the following:

1. The deployment checkout is pinned to an immutable reviewed `main` commit.
2. The three migration files match the reviewed canonical blobs.
3. Full repository ↔ live migration reconciliation is green.
4. The effective remote-pending migration set is **exactly** the canonical P0–P2 set still required by the live resume state; no unrelated migration is pending for this apply.
5. `20260820180000` is absent from the live ledger.
6. Live objects show no unledgered PR #1606 contamination.
7. Both quality cron jobs are uniquely identified, paused, and drained before DDL.
8. Canonical migrations are applied only through migration-aware tooling that records their repository numeric versions; do not use raw `execute_sql`, Dashboard SQL, MCP `apply_migration`, or manual ledger writes as substitutes for this release.
9. Structural, RLS/ACL, function-body, budget and publication-gate proofs pass while crons remain paused.
10. Each cron is restored separately and must pass a fresh, timestamp-scoped semantic smoke before the next job is enabled.
11. A failed first smoke returns both quality jobs to inactive and the release to HOLD.

## 0. Pin the immutable release input

Before touching production, record:

```text
repository: harbourviewcompany-create/harbourview-platform
release_main_sha: <immutable reviewed main SHA>
canonical migration versions:
  20260820130000
  20260820131000
  20260821100000
```

At the time this runbook was hardened, the reviewed canonical migration blobs were:

| migration | Git blob SHA |
|---|---|
| `20260820130000_hv_pipeline_optimization.sql` | `6ae416933e669df5d1f303fd85a91438c66fec26` |
| `20260820131000_hv_review_queue_resolve.sql` | `0c9cf6ebd19801767b305c4fb9a61f1b114f593f` |
| `20260821100000_p0_p2_canonical_finish.sql` | `c262859bfb6b79aa4d9ced469159b3563fbe2a06` |

If any migration blob differs, stop and re-review the changed SQL before production execution. A docs-only change may advance `main`; the canonical migration blobs must remain unchanged unless a new corrective migration review explicitly supersedes this pin.

Use a clean checkout. Record `git rev-parse HEAD` and require no uncommitted migration-file changes.

## 1. Full repository ↔ live migration reconciliation

Do not rely on a four-version query as the migration-drift gate.

Using the pinned checkout and current Supabase CLI, first confirm CLI capabilities with `supabase --version` and `supabase db push --help`. Then link only to project `zvxdgdkukjrrwamdpqrg` and capture:

```text
supabase migration list --linked
supabase db push --linked --dry-run --include-all
```

The dry run is authoritative for this release's apply set.

### Required result

- Every repository migration other than the canonical P0–P2 versions is already represented consistently in live history.
- The dry run proposes **only** the canonical versions that are still missing according to the resume matrix in section 3.
- `20260820180000` is absent locally and remotely.
- No unrelated pending migration appears before, between or after the canonical P0–P2 versions.

If the dry run proposes any unrelated migration, stop with HOLD. Do not apply a larger pending set and do not repair migration history merely to make this release proceed.

Also capture the focused live ledger state:

```sql
select version, name
from supabase_migrations.schema_migrations
where version in (
  '20260820130000',
  '20260820131000',
  '20260820180000',
  '20260821100000'
)
order by version;
```

If `20260820180000` is recorded, stop with HOLD and reconcile the live object state separately. This runbook does not authorize deleting or rewriting that ledger entry.

## 2. Detect unledgered PR #1606 contamination before any write

A clean ledger does not prove the removed migration body was never executed manually. Before any canonical migration or cron mutation, inspect for objects unique to the removed PR #1606 path.

```sql
select
  to_regclass('public.hv_pipeline_stage_metrics') as unsafe_stage_metrics,
  to_regprocedure('public.hv_pipeline_budget_consume(integer)') as unsafe_budget_consume,
  to_regprocedure('public.hv_pre_filter_documents(integer)') as unsafe_pre_filter,
  to_regprocedure('public.hv_review_queue_enqueue_medium(numeric,numeric,integer)') as unsafe_review_enqueue;
```

For a zero-canonical-version live state, all four results must be null.

Also inspect the P0–P2 tables if they already exist:

```sql
select
  c.table_name,
  array_agg(c.column_name order by c.ordinal_position) as columns
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name in (
    'hv_signal_review_queue',
    'hv_classify_prefilter_dispositions',
    'hv_pipeline_stage_log',
    'hv_pipeline_cost_budget'
  )
group by c.table_name
order by c.table_name;
```

Removed-PR queue/budget markers such as `queued_at`, `resolved_at`, `resolved_by`, `day`, or `llm_calls` are a hard stop unless a separately approved reconciliation proves they belong to a legitimate later schema. The canonical budget table uses `budget_date` and `dispatch_units`; the repaired queue uses `created_at`, `reviewed_at` and `reviewed_by`.

Inspect `hv_pipeline_tick()` specifically:

```sql
select
  p.oid::regprocedure::text as function,
  md5(pg_get_functiondef(p.oid)) as body_hash,
  p.proconfig
from pg_proc p
where p.oid = to_regprocedure('public.hv_pipeline_tick()');
```

The removed PR #1606 redefined this function around `hv_pre_filter_documents()` and `hv_pipeline_budget_consume()`. If the live function body references either removed helper, stop with HOLD.

Also capture `pg_get_functiondef`, body hash and `proconfig` for:

- `hv_classify_corpus_dispatch(integer,integer)`
- `hv_classify_corpus_harvest()`
- `hv_consume_dispatch_budget(text,integer)`
- `hv_dedup_assign(double precision,integer)`
- `hv_pipeline_tick()`
- `hv_promote_signals(numeric)`

The live definitions must be consistent with the live ledger/resume state. Any object/ledger mismatch is HOLD.

## 3. Determine the only valid resume state

Classify live history before proceeding.

| Canonical versions recorded | Required action |
|---|---|
| none | Normal apply after all zero-state/remnant gates pass. |
| `20260820130000` only | Verify the first migration's canonical objects/body/ACLs, then dry-run must contain only `20260820131000` and `20260821100000`. |
| `20260820130000` + `20260820131000` | Verify both canonical states, then dry-run must contain only `20260821100000`. |
| all three canonical versions | Verification-only. Do not reapply; proceed to paused-state structural verification only if a production re-verification is explicitly intended. |
| `20260820180000` present | HOLD. Separate live-body/ledger reconciliation required. |
| `20260820131000` without `20260820130000` | HOLD: impossible dependency state. |
| `20260821100000` without both prerequisites | HOLD: impossible dependency state. |
| ledger says applied but required object/body is absent or incompatible | HOLD: ledger/object drift. |
| object exists but its creating canonical version is absent | HOLD unless it is proven to be the exact canonical partial state from an interrupted apply and the recovery path below is followed. |

Never delete successful canonical ledger entries to recreate a zero-state appearance.

## 4. Capture cron, timezone, budget and index state

Require database-day accounting to be UTC because the global budget uses `current_date`:

```sql
show timezone;
select current_timestamp, current_date;
```

Require `TimeZone = UTC`. Any other effective database/cron timezone is HOLD until the accounting-day semantics are explicitly reconciled.

Capture only the two relevant cron jobs by exact jobname:

```sql
select jobid, jobname, schedule, active, md5(command) as command_hash
from cron.job
where jobname in ('hv-quality-pipeline','hv-quality-promote')
order by jobname;
```

Require exactly one row for each jobname. Preserve both command hashes. This release may change only schedule and active state; it must not rewrite command bodies.

Capture current budget state:

```sql
select stage, budget_date, calls_used, daily_ceiling
from public.hv_dispatch_budget
order by stage;

select budget_date, dispatch_units, hard_cap, updated_at
from public.hv_pipeline_cost_budget
where budget_date = current_date;
```

The aggregate table may be absent before `20260821100000` in a valid earlier resume state. Its existence with removed-PR columns is HOLD.

Capture current HNSW indexes:

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'signals'
  and indexdef ilike '%using hnsw%'
order by indexname;
```

## 5. Pause and drain both quality crons

Resolve job IDs from live jobnames at execution time; never hard-code historical IDs.

```sql
select cron.alter_job(job_id := j.jobid, active := false)
from cron.job j
where j.jobname = 'hv-quality-pipeline';

select cron.alter_job(job_id := j.jobid, active := false)
from cron.job j
where j.jobname = 'hv-quality-promote';
```

Record `pause_timestamp = clock_timestamp()` immediately after the second pause.

Re-query both rows and require `active = false`.

Then establish a drain barrier. Disabling a cron prevents future scheduling; it does not prove an already-started run has completed.

```sql
select
  j.jobname,
  r.runid,
  r.status,
  r.start_time,
  r.end_time
from cron.job j
join cron.job_run_details r on r.jobid = j.jobid
where j.jobname in ('hv-quality-pipeline','hv-quality-promote')
  and r.end_time is null
order by r.start_time;
```

Required result: **zero rows** before DDL. If a row is still running, remain paused and do not apply migrations until it completes or is separately investigated.

## 6. Apply only the canonical pending set

### Approved production apply mechanism

Use the pinned repository checkout and Supabase CLI migration engine so repository numeric versions are recorded in `supabase_migrations.schema_migrations`.

Immediately before the write, repeat:

```text
supabase db push --linked --dry-run --include-all
```

The output must match the expected remaining set from section 3 exactly.

Then run:

```text
supabase db push --linked --include-all
```

Do not use `--include-seed`.

Do not substitute raw SQL execution, Dashboard SQL, `execute_sql`, MCP `apply_migration`, `migration repair`, or a hand-written insert/update/delete against `supabase_migrations.schema_migrations`. Those paths either bypass the canonical repository version or mutate history independently of the migration execution.

After application, query the focused ledger and require each expected canonical version exactly once and `20260820180000` absent.

If any migration fails, immediately follow section 7. Do not restore either cron.

## 7. Interrupted or failed apply recovery

On any apply failure:

1. Keep both quality crons inactive. If either has been re-enabled, disable both by exact jobname.
2. Record the exact failing migration, SQLSTATE/error, timestamp and immutable deployment SHA.
3. Re-query the full migration ledger and the focused four-version ledger.
4. Capture the resulting P0–P2 object definitions, table schemas, RLS/ACLs and function hashes.
5. Do not delete successful migration-history rows and do not blindly down-migrate.
6. Do not manually mark a failed migration as applied.
7. Determine the resulting state using the resume matrix in section 3.
8. If the successfully recorded prefix and live objects match the canonical prefix exactly, correct the concrete failure and resume only from the first unapplied canonical version after a new exact dry run.
9. If ledger and objects disagree, remain HOLD for explicit forward reconciliation.
10. Re-run every paused-state structural/security gate before any cron restore.

The preferred recovery model is forward completion from a proven canonical prefix, not history surgery.

## 8. Structural and security verification while crons remain paused

### Preservation contracts

Require:

- `hv_classify_corpus_dispatch` still contains five-attempt retirement, unresolved manual-review exclusion, translated text selection, persisted pre-filter dispositions and the broad August search path including `extensions`.
- `hv_dedup_assign` still contains HNSW KNN `<=>` ordering/limit and `pg_catalog, public, extensions` search path.
- `hv_pipeline_tick` still excludes signals with an unharvested `hv_embed_jobs` row and does **not** reference removed PR #1606 helpers.
- `hv_promote_signals` has default 0.80, clamps callers to `>= 0.80`, requires `classifier_validation.gate_passed = true`, and blocks pending/rejected/skipped review rows.
- `hv_review_queue_approve` and `hv_review_queue_reject` lock the pending queue row before mutating `signals`.
- Only `idx_signals_embedding_1024_hnsw` is present as the canonical HNSW index; `signals_embedding_1024_hnsw_idx` and any other duplicate HNSW authority are absent.

Compare pre/post body hashes for preserved functions. Any unexpected change to a function that the canonical migration claims to preserve is HOLD.

### RLS and table ACLs

```sql
select
  c.relname,
  c.relrowsecurity,
  c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'hv_signal_review_queue',
    'hv_classify_prefilter_dispositions',
    'hv_pipeline_stage_log',
    'hv_pipeline_cost_budget'
  )
order by c.relname;
```

All four tables must have both RLS and FORCE RLS enabled.

Require `anon` and `authenticated` to have no direct table privileges on all four internal tables. Require `service_role` to remain read-only where the canonical migration grants only SELECT.

### SECURITY DEFINER / RPC ACL matrix

Inspect owner, SECURITY DEFINER status, search path and effective EXECUTE privileges:

```sql
with f(sig) as (
  values
    ('public.hv_prefilter_signal_disposition(text,text,text,text,boolean)'),
    ('public.hv_prefilter_signal(text,text,text,text,boolean)'),
    ('public.hv_classify_corpus_dispatch(integer,integer)'),
    ('public.hv_review_queue_approve(text,text)'),
    ('public.hv_review_queue_reject(text,text,text)'),
    ('public.hv_review_queue_list_pending(integer)'),
    ('public.hv_pipeline_budget_remaining()'),
    ('public.hv_consume_dispatch_budget(text,integer)'),
    ('public.hv_promote_signals(numeric)'),
    ('public.hv_eval_gate_snapshot()')
)
select
  f.sig,
  p.prosecdef,
  pg_get_userbyid(p.proowner) as owner,
  p.proconfig,
  has_function_privilege('PUBLIC', p.oid, 'EXECUTE') as public_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute
from f
left join pg_proc p on p.oid = to_regprocedure(f.sig)
order by f.sig;
```

Required browser result: `PUBLIC`, `anon` and `authenticated` must not have EXECUTE on the internal P0–P2 SECURITY DEFINER RPCs. Service-role execution must match the explicit canonical grants; do not broaden it to make a smoke pass.

### Gate snapshot

```sql
select public.hv_eval_gate_snapshot();
```

It must report:

- `promote_floor = 0.80`;
- `human_review_floor = 0.65`;
- `global_daily_dispatch_cap = 8000`;
- `publication_gate = classifier_validation.gate_passed`;
- `mechanical_gate_preserved = true`.

The snapshot is observability only and must not replace the classifier gate.

## 9. Budget behavior proof while paused

Verify current rows without fabricating load:

```sql
select stage, budget_date, calls_used, daily_ceiling
from public.hv_dispatch_budget
order by stage;

select budget_date, dispatch_units, hard_cap, updated_at
from public.hv_pipeline_cost_budget
where budget_date = current_date;
```

Require:

- every stage `calls_used <= daily_ceiling`;
- aggregate `dispatch_units <= hard_cap`;
- `hard_cap = 8000` for the current day when a row exists;
- no negative counters.

Do not consume production budget solely for a synthetic cap test. Exact accounting is closed during the first real pipeline smoke by comparing pre/post aggregate and per-stage deltas.

## 10. Restore the approved staggered cadence one job at a time

Approved post-release cadence:

| jobname | schedule |
|---|---|
| `hv-quality-pipeline` | `10,40 * * * *` |
| `hv-quality-promote` | `20 * * * *` |

Before each restore, re-resolve the job ID and verify its `md5(command)` equals the pre-apply command hash.

### 10.1 Restore pipeline only

Capture `pipeline_restore_timestamp = clock_timestamp()` and the current budget rows, then:

```sql
select cron.alter_job(
  job_id := j.jobid,
  schedule := '10,40 * * * *',
  active := true
)
from cron.job j
where j.jobname = 'hv-quality-pipeline';
```

Require the exact schedule, `active = true`, and unchanged command hash.

Observe a **fresh** completed run only:

```sql
select r.runid, r.jobid, r.status, r.start_time, r.end_time, r.return_message
from cron.job_run_details r
join cron.job j on j.jobid = r.jobid
where j.jobname = 'hv-quality-pipeline'
  and r.start_time > :pipeline_restore_timestamp
  and r.end_time is not null
order by r.start_time desc
limit 1;
```

Require `status = 'succeeded'`.

For overlap safety, the pipeline must complete within **8 minutes** for the critical `:10` run, preserving at least a 2-minute margin before the `:20` promotion slot. If the fresh smoke does not establish this worst-case margin, promotion remains disabled.

After the successful run, re-capture stage and aggregate budgets. For a same-day smoke window, require:

```text
aggregate dispatch_units delta
  = sum of positive hv_dispatch_budget.calls_used deltas
```

and require the resulting aggregate to remain `<= 8000`. A day rollover during the window invalidates this delta proof; repeat on one database day without fabricating dispatch.

If the pipeline run fails, exceeds the 8-minute worst-case runtime, produces an unreconciled budget delta, or changes the command hash, immediately disable **both** quality jobs and HOLD.

## 11. Restore promotion only after pipeline GO

Capture `promote_restore_timestamp = clock_timestamp()` and then:

```sql
select cron.alter_job(
  job_id := j.jobid,
  schedule := '20 * * * *',
  active := true
)
from cron.job j
where j.jobname = 'hv-quality-promote';
```

Require exact schedule, `active = true`, and unchanged command hash.

Observe a fresh completed run using `start_time > :promote_restore_timestamp` and require `status = 'succeeded'`.

Then prove the fresh automatic promotions did not violate the hard publication contract:

```sql
select count(*) as violating_auto_promotions
from public.signals s
where s.reviewed_by = 'auto:v1'
  and s.reviewed_at >= :promote_restore_timestamp
  and (
    s.quality_confidence is null
    or s.quality_confidence < 0.80
    or not exists (
      select 1
      from public.classifier_validation cv
      where cv.classifier_version = s.classifier_version
        and cv.gate_passed = true
    )
    or exists (
      select 1
      from public.hv_signal_review_queue q
      where q.signal_id = s.id
        and q.status in ('pending','rejected','skipped')
    )
  );
```

Required result: `0`.

If promotion fails its first fresh execution or this semantic assertion is non-zero, immediately disable **both** quality jobs and HOLD.

## 12. Final closed-loop evidence

Record all of the following:

- corrective PR number and immutable head SHA;
- merge SHA and production deployment/main SHA;
- canonical migration blob SHAs;
- full `supabase migration list --linked` reconciliation;
- final dry-run output showing only the intended canonical pending set;
- exact applied migration versions;
- ledger proof that `20260820180000` is absent;
- unsafe-remnant gate output;
- timezone/current-date proof;
- pre/post preserved-function body hashes and search paths;
- HNSW index definition;
- RLS/FORCE RLS matrix;
- table and RPC ACL matrix;
- `hv_eval_gate_snapshot()` output;
- before/after stage and aggregate budget counters plus exact smoke delta reconciliation;
- both cron rows with final schedules, active state and pre/post command-hash equality;
- one timestamp-scoped successful `cron.job_run_details` row for each restored job;
- pipeline runtime proof `< 8 minutes` for the critical cadence window;
- fresh-promotion semantic assertion result `0`.

Final cron state for GO:

```text
hv-quality-pipeline  10,40 * * * *  active=true  command_hash=<unchanged>
hv-quality-promote   20 * * * *     active=true  command_hash=<unchanged>
```

## Stop conditions

Return HOLD and keep both quality jobs inactive if any of the following occurs:

- `20260820180000` is recorded or any removed-PR object/body marker is detected;
- repository/live migration history is not fully reconciled;
- the production dry run proposes anything outside the expected canonical remainder;
- migration blobs differ from the reviewed canonical blobs without a new approval;
- ledger/object state does not match a valid resume state;
- the database/cron accounting day is not UTC;
- either cron is missing, duplicated, not fully paused, or not drained before DDL;
- a canonical migration fails or produces ledger/object drift;
- a preserved function changes unexpectedly;
- browser access appears on an internal table or SECURITY DEFINER RPC;
- the classifier gate can fail open;
- HNSW authority changes or duplicates;
- aggregate budget can exceed 8,000 or smoke accounting does not reconcile exactly;
- a fresh cron smoke fails;
- the pipeline cannot prove the 8-minute worst-case runtime bound;
- any fresh auto-promotion violates the 0.80/classifier-validation/review-state contract;
- pre/post cron command hashes differ.

No HOLD condition in this runbook authorizes ledger repair, destructive rollback, unrelated migration application, or production data mutation beyond the canonical migration and controlled cron state changes described above.
