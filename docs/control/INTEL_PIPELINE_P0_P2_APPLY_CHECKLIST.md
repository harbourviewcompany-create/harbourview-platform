# INTEL PIPELINE P0–P2 CANONICAL APPLY CHECKLIST (2026-08-21)

## Repository gates

- [ ] `20260820180000_p0_p2_pipeline_optimization.sql` is absent from the corrective branch.
- [ ] `20260820130000_hv_pipeline_optimization.sql` is present and preserves the repaired PR #1598 classifier controls.
- [ ] `20260820131000_hv_review_queue_resolve.sql` is present and provides atomic authoritative review decisions.
- [ ] `20260821100000_p0_p2_canonical_finish.sql` is present and supplies the hard 0.80 floor, exact aggregate 8,000-unit budget, FORCE RLS/ACL completion and gate snapshot.
- [ ] PostgreSQL zero-state replay passes.
- [ ] Same-database idempotent replay passes.
- [ ] Targeted behavior/security tests pass.
- [ ] Type Check passes.
- [ ] Next.js Build passes.
- [ ] Required control-document / migration-ledger gates pass.

## Production preflight

- [ ] Target is exactly Supabase `zvxdgdkukjrrwamdpqrg`.
- [ ] Ledger confirms `20260820130000`, `20260820131000`, `20260820180000`, and `20260821100000` are not already recorded unless explicitly expected.
- [ ] Exact live rows exist for `hv-quality-pipeline` and `hv-quality-promote`.
- [ ] Current schedules, active flags and command hashes are captured without exposing command bodies or secrets.
- [ ] Current function definitions/search paths, HNSW indexes, RLS/ACL state, classifier gate state and dispatch budgets are captured.

## Controlled apply

- [ ] Pause `hv-quality-pipeline` by exact jobname and verify inactive.
- [ ] Pause `hv-quality-promote` by exact jobname and verify inactive.
- [ ] Apply `20260820130000`.
- [ ] Apply `20260820131000`.
- [ ] Apply `20260821100000`.
- [ ] Confirm all three canonical versions appear once in the production ledger.
- [ ] Confirm `20260820180000` remains absent.

## Production verification while paused

- [ ] Classifier dispatch retains actual-count budget accounting, five-attempt retirement, unresolved manual-review exclusion, translated-text pre-filter and explicit dispositions.
- [ ] `hv_dedup_assign` retains HNSW KNN behavior and `pg_catalog, public, extensions` search path.
- [ ] `hv_pipeline_tick` retains pending-embedding exclusion.
- [ ] `hv_promote_signals` has a hard `>= 0.80` floor and still requires `classifier_validation.gate_passed = true`.
- [ ] Review approve/reject RPCs lock a pending queue row before mutating the signal.
- [ ] All four internal P0–P2 tables have RLS + FORCE RLS and no browser table privileges.
- [ ] Canonical HNSW index exists and duplicate HNSW index is absent.
- [ ] Gate snapshot reports floor `0.80`, cap `8000`, and classifier-validation publication authority.
- [ ] Aggregate budget cannot advance beyond 8,000 and increments only by admitted measured dispatch units.

## Staggered restore

- [ ] Restore only `hv-quality-pipeline` at `10,40 * * * *`.
- [ ] Observe one successful pipeline execution and verify no overlap/error/budget anomaly.
- [ ] Restore only `hv-quality-promote` at `20 * * * *`.
- [ ] Observe one successful promote execution.
- [ ] Confirm both final cron rows match the approved cadence and are active.

## Release evidence

- [ ] Record corrective PR number, immutable head SHA, merge SHA and final main SHA.
- [ ] Record exact migration versions applied.
- [ ] Record ledger, function/search-path, HNSW, RLS/ACL, gate, budget and cron smoke evidence.
- [ ] Return GO only if every required repository and production gate above is green; otherwise HOLD with the exact blocker.

See `docs/control/INTEL_PIPELINE_P0_P2_LIVE_RUNBOOK.md` for executable detail.
