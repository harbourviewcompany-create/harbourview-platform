# INTEL PIPELINE P0–P2 CANONICAL APPLY CHECKLIST (2026-08-22)

Use with `docs/control/INTEL_PIPELINE_P0_P2_LIVE_RUNBOOK.md`. This checklist is a release gate, not a substitute for the executable detail in the runbook.

## Immutable repository gates

- [ ] Production target is exactly Supabase `zvxdgdkukjrrwamdpqrg`.
- [ ] Deployment checkout is pinned to an immutable reviewed `main` SHA and has no uncommitted migration-file changes.
- [ ] `20260820180000_p0_p2_pipeline_optimization.sql` is absent.
- [ ] `20260820130000_hv_pipeline_optimization.sql` matches reviewed blob `6ae416933e669df5d1f303fd85a91438c66fec26`.
- [ ] `20260820131000_hv_review_queue_resolve.sql` matches reviewed blob `0c9cf6ebd19801767b305c4fb9a61f1b114f593f`.
- [ ] `20260821100000_p0_p2_canonical_finish.sql` matches reviewed blob `c262859bfb6b79aa4d9ced469159b3563fbe2a06`.
- [ ] PostgreSQL zero-state replay passes.
- [ ] Same-database idempotent replay passes.
- [ ] Targeted P0–P2 behavior/security tests pass.
- [ ] Type Check passes.
- [ ] Next.js Build passes.
- [ ] Security / Leakage passes.
- [ ] Critical Env Secrets passes.
- [ ] Required control-document / migration-ledger gates pass.

## Full migration reconciliation

- [ ] Current Supabase CLI version and `db push` help output are captured.
- [ ] `supabase migration list --linked` proves repository ↔ live migration history is reconciled outside the canonical P0–P2 remainder.
- [ ] Focused ledger query captures `20260820130000`, `20260820131000`, `20260820180000`, `20260821100000`.
- [ ] `20260820180000` is absent from live history.
- [ ] Live canonical state matches one valid resume state: none; `130000`; `130000+131000`; or all three.
- [ ] No impossible dependency state exists.
- [ ] `supabase db push --linked --dry-run --include-all` proposes exactly the canonical versions still required by the resume state and no unrelated migration.
- [ ] No `migration repair`, manual ledger write, raw SQL apply, Dashboard SQL, `execute_sql`, or MCP `apply_migration` is being used as a substitute for the versioned production migration path.

## Unledgered PR #1606 contamination gate

- [ ] `public.hv_pipeline_stage_metrics` is absent unless separately reconciled and explicitly approved.
- [ ] `public.hv_pipeline_budget_consume(integer)` is absent.
- [ ] `public.hv_pre_filter_documents(integer)` is absent.
- [ ] `public.hv_review_queue_enqueue_medium(numeric,numeric,integer)` is absent.
- [ ] Existing P0–P2 tables, if any, match the schema expected for the live canonical resume state.
- [ ] No removed-PR queue/budget columns such as `queued_at`, `resolved_at`, `resolved_by`, `day`, or `llm_calls` remain in place of canonical columns.
- [ ] `hv_pipeline_tick()` does not reference `hv_pre_filter_documents()` or `hv_pipeline_budget_consume()`.
- [ ] Live object definitions and ledger agree. Any object/ledger mismatch is HOLD.

## Production preflight capture

- [ ] `show timezone` returns UTC and `current_timestamp/current_date` are captured.
- [ ] Exactly one live row exists for `hv-quality-pipeline`.
- [ ] Exactly one live row exists for `hv-quality-promote`.
- [ ] Current schedules, active flags and `md5(command)` hashes are captured.
- [ ] Current function bodies/body hashes/search paths are captured for classifier dispatch/harvest, dispatch budget, HNSW dedup, pipeline tick and promotion.
- [ ] Current stage and aggregate budget state is captured.
- [ ] Current HNSW index definitions are captured.

## Pause and drain barrier

- [ ] Pause `hv-quality-pipeline` by exact jobname and verify inactive.
- [ ] Pause `hv-quality-promote` by exact jobname and verify inactive.
- [ ] Record pause timestamp.
- [ ] `cron.job_run_details` shows no unfinished run for either quality job before DDL.
- [ ] No canonical migration is started until both jobs are inactive and drained.

## Controlled versioned apply

- [ ] Immediately before writing, repeat `supabase db push --linked --dry-run --include-all`.
- [ ] Dry-run set still equals exactly the expected canonical remainder.
- [ ] Apply with `supabase db push --linked --include-all`; never include seed data.
- [ ] Apply/record `20260820130000` if required by resume state.
- [ ] Apply/record `20260820131000` if required by resume state.
- [ ] Apply/record `20260821100000` if required by resume state.
- [ ] Confirm all required canonical versions appear exactly once in production history.
- [ ] Confirm `20260820180000` remains absent.

## Failed/interrupted apply gate

If any apply step fails:

- [ ] Both quality jobs remain inactive or are immediately returned to inactive.
- [ ] Exact failing migration, SQLSTATE/error, timestamp and immutable deployment SHA are recorded.
- [ ] Full and focused migration ledgers are re-captured.
- [ ] Resulting P0–P2 objects, table schemas, RLS/ACLs and function hashes are captured.
- [ ] Successful canonical history rows are not deleted.
- [ ] Failed versions are not manually marked applied.
- [ ] Resulting state matches a valid canonical prefix before any forward resume.
- [ ] A new dry run shows only the first unapplied canonical version and any canonical successors still required.
- [ ] Any ledger/object mismatch remains HOLD for explicit forward reconciliation.

## Production verification while paused

### Preservation and behavior

- [ ] Classifier dispatch retains actual-count budget accounting, five-attempt retirement, unresolved manual-review exclusion, translated-text pre-filter and explicit dispositions.
- [ ] `hv_dedup_assign` retains HNSW KNN behavior and `pg_catalog, public, extensions` search path.
- [ ] `hv_pipeline_tick` retains pending-embedding exclusion and contains no removed-PR helper references.
- [ ] `hv_promote_signals` has a hard `>= 0.80` floor and still requires `classifier_validation.gate_passed = true`.
- [ ] Promotion blocks `pending`, `rejected`, and `skipped` review rows.
- [ ] Review approve/reject RPCs lock a pending queue row before mutating the signal.
- [ ] Pre/post body hashes are unchanged for functions that the canonical migrations explicitly preserve.
- [ ] Canonical HNSW index exists and duplicate/competing HNSW index authority is absent.

### RLS and ACLs

- [ ] `hv_signal_review_queue` has RLS + FORCE RLS.
- [ ] `hv_classify_prefilter_dispositions` has RLS + FORCE RLS.
- [ ] `hv_pipeline_stage_log` has RLS + FORCE RLS.
- [ ] `hv_pipeline_cost_budget` has RLS + FORCE RLS.
- [ ] `anon` and `authenticated` have no direct table privileges on any of the four internal tables.
- [ ] `service_role` remains read-only on internal tables where canonical SQL grants only SELECT.
- [ ] SECURITY DEFINER RPC owner/search-path state is captured.
- [ ] `PUBLIC`, `anon`, and `authenticated` have no EXECUTE on internal P0–P2 SECURITY DEFINER RPCs.
- [ ] Service-role RPC execution matches only explicit canonical grants; no privilege is broadened to make smoke testing pass.

### Gate and budget

- [ ] Gate snapshot reports promotion floor `0.80`.
- [ ] Gate snapshot reports human-review floor `0.65`.
- [ ] Gate snapshot reports global cap `8000`.
- [ ] Gate snapshot reports publication authority `classifier_validation.gate_passed`.
- [ ] Gate snapshot reports mechanical gate preserved.
- [ ] Every stage has `calls_used <= daily_ceiling`.
- [ ] Aggregate `dispatch_units <= hard_cap` and `hard_cap = 8000` for the current database day.
- [ ] No synthetic production load is generated merely to consume budget.

## Staggered restore: pipeline first

- [ ] Pre-restore pipeline command hash equals the original captured hash.
- [ ] Capture `pipeline_restore_timestamp` and pre-smoke stage/aggregate budgets.
- [ ] Restore only `hv-quality-pipeline` at `10,40 * * * *`.
- [ ] Confirm exact schedule, active state and unchanged command hash.
- [ ] Fresh cron evidence uses `start_time > pipeline_restore_timestamp`.
- [ ] Fresh pipeline run completed and `status = succeeded`.
- [ ] Critical `:10` pipeline runtime is `< 8 minutes`, preserving at least 2 minutes before the `:20` promotion slot.
- [ ] Same-day aggregate budget delta equals the sum of positive per-stage `calls_used` deltas.
- [ ] Resulting aggregate remains `<= 8000`.
- [ ] If any pipeline smoke/runtime/budget/hash check fails, both quality jobs are immediately disabled and release is HOLD.

## Staggered restore: promotion second

- [ ] Pipeline smoke is fully green before promotion is enabled.
- [ ] Pre-restore promotion command hash equals the original captured hash.
- [ ] Capture `promote_restore_timestamp`.
- [ ] Restore only `hv-quality-promote` at `20 * * * *`.
- [ ] Confirm exact schedule, active state and unchanged command hash.
- [ ] Fresh cron evidence uses `start_time > promote_restore_timestamp`.
- [ ] Fresh promotion run completed and `status = succeeded`.
- [ ] Fresh automatic-promotion semantic query returns `violating_auto_promotions = 0` for the 0.80 floor, classifier-validation gate, and pending/rejected/skipped review-state contract.
- [ ] If promotion smoke or semantic verification fails, both quality jobs are immediately disabled and release is HOLD.

## Final closed-loop evidence

- [ ] Record corrective PR number and immutable PR head SHA.
- [ ] Record merge SHA and production deployment/main SHA.
- [ ] Record all three canonical migration blob SHAs.
- [ ] Record full migration reconciliation and exact final dry-run output.
- [ ] Record exact migration versions applied.
- [ ] Record proof that `20260820180000` is absent.
- [ ] Record unsafe-remnant gate output.
- [ ] Record UTC accounting-day proof.
- [ ] Record pre/post function/search-path hashes.
- [ ] Record HNSW definition.
- [ ] Record RLS/FORCE RLS and table/RPC ACL matrices.
- [ ] Record `hv_eval_gate_snapshot()` output.
- [ ] Record budget pre/post counters and exact pipeline smoke delta reconciliation.
- [ ] Record both final cron rows with schedule, active state and unchanged command hashes.
- [ ] Record one fresh successful `cron.job_run_details` row for each restored job.
- [ ] Record `< 8 minute` critical pipeline runtime proof.
- [ ] Record fresh-promotion semantic assertion result `0`.
- [ ] Return GO only if every required repository and production gate is green; otherwise HOLD with the exact blocker and keep both quality jobs inactive when the blocker arose during apply/restore.

## Final expected GO state

```text
canonical migrations recorded:
  20260820130000
  20260820131000
  20260821100000
removed migration recorded:
  20260820180000 -> absent

hv-quality-pipeline  10,40 * * * *  active=true  command_hash=unchanged
hv-quality-promote   20 * * * *     active=true  command_hash=unchanged

publication floor: >= 0.80
publication authority: classifier_validation.gate_passed = true
aggregate daily dispatch cap: 8000
fresh auto-promotion violations: 0
```
