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
7. `20260811015100_transaction_boundary_hardening.sql`
8. `20260811015200_transaction_review_hardening.sql`

## Repository verification commands

```bash
node scripts/verify-transaction-system.mjs
npx vitest run tests/transactions
npm run test:visibility
npm run test:services-public-leakage
npm run typecheck
npm run build
```

`.github/workflows/transaction-system-verification.yml` runs those checks on the focused implementation branch and contains no production migration, workbook import, deployment or production probe step.

## Schema gates

- 15 canonical tables exist in migration definitions.
- `transaction_import_staging` exists separately as a control table.
- all canonical/staging tables enable RLS.
- no migration drops a table or column or truncates data.
- existing-domain compatibility changes remain nullable FK bridges; review hardening may replace constraints/policies/views without expanding those legacy domain models.
- `workspaces` is not repurposed as canonical identity.
- no second evidence vault or deal-room system is introduced.
- facility coordinates are either both absent or a valid latitude/longitude pair.

## Authorization gates

- anon receives no access to new canonical tables/views.
- internal read/write predicates use canonical representable roles (`admin`, `operator`, `analyst`).
- transaction participant access derives from an active workspace membership linked through `transaction_parties`.
- participant party rows require explicit `transaction_parties` visibility.
- evidence links remain internal and do not expand `hv_evidence` access.
- full economics rows remain internal-role-only.
- participant economics is available only through the explicit safe projection with transaction and visibility predicates.
- internal views retain `security_invoker = true`; the participant-safe economics projection deliberately uses owner execution plus explicit caller-bound predicates so participants do not need direct base-table SELECT.

## Economics gates

- network keys are deterministic and unique.
- validated recognition keys must match their transaction/network parent, metric and currency fields.
- repeated support evidence cannot be hidden behind a different caller-supplied recognition key.
- validated replacements must explicitly supersede the current validated recognition leaf.
- void successors terminate the prior current leaf.
- direct UPDATE/DELETE of economics entries fails closed.
- scenario rows are excluded from current/portfolio economics views.
- `transacted_gtv` cannot be scenario/model/contract based.
- `evidenced_gtv`, `contracted_gtv`, invoiced revenue and collected revenue require the evidence basis their metric claims.
- `primary_evidence` basis requires evidence/assertion support.
- `contract` basis requires a contract evidence document.
- any recorded amount requires currency.
- gross margin remains signed so loss-making transactions can be represented.

## Decision integrity gates

- finalized transaction decisions are immutable.
- decision rows cannot be deleted.
- pending-to-final state changes are appended to the canonical audit stream.

## Double-counting tests

1. Same buyer/seller/object/period yields the same network key.
2. Reversing buyer and seller yields a distinct network key.
3. A superseding economics entry replaces, rather than adds to, the current recognition leaf.
4. Two current validated leaves with the same recognition key fail closed in application proof and are rejected by the database insert-chain trigger.
5. Scenario economics never contributes to current recognized amounts.
6. Buyer-side and seller-side records map to one network/economic event rather than two portfolio values.
7. Contract-only evidence fails specifically at the `transacted_gtv` basis constraint.
8. A specific-party economics row cannot bind to a party from another transaction.

## Public leakage gates

Participant/public-safe projections must not expose raw evidence/storage fields, intelligence confidence internals, network double-count keys, Harbourview revenue/margin, unpublished counterparty intelligence, platform-only party rows or internal bridge identifiers.

Existing repository visibility/leakage tests must remain green. The Command Centre listing-count fallback must query an allowed legacy listing column rather than `select('*')` after bridge-column privilege hardening.

## Fixture gates

Static import-contract tests preserve the validated source universe:

- 165 master records
- 69 execution packages
- 64 economic accounts
- 10 transaction networks

No fixture data is inserted by these migrations.

## Database execution evidence

The focused workflow executes the full eight-migration sequence against disposable PostgreSQL 16 and then runs applied-schema and constraint-specificity SQL assertions. This is repository verification only and is not production application evidence.

A true apply/lint against a Supabase development branch may still provide additional release evidence. Creating such a branch can incur a Supabase branch cost and therefore requires an explicit cost-approved execution step. Until that occurs, migration SQL must not be described as production-applied proof.

## GO criteria

GO for merge-ready foundation requires:

- focused branch diff only
- full disposable migration sequence PASS
- applied-schema and constraint-specificity assertions PASS
- migration contract PASS
- targeted Vitest PASS
- existing leakage tests PASS
- typecheck PASS
- build PASS
- Project Registry Discipline PASS
- Migration Drift Check parser/placeholder gates PASS as applicable to a pull request
- no production migration/import/deploy
- no unresolved review defect that materially changes schema/RLS/economics integrity

Production rollout remains a separate release decision even after repository GO.
