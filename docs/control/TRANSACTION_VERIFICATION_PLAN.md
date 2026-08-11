# Transaction System Verification Plan

## Scope

Verification applies to the additive native transaction foundation only. It must not apply migrations to production, import the controlled workbook into production, or deploy the application.

## Migration order

1. `20260811010000_transaction_identity_foundation.sql`
2. `20260811011000_transaction_product_account_foundation.sql`
3. `20260811012000_transaction_core_foundation.sql`
4. `20260811013000_transaction_assertion_diligence_foundation.sql`
5. `20260811014000_transaction_economics_decisions_foundation.sql`
6. `20260811015000_transaction_rls_views_import_staging.sql`

## Repository verification commands

```bash
node scripts/verify-transaction-system.mjs
npx vitest run tests/transactions
npm run test:visibility
npm run test:services-public-leakage
npm run typecheck
npm run build
```

`.github/workflows/transaction-system-verification.yml` runs those checks on the focused implementation branch and contains no deployment or production probe step.

## Schema gates

- 15 canonical tables exist in migration definitions.
- `transaction_import_staging` exists separately as a control table.
- all canonical/staging tables enable RLS.
- no migration drops a table or column or truncates data.
- all existing-table changes are nullable additive bridge columns/constraints/indexes.
- `workspaces` is not repurposed as canonical identity.
- no second evidence vault or deal-room system is introduced.

## Authorization gates

- anon receives no access to new canonical tables/views.
- internal read and write role predicates are explicit.
- transaction participant access derives from an active workspace membership linked through `transaction_parties`.
- evidence links remain internal and do not expand `hv_evidence` access.
- participant-safe economics excludes Harbourview revenue/margin metrics.
- views use `security_invoker = true`.

## Economics gates

- network keys are deterministic and unique.
- economics recognition keys begin with `ECON|`.
- validated replacements must explicitly supersede the current validated recognition leaf.
- direct UPDATE/DELETE of economics entries fails closed.
- scenario rows are excluded from current/portfolio economics views.
- `transacted_gtv` cannot be scenario/model based.
- `primary_evidence` basis requires evidence/assertion support.
- `contract` basis requires a contract evidence document.

## Double-counting tests

1. Same buyer/seller/object/period yields the same network key.
2. Reversing buyer and seller yields a distinct network key.
3. A superseding economics entry replaces, rather than adds to, the current recognition leaf.
4. Two current validated leaves with the same recognition key fail closed in application proof and are rejected by the database insert-chain trigger.
5. Scenario economics never contributes to current recognized amounts.
6. Buyer-side and seller-side records map to one network/economic event rather than two portfolio values.

## Public leakage gates

Participant/public-safe projections must not expose raw evidence/storage fields, intelligence confidence internals, network double-count keys, Harbourview revenue/margin, or unpublished counterparty intelligence.

Existing repository visibility/leakage tests must remain green.

## Fixture gates

Static import-contract tests preserve the validated source universe:

- 165 master records
- 69 execution packages
- 64 economic accounts
- 10 transaction networks

No fixture data is inserted by these migrations.

## Database execution evidence

A true SQL apply/lint against a fresh Supabase development branch is stronger than static migration verification. Creating such a branch can incur a Supabase branch cost and therefore requires an explicit cost-approved execution step. Until that occurs, migration SQL must not be described as production-applied proof.

## GO criteria

GO for merge-ready foundation requires:

- focused branch diff only
- migration contract PASS
- targeted Vitest PASS
- existing leakage tests PASS
- typecheck PASS
- build PASS
- no production migration/import/deploy
- no unresolved review defect that materially changes schema/RLS/economics integrity

Production rollout remains a separate release decision even after repository GO.
