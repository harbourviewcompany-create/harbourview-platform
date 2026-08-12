# Transaction RLS Matrix

## Authorization primitives

The transaction foundation reuses `user_roles` and `workspace_members` and adds three fixed-search-path SECURITY DEFINER helpers:

- `hv_has_transaction_role(text[])`
- `hv_is_transaction_participant(uuid)`
- `hv_is_specific_transaction_party(uuid)`

No workspace is created merely because an external counterparty exists.

Current internal role families supported by the repository's canonical `user_roles` constraint:

- write: `admin`, `operator`
- read/review: write roles plus `analyst`
- `viewer` receives no transaction-domain internal access by default

## Access matrix

| Object | anon | authenticated transaction participant | analyst | operator/admin |
|---|---|---|---|---|
| `entities` | none | none | read | full RLS-authorized CRUD |
| `entity_aliases` | none | none | read | full |
| `entity_facilities` | none | none | read | full |
| `products` | none direct | none direct | read | full |
| `product_batches` | none | none direct | read | full |
| `economic_accounts` | none | none | read | full |
| `economic_account_members` | none | none | read | full |
| `transaction_networks` | none | none | read | full |
| `transactions` | none | explicit party transaction only | read | full |
| `transaction_parties` | none | only rows explicitly marked `transaction_parties` on an accessible transaction | read | full |
| `assertions` | none | none direct | read | full; finalized rows mutation-guarded |
| `evidence_links` | none | none direct | read | full |
| `diligence_requirements` | none | explicit shared/specific-party requirement only | read | full |
| `transaction_economics_entries` | none | none direct | read | insert + read; mutation blocked by append-only trigger |
| `transaction_participant_economics_v1` | none | explicit shared/specific-party non-Harbourview projection only | readable through internal role/base privileges as applicable | readable |
| `transaction_decisions` | none | none direct | read | full; finalized rows mutation-guarded |
| `transaction_import_staging` | none | none | read | full |

## Harbourview financial isolation

Transaction participants are explicitly denied these metric types through the participant-safe view:

- `harbourview_addressable_revenue`
- `harbourview_accrued_revenue`
- `harbourview_invoiced_revenue`
- `harbourview_collected_revenue`
- `gross_margin`

Participant access to a transaction does not imply visibility into Harbourview economics.

The participant projection also omits internal transaction-network identifiers, `recognition_key`, evidence/assertion/document identifiers, formula/calculation inputs, classification and creator identity.

## Evidence isolation

`evidence_links` remains internal. A participant's ability to read a transaction or diligence requirement does not grant direct read access to `hv_evidence` or `hv_evidence_documents`. Existing evidence RLS remains authoritative.

Internal `transaction_lineage_v1` may traverse `evidence_links` from an economics `assertion_id` to supporting `hv_evidence`; this lineage is not the participant projection.

If participant document sharing is implemented later, it must be an explicit projection/share state rather than a generic evidence-link join.

## Public boundary

All new canonical tables explicitly revoke anonymous table access. No new anonymous SELECT grants are introduced.

Internal transaction views use `security_invoker = true` where base-table RLS should remain authoritative. `transaction_participant_economics_v1` deliberately uses owner execution with `security_barrier = true` plus explicit caller-bound transaction and visibility predicates so participants can receive the allowlisted economic projection without direct SELECT on the internal economics base table.

Existing marketplace bridge columns are excluded from legacy anon/authenticated column grants. Existing public marketplace/operator/licence behavior remains outside the canonical transaction tables.

## Required regression assertions

1. Anonymous requests cannot enumerate canonical transaction, account, assertion, diligence or economics rows.
2. Participant in Transaction A cannot infer Transaction B.
3. Participant party access honors `visibility_scope = 'transaction_parties'` or the specific-party predicate where applicable.
4. Participant-safe economics never exposes Harbourview fee/revenue/margin metrics, `network_id`, `recognition_key`, evidence lineage or calculation internals.
5. Participant transaction access does not unlock raw evidence.
6. `workspaces` remains a tenancy boundary rather than a counterparty identity table.
7. Existing public marketplace leakage tests continue to pass.