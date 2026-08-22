# Registry rows — Intelligence pipeline optimization (2026-08-20)

**PR:** #1598  
**Status:** Repaired code on branch; not production-applied. Existing active
quality crons are recorded but not changed.

## Affected canonical registry row

Pipeline B / Harbourview Intelligence ingestion and scoring. The canonical
`PROJECT_REGISTRY.md` body remains intact and adds only a pointer to this
scoped inventory.

## Repository objects

| Component | Path / object | Decision |
|---|---|---|
| Control plan | `docs/control/INTEL_PIPELINE_OPTIMIZATION_2026-08-20.md` | Records the narrow pre-filter/review scope and preserved safeguards |
| Apply checklist | `docs/control/INTEL_PIPELINE_APPLY_CHECKLIST_2026-08-20.md` | Captures unchanged active cron state and forward-fix authority |
| Migration A | `supabase/migrations/20260820130000_hv_pipeline_optimization.sql` | Adds internal tables, pre-filter decision and safe dispatch/promotion replacements |
| Migration B | `supabase/migrations/20260820131000_hv_review_queue_resolve.sql` | Adds atomic service-role review RPCs |
| SQL verification | `tests/sql/pr1598_pipeline_optimization_dry_run.sql` | Zero-state + idempotent replay, multilingual recall, behavior and ACL/RLS |
| Static contracts | `tests/supabase/pr1598PipelineOptimization.test.ts` | Prevents reintroduction of the reviewed regressions |
| Dedicated verification | `.github/workflows/pr1598-pipeline-optimization-verify.yml` | PostgreSQL 17 execution of the targeted SQL packet |
| Full replay prerequisite | `scripts/prepare-production-faithful-migration-replay.mjs` | Replay-only `pg_trgm` foundation; no production migration or ledger entry |

## Database objects after a separately approved apply

| Object | Exposure |
|---|---|
| `hv_signal_review_queue` | RLS; service-role read only; decisions through locked RPCs |
| `hv_classify_prefilter_dispositions` | RLS; service-role read only; explicit filter audit |
| `hv_pipeline_stage_log` | RLS; service-role read only |
| `hv_prefilter_signal_disposition` / `hv_prefilter_signal` | service-role/postgres only |
| `hv_review_queue_approve` / `reject` / `list_pending` | service-role/postgres only |

## Explicit non-objects

- No new HNSW index. `idx_signals_embedding_1024_hnsw` remains canonical.
- No `hv_dedup_assign` replacement.
- No `hv_pipeline_tick` or `hv_quality_promote_tick` replacement.
- No cron schedule, activation or deactivation statement.
- No Vercel, domain, public route, DTO, auth, secret or deployment change.

## Cron state reconciliation

Read-only evidence on 2026-08-20:

| Job | Schedule | Active |
|---|---|---|
| `hv-quality-pipeline` | `*/30 * * * *` | true |
| `hv-quality-promote` | `10,40 * * * *` | true |

Registry decision: record the state and require pre/post equality on a future
apply. Do not run the stale re-enable instructions.
