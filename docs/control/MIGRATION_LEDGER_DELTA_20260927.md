# Production Migration Ledger Delta — 2026-09-27

Status: HOLD

Scope: read-only reconciliation evidence only. No production migration, schema change, ledger mutation, DDL, DML, or deployment change was performed by this artifact.

Production project: `zvxdgdkukjrrwamdpqrg`

## Verified live state

- `supabase_migrations.schema_migrations` rows: **1,099**
- Latest applied version: **20260925233603**
- Previous reconciliation artifact `supabase/release-controls/migration-ledger-reconciliation-20260925.json` recorded **1,090** rows.
- Therefore the 2026-09-25 reconciliation snapshot is stale by **9 live ledger rows**.

## Newly observed live-only delta

Each of the following versions was read from the live production migration ledger and searched by exact filename in the repository at main. No repository match was returned for any of them:

| Live version | Live name | Repository exact filename search |
|---|---|---|
| 20260925170419 | progressive_depth_freshness_v2 | NOT FOUND |
| 20260925170448 | progressive_depth_freshness_v2_fix | NOT FOUND |
| 20260925170555 | progressive_depth_cycle_v1 | NOT FOUND |
| 20260925183217 | progressive_depth_cycle_batch_tuning | NOT FOUND |
| 20260925205325 | optimize_full_depth_adjudication_promotion_v2 | NOT FOUND |
| 20260925205338 | full_depth_adjudication_promotion_cron_20260925 | NOT FOUND |
| 20260925230134 | repair_full_depth_contract_version_normalization | NOT FOUND |
| 20260925233444 | full_depth_optimization_control_plane | NOT FOUND |
| 20260925233603 | full_depth_document_processing_layer | NOT FOUND |

## Disposition

These nine versions are **production-only observations**, not an authorization to reconstruct or replay SQL.

The repository already requires exact-source recovery, byte/content verification, or explicit historical attestation before resolving production-only migration provenance. No SQL has been fabricated from current schema state.

The prior 2026-09-25 artifact remains the authoritative record for its earlier 44 production-only recovery set; this document only records the subsequent nine-row live delta and does not claim that the complete repository/live ledger is reconciled.

## Current gate

**HOLD**

Reason: complete repository/live migration reconciliation remains outstanding. The production ledger must not be rewritten or replayed merely to make version numbers converge.
