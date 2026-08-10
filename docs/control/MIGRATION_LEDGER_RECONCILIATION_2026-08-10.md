# Migration ledger reconciliation — 2026-08-10

## Scope

Repository-only reconciliation for seven production migration ledger versions that were reported as remote-only by `scripts/migration-ledger-manifest.mjs`.

No production migration, ledger repair, Supabase DDL/DML, deployment, secret, or runtime change is part of this reconciliation.

## Content-bound live-version aliases

The following production apply-time versions are equivalent to exact repository-authored migration artifacts. The equivalence manifest pins each local file by Git blob SHA and the drift verifier recognizes an alias only while the local version, filename, and blob SHA all match.

| Live version | Canonical repository version | Source |
|---|---|---|
| `20260807181844` | `20260807000900_revoke_data_api_execute_on_secret_accessors.sql` | PR #1284 |
| `20260807181907` | `20260807001000_revoke_data_api_default_privileges_on_public.sql` | PR #1284 |
| `20260807182104` | `20260807001100_fix_promote_staging_null_object_class.sql` | PR #1284 |
| `20260808202814` | `20260808190400_restore_harbourview_admin_guard.sql` | PR #1307 source + recorded production apply evidence |
| `20260808203859` | `20260808190500_reconcile_marketplace_image_trust_contract.sql` | PR #1307 source + recorded production apply evidence |

A hash mismatch is not an allowlisted exception. It invalidates the equivalence and leaves the production version classified as remote-only drift.

## Canonicalized live-only SQL

Two production versions did not have a canonical migration file on `main`. Their exact recovered production statements are now recorded under the live versions:

- `20260808112235_expose_signal_quality_to_api.sql`
- `20260808205222_harden_marketplace_item_images_anon_grants.sql`

These files document already-applied production state. This reconciliation does not authorize or invoke them against production.

## Residual security issue kept separate

This ledger reconciliation does **not** close the separate `supabase_admin` default-ACL issue found during the read-only production review.

The `20260807181907` / `20260807001000` migration removed the reachable `postgres`-owned public-schema default grants but its own guarded implementation could not guarantee mutation of defaults owned by `supabase_admin`. Read-only production inspection on 2026-08-10 still found `supabase_admin` default ACL entries granting `anon` / `authenticated` privileges on public-schema tables, sequences, and functions.

That residual is a production security-hardening item, not a migration identity mismatch. It must remain visible and must not be marked resolved by the historical-version alias.

## Verification contract

`migration-ledger-manifest.mjs` now separates:

- `historical_live_version_aliases`: remote versions proven equivalent to an exact pinned repository artifact;
- `applied_not_committed`: unexplained remote-only versions;
- `live_version_equivalence_mismatches`: configured aliases whose local file/version/hash no longer matches.

Drift remains fail-closed. In drift mode, either unexplained remote-only versions or an equivalence mismatch causes failure.

The node:test contract includes a tamper case proving that changing an aliased migration file makes the alias invalid and restores the production version to `applied_not_committed`.
