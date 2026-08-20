# Intel Pipeline Optimization — Apply Checklist (2026-08-20)

**PR:** #1598  
**Migrations, in order:**

1. `20260820130000_hv_pipeline_optimization.sql`
2. `20260820131000_hv_review_queue_resolve.sql`

**Current status:** Repository-only. This checklist records a possible later
operator apply; PR #1598 does not apply either migration.

## Pre-apply authorization and state capture

- [ ] Explicit owner approval names the target environment and both migration files.
- [ ] Target is a controlled branch/staging database before production.
- [ ] Database health and Nano/Micro compute posture are recorded.
- [ ] Current classifier/dedup/tick definitions are captured with
      `pg_get_functiondef`.
- [ ] Current ACLs are captured with `aclexplode(proacl)` or
      `has_function_privilege`.
- [ ] Current cron state is captured read-only:

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname in ('hv-quality-pipeline', 'hv-quality-promote')
order by jobname;
```

Expected state observed 2026-08-20:

| Job | Schedule | Active |
|---|---|---|
| `hv-quality-pipeline` | `*/30 * * * *` | true |
| `hv-quality-promote` | `10,40 * * * *` | true |

If observed state differs, stop and reconcile the delta. Do not run the older
cron re-enable runbook from this checklist.

## Apply to the approved non-production target

- [ ] Apply Migration A.
- [ ] Apply Migration B.
- [ ] Apply both files again on the same database; expect a clean idempotent replay.
- [ ] Confirm these internal tables exist with RLS enabled:
      `hv_signal_review_queue`,
      `hv_classify_prefilter_dispositions`,
      `hv_pipeline_stage_log`.
- [ ] Confirm these new/repaired functions exist:
      `hv_prefilter_signal_disposition`,
      `hv_prefilter_signal`,
      `hv_review_queue_approve`,
      `hv_review_queue_reject`,
      `hv_review_queue_list_pending`.

## Preservation assertions

- [ ] `hv_classify_corpus_dispatch` still has the August 14 broad search path,
      five-attempt retirement, unresolved manual-review exclusion and
      `hv_consume_dispatch_budget('classify', actual_count)`.
- [ ] `hv_dedup_assign` still contains `ORDER BY <=> LIMIT` and has
      `search_path = pg_catalog, public, extensions`.
- [ ] Only `idx_signals_embedding_1024_hnsw` exists for
      `signals.embedding_1024`; `signals_embedding_1024_hnsw_idx` is absent.
- [ ] `hv_pipeline_tick` still excludes an unharvested `hv_embed_jobs` match.
- [ ] `hv_promote_signals` requires a matching
      `classifier_validation.gate_passed = true` row.
- [ ] Cron query above is byte-for-byte unchanged after apply.

## Behavioral and access verification

- [ ] Run `tests/sql/pr1598_pipeline_optimization_dry_run.sql` on PostgreSQL 17.
- [ ] Record the multilingual fixture numerator/denominator/recall.
- [ ] Prove filtered navigation/off-topic/excluded-host rows have explicit
      persisted dispositions.
- [ ] Prove the classifier HTTP body uses translated title/summary values.
- [ ] Prove the dispatch budget is charged for actual selected rows only.
- [ ] Prove arbitrary, repeated and blank-reviewer decisions cannot mutate a signal.
- [ ] Prove approval/rejection update queue and signal atomically.
- [ ] Prove pending and rejected decisions block later auto-promotion.
- [ ] Prove `anon`/`authenticated` have no table or RPC access and
      `service_role` has only the intended table/RPC privileges.

## Post-apply observation

```sql
select stage, metrics, created_at
from public.hv_pipeline_stage_log
order by created_at desc
limit 20;

select *
from public.hv_review_queue_list_pending(25);

select disposition, count(*)
from public.hv_classify_prefilter_dispositions
group by disposition
order by disposition;
```

Do not change a cron schedule as part of this migration apply. Any pause,
re-cadence or re-enable is a separate production action requiring separate
authorization.

## Forward-fix plan

The safe recovery is a new forward migration, not replaying the stale July
baseline and not dropping the additive tables.

- Classifier dispatch/harvest authority:
  `20260814180000_bound_classify_retries.sql`.
- HNSW KNN dedup authority:
  `20260814143000_fix_hv_dedup_assign_search_path.sql`.
- Pending-embedding tick authority:
  `20260730184257_fix_duplicate_dispatch_translate_and_embed.sql`.
- Publication-gate authority:
  `20260723084602_stage_c_classifier_validation_gate.sql`.

Revoke execute on the new review RPCs in a forward fix if the review workflow
must be held. Leave cron state unchanged unless separately authorized.
