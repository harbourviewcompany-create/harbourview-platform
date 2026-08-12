# Migration Drift Reconciliation Plan — 2026-08-10

Source SHA: `11f0b3becdfea5306be6f5cdbefb5319850aa4c8`

## Scope and posture

- Repository versions: **842**
- Live versions: **809**
- Applied live but not committed: **52**
- Committed but not applied: **85**
- Approved pending: **3**
- Unexpected pending: **82**
- Historical live-version aliases: **5**
- Equivalence mismatches: **0**

This is a repository-only reconciliation plan. It does not authorize applying, reverting, repairing, stamping, deleting, renaming, or otherwise changing the live migration ledger.

## Disposition rules

1. `APPLIED_NOT_COMMITTED`: recover authoritative SQL/provenance for the live version. Determine whether it is identical/equivalent to an existing repository migration. Then either commit the exact canonical migration or add a reviewed live-version equivalence record. Never manufacture SQL from current schema state.
2. `UNEXPECTED_PENDING`: locate the repository migration by version prefix and classify it as `APPLY_CANDIDATE`, `SUPERSEDED`, `NO_OP_LEDGER_ONLY`, or `REQUIRES_REWORK`. Record dependencies and release-owner approval before any production action.
3. `APPROVED_PENDING`: preserve the existing release-control disposition. These 3 versions are not part of the 82 unexpected pending set.
4. Re-run `scripts/migration-ledger-manifest.mjs --mode drift` after repository reconciliation. Release-safety GO requires zero unaccounted live-only versions, zero unexpected pending versions, zero equivalence mismatches, zero invalid filenames, and zero duplicate pending versions.

## 52 APPLIED_NOT_COMMITTED versions

Each version below requires exact live provenance/SQL recovery and a canonical repository migration or reviewed equivalence mapping:

```text
20260727213922
20260728191340
20260728192052
20260729021338
20260729021608
20260729021709
20260729021820
20260729095416
20260729102231
20260729230849
20260729233712
20260730003050
20260730103137
20260730104444
20260730104633
20260730112133
20260730112457
20260730112526
20260730112536
20260730112600
20260730112630
20260730160830
20260730160833
20260730161011
20260730161013
20260730161318
20260730182043
20260730182145
20260730182606
20260730184257
20260730185321
20260730211141
20260730211147
20260730211325
20260730211507
20260730211621
20260730211756
20260730212129
20260730220913
20260730221151
20260730222127
20260730222807
20260730223248
20260730223308
20260731004024
20260731090302
20260731110914
20260801144813
20260802011926
20260802014521
20260802134657
20260804222954
```

## 82 UNEXPECTED_PENDING versions

For each version below inspect `supabase/migrations/<version>_*.sql`, dependencies, historical PR/evidence, and intended release disposition before any apply:

```text
20260430000003
20260528033001
20260611103000
20260611150000
20260613080000
20260613170000
20260615091139
20260618210800
20260618210830
20260618210840
20260618210850
20260618211000
20260621220515
20260622162300
20260624032500
20260624171409
20260626110922
20260626110923
20260626110924
20260630233906
20260708214306
20260708214307
20260708214309
20260708214310
20260708214311
20260708214312
20260708214313
20260708214314
20260708214315
20260708214316
20260708214317
20260709085216
20260710094129
20260710114720
20260710235323
20260719190928
20260722021500
20260722021600
20260722021700
20260722022000
20260722022100
20260722030000
20260722031500
20260722120002
20260723180000
20260724000000
20260727160000
20260727161000
20260727162000
20260727163000
20260728000000
20260728010000
20260728020000
20260728201439
20260729000000
20260729000002
20260729010000
20260729020000
20260729130000
20260730110000
20260730123000
20260730180000
20260730215959
20260730220000
20260730220050
20260730220100
20260730220200
20260730221500
20260730222000
20260731013000
20260731120000
20260801150000
20260802080000
20260804233000
20260804234000
20260804234500
20260804235000
20260804235500
20260805000000
20260805233500
20260805234000
20260808120000
```

## 3 APPROVED_PENDING versions — preserve separately

| Version | File | Git blob SHA |
|---|---|---|
| `20260802073000` | `20260802073000_hv_dedup_assign_restore_hnsw_knn.sql` | `6b8544df5969f12d72891201d2c82b4406d56c51` |
| `20260802152500` | `20260802152500_signal_feedback_api_rpcs.sql` | `512a5c59207fe2ae29fb87e4cceeb6264ab40a34` |
| `20260802163000` | `20260802163000_elite_digest_rpc_boundary_hardening.sql` | `f9b1cb7c09a6183f8bd1f080df37be9a619ba4eb` |

## Existing reviewed historical equivalences

| Live version | Repository version | Repository file | Provenance |
|---|---|---|---|
| `20260807181844` | `20260807000900` | `20260807000900_revoke_data_api_execute_on_secret_accessors.sql` | PR #1284 / merge `3379ee94a05214543fed3d90ee83875fda5aa70e` |
| `20260807181907` | `20260807001000` | `20260807001000_revoke_data_api_default_privileges_on_public.sql` | PR #1284 / merge `3379ee94a05214543fed3d90ee83875fda5aa70e` |
| `20260807182104` | `20260807001100` | `20260807001100_fix_promote_staging_null_object_class.sql` | PR #1284 / merge `3379ee94a05214543fed3d90ee83875fda5aa70e` |
| `20260808202814` | `20260808190400` | `20260808190400_restore_harbourview_admin_guard.sql` | PR #1307 source `243dd7623fd0b33776f6eb20baf033e9f267a38d` |
| `20260808203859` | `20260808190500` | `20260808190500_reconcile_marketplace_image_trust_contract.sql` | PR #1307 source `243dd7623fd0b33776f6eb20baf033e9f267a38d` |

## Required closure evidence

- Fresh read-only live migration list.
- Fresh manifest JSON and Markdown generated from the reconciled branch.
- `applied_not_committed = 0` after approved canonical/equivalence reconciliation.
- `unexpected_pending = 0` after explicit repository disposition/release-control updates.
- `equivalence_mismatches = 0`.
- No production migration apply/repair/stamp during this repository-only pass.

## Current gate

**HOLD** for migration-ledger release safety until all 52 live-only versions and all 82 unexpected pending versions receive an evidence-backed individual disposition.