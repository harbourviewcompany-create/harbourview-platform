# Global Regulatory OS Phase 0 — PR #1248 reconciliation evidence

Date: 2026-08-12

## Reconciliation boundary

- Original PR head: `c924ba97031a7f17d7b74e0866a1061c8ed70be6`.
- Operator-specified main target: `73bbbd305796d853d7c25277b3d604002dd5f410`.
- Reconciliation merge commit: `36e47df1fee3df9e4350f7d1f9ce3e7299f05048`.
- Merge parents are the operator-specified main target first and the original PR head second, preserving both histories.
- The complete `docs/control/global-regulatory-os/**` package, `scripts/global-reg-os/**`, and dedicated Phase 0 workflow were carried forward from the original PR. Current-main files outside that scope were preserved from the specified main target.

## Shared control-log conflict resolution

`docs/control/DATABASE_CONTROL.md` and `docs/control/EVIDENCE_LOG.md` changed independently on both sides after the original PR merge base. The reconciliation retained the current-main versions rather than replacing later mainline evidence with the older PR copies. The legitimate PR control intent is preserved here:

- repository/disposable PostgreSQL 17 verification only;
- closed PR #1234 remains historical evidence only;
- controlling archive is `source/global-cannabis-regulatory-os-control-pack-v1.0.zip`, expected SHA-256 `33a1b3de6f295aaeaf61017937a21b364bac7c0600f4038706013cb6b47cd136`;
- canonical migrations remain isolated under this control package and are not active `supabase/migrations/**` migrations;
- trusted request identity is established through `hv_authenticator` and IAM-derived subject/tenant authorization rather than client-settable custom GUCs;
- PostgreSQL 17 clean-install and simulated-upgrade verification remain mandatory;
- no production migration, write, secret provisioning, source import, deployment, alias movement, or other production action is authorized by this PR.

## Validated defect remediation

### Controlling ZIP secret coverage

`scripts/global-reg-os/check_secrets.py` now scans the controlling ZIP rather than excluding it. ZIP processing is deterministic and fail-closed for non-canonical or traversal paths, duplicate names, encrypted members, unsafe member types, oversized members/archives, excessive compression ratios, unreadable members, and size mismatches. Every scanned repository file and archive member emits its byte count and SHA-256; a deterministic aggregate scan-evidence SHA-256 is emitted for the full scan set.

### Pre-existing database role hardening

`canonical/db/migrations/0013_database_roles_and_grants.sql` now explicitly normalizes the complete security-sensitive attribute contract for `hv_context_owner`, `hv_authenticator`, and all runtime roles. Runtime/authenticator roles are forced to `NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`; `hv_context_owner` is likewise non-login/non-inheriting/non-superuser/non-creation/non-replication while retaining the narrowly required `BYPASSRLS`. The migration immediately re-reads `pg_roles` and fails if the contract is not satisfied.

The simulated Harbourview upgrade fixture now begins with hostile same-name roles carrying `LOGIN`, `INHERIT`, creation, replication and `BYPASSRLS` attributes, then proves the canonical migration normalizes them while preserving existing Harbourview data.

## Evidence still required on final exact head

- controlling archive and source-manifest hash verification;
- deterministic regenerated canonical manifest;
- complete package and ZIP-member secret scan;
- JSON Schema, OpenAPI and AsyncAPI validation;
- PostgreSQL 17 clean install and hostile-prestate simulated upgrade;
- trusted-context, RLS and negative privilege-escalation tests;
- active Supabase migration isolation and migration-ledger checks;
- lint, typecheck, full tests, security/leakage and Next.js build;
- Branch Verification and Project Registry Discipline;
- exact-head review evidence and preview status.

## Production boundary

No production environment, Supabase project, Edge Function, Vercel production deployment, production alias, production database, production secret, or live data was changed during this reconciliation.
