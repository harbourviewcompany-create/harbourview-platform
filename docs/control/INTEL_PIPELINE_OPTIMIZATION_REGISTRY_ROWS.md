# Registry rows — Intelligence pipeline optimization (2026-08-20)

**PR:** #1598  
**Status:** Code on branch; **not** production-applied; crons not enabled.

Copy into `PROJECT_REGISTRY.md` after merge if desired, or leave as linked control rows.

## New objects

| Component | Path / object | Notes |
|-----------|---------------|-------|
| Control plan | `docs/control/INTEL_PIPELINE_OPTIMIZATION_2026-08-20.md` | Goals, phases, safety invariants |
| Apply checklist | `docs/control/INTEL_PIPELINE_APPLY_CHECKLIST_2026-08-20.md` | Operator steps post-merge |
| Migration A | `supabase/migrations/20260820130000_hv_pipeline_optimization.sql` | Pre-filter, review queue, stage log, safer promote/tick/dedup, HNSW, eval helper |
| Migration B | `supabase/migrations/20260820131000_hv_review_queue_resolve.sql` | Approve/reject/list RPCs |
| Tables | `hv_signal_review_queue`, `hv_pipeline_stage_log` | RLS on; service_role/postgres only |
| Cron enable | `docs/control/INTEL_CRON_REENABLE_RUNBOOK.md` | Operator-only; not in migration |

**Registry impact:** new tables + migrations only after live apply. No Vercel/domain/public-route change.
