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
npm run lint
npm run test
npm run typecheck
npm run build
```

`.github/workflows/transaction-system-verification.yml` runs the static contract, all eight migrations against disposable PostgreSQL 16, all SQL behavior fixtures, focused transaction/leakage suites, repository lint, the complete repository test suite, typecheck and build. It contains no production migration, workbook import, deployment or production probe step.

## Disposable PostgreSQL fixture order

After the eight migrations apply, the dedicated workflow executes these proofs in order:

1. `tests/transactions/fixtures/verify-applied-schema.sql`
2. `tests/transactions/fixtures/verify-economics-constraint-specificity.sql`
3. `tests/transactions/fixtures/verify-review-hardening.sql`
4. `tests/transactions/fixtures/verify-final-gates.sql`

The applied-schema fixture must remain aligned with the final migration contract; earlier-stage assumptions may not bypass later hardening requirements.

## Schema gates

- 15 canonical tables exist in migration definitions.
- `transaction_import_staging` exists separately as a control table.
- all canonical/staging tables enable RLS.
- no migration drops a table or column or truncates data.
- existing-domain compatibility changes remain nullable FK bridges; review hardening may replace constraints/policies/views without expanding those legacy domain models.
- `workspaces` is not repurposed as canonical identity.
- no second evidence vault or deal-room system is introduced.
- facility coordinates are either both absent or a valid latitude/longitude pair.
- transaction networks persist buyer economic account, seller economic account, jurisdiction, transaction object and commercial period and derive `double_count_key` from those fields.
- transaction and economic-account temporal membership allows non-overlapping re-entry while rejecting overlapping periods.

## Authorization gates

- anon receives no access to new canonical tables/views.
- internal read/write predicates use canonical representable roles (`admin`, `operator`, `analyst`).
- transaction participant access derives from an active workspace membership linked through `transaction_parties`.
- participant party rows require explicit `transaction_parties` visibility.
- evidence links remain internal and do not expand `hv_evidence` access.
- full economics rows remain internal-role-only.
- participant economics is available only through the explicit safe projection with transaction and visibility predicates.
- participant economics omits `network_id`, `recognition_key`, evidence/assertion/document IDs, formula/calculation inputs, classification, creator identity and Harbourview revenue/margin metrics.
- internal views retain `security_invoker = true` where base-table RLS is authoritative; the participant-safe economics projection deliberately uses owner execution plus `security_barrier = true` and explicit caller-bound predicates so participants do not need direct base-table SELECT.

## Economics gates

- network keys are derived from persisted canonical participant/object/jurisdiction/period inputs and are unique.
- economics `network_id` must equal the referenced transaction's canonical `network_id`.
- validated/void recognition keys must match their transaction/network parent, metric and currency fields.
- support-level advisory serialization occurs before duplicate-support lookup.
- repeated support evidence cannot be hidden behind a different caller-supplied recognition key.
- validated replacements must explicitly supersede the current validated recognition leaf.
- void successors terminate the prior current leaf, are terminal and cannot be resurrected or branched behind.
- direct UPDATE/DELETE of economics entries fails closed.
- scenario rows are excluded from current/portfolio economics views.
- `transacted_gtv` cannot be scenario/model/contract based and validated invoice/settlement/primary-evidence rows require evidence/assertion support.
- `evidenced_gtv`, `contracted_gtv`, accrued/invoiced/collected Harbourview revenue require the evidence basis their metric claims.
- `primary_evidence` basis requires evidence/assertion support.
- `contract` basis requires a contract evidence document.
- any recorded amount requires currency.
- gross margin remains signed so loss-making transactions can be represented.

## Assertion and decision integrity gates

- finalized assertions are immutable and cannot be deleted.
- assertion corrections are appended through `supersedes_assertion_id`, preserve subject/predicate identity, and are audit-recorded.
- finalized transaction decisions are immutable and cannot be deleted.
- superseding decisions must remain within the same transaction.
- pending-to-final decision state changes are appended to the canonical audit stream.

## Lineage gates

- direct economics `evidence_id` resolves to `hv_evidence`.
- assertion-backed economics traverses `assertion_id -> evidence_links(subject_type='assertion') -> hv_evidence` when no direct economics `evidence_id` is stored.
- lineage remains an internal surface and is not projected to transaction participants.

## Double-counting tests

1. Same buyer/seller/object/jurisdiction/period yields the same derived network key.
2. Reversing buyer and seller yields a distinct network key.
3. A forged supplied network key is replaced by the derived key.
4. Economics cannot bind a transaction to a different network.
5. A superseding economics entry replaces, rather than adds to, the current recognition leaf.
6. Two current validated leaves with the same recognition key fail closed.
7. The same support cannot create two current validated economics events under different recognition keys.
8. Scenario economics never contributes to current recognized amounts.
9. Contract-only evidence fails for `transacted_gtv`.
10. Unsupported validated invoice/settlement `transacted_gtv` fails.
11. A specific-party economics/diligence row cannot bind to a party from another transaction.
12. A terminal void cannot be bypassed or resurrected.

## Public leakage gates

Participant/public-safe projections must not expose raw evidence/storage fields, intelligence confidence internals, network IDs/double-count keys/recognition keys, Harbourview revenue/margin, unpublished counterparty intelligence, platform-only party rows or internal bridge identifiers.

Existing repository visibility/leakage tests must remain green. The Command Centre listing-count fallback must query an allowed legacy listing column rather than `select('*')` after bridge-column privilege hardening.

## Fixture gates

Static import-contract tests preserve the validated source universe:

- 165 master records
- 69 execution packages
- 64 economic accounts
- 10 transaction networks

No fixture data is inserted by these migrations.

## Exact-head repository gates

Merge readiness requires the final PR head itself—not an earlier commit—to pass:

- Transaction System Verification
- CI
- Branch Verification
- Type check
- Migration Drift Check
- Project Registry Discipline
- repository security/leakage checks required by the branch protection/check suite
- current Codex/CodeRabbit review inspection with no legitimate unresolved P1/P2 defect

If any fix changes the head, affected verification and exact-head protected checks must be re-read on the new SHA.

## Database execution evidence

The focused workflow executes the full eight-migration sequence against disposable PostgreSQL 16 and then runs applied-schema, constraint-specificity, review-hardening and final-gate SQL assertions. This is repository verification only and is not production application evidence.

A true apply/lint against a Supabase development branch may still provide additional release evidence. Creating such a branch can incur a Supabase branch cost and therefore requires an explicit cost-approved execution step. Until that occurs, migration SQL must not be described as production-applied proof.

## GO criteria

GO for merge-ready foundation requires focused branch diff only; full disposable migration sequence PASS; all SQL assertion fixtures PASS; migration contract PASS; targeted transaction tests PASS; existing leakage tests PASS; lint PASS; full repository tests PASS; typecheck PASS; build PASS; exact-head CI/Branch Verification/Migration Drift/Project Registry/security checks PASS; no production migration/import/deploy; control/evidence records updated to the actual eight-migration implementation and final run IDs; and no unresolved legitimate review defect that materially changes schema, RLS, lineage or economics integrity.

Production rollout remains a separate release decision even after repository GO.