# INTEL PIPELINE P0–P2 APPLY CHECKLIST (2026-08-20)

1. [ ] DB healthy (`SELECT 1` instant)
2. [ ] Apply `supabase/migrations/20260820180000_p0_p2_pipeline_optimization.sql` under ledger version **20260820180000**
3. [ ] `SELECT public.hv_eval_gate_snapshot();` → ok, promote_floor 0.80
4. [ ] Re-enable crons per `docs/control/INTEL_PIPELINE_P0_P2_LIVE_RUNBOOK.md` (staggered; never `*/2`)
5. [ ] Optional smoke: `hv_pipeline_tick()`, `hv_quality_promote_tick()`
6. [ ] Evidence in EVIDENCE_LOG / DATABASE_CONTROL

**Not done by merge alone:** production cron active flags.
