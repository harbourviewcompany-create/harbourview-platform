# Transaction RLS Matrix

## Authorization primitives

The transaction foundation reuses `user_roles` and `workspace_members` and adds three fixed-search-path SECURITY DEFINER helpers:

- `hv_has_transaction_role(text[])`
- `hv_is_transaction_participant(uuid)`
- `hv_is_specific_transaction_party(uuid)`

No workspace is created merely because an external counterparty exists.

Current internal role families supported by policy predicates:

- write: `admin`, `operator`, `super_admin`
- read/review: write roles plus `analyst`, `compliance_reviewer`

This accommodates the current live `admin` role while preserving existing Harbourview staff-role compatibility.

## Access matrix

| Object | anon | authenticated transaction participant | analyst/reviewer | operator/admin |
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
| `transaction_parties` | none | parties on explicit party transaction only | read | full |
| `assertions` | none | none direct | read | full |
| `evidence_links` | none | none direct | read | full |
| `diligence_requirements` | none | explicit shared/specific-party requirement only | read | full |
| `transaction_economics_entries` | none | explicit shared/specific-party non-Harbourview metrics only | read | insert + read; mutation blocked by append-only trigger |
| `transaction_decisions` | none | none direct | read | full |
| `transaction_import_staging` | none | none | read | full |

## Harbourview financial isolation

Transaction participants are explicitly denied these metric types through RLS and the participant-safe view:

- `harbourview_addressable_revenue`
- `harbourview_accrued_revenue`
- `harbourview_invoiced_revenue`
- `harbourview_collected_revenue`
- `gross_margin`

Participant access to a transaction does not imply visibility into Harbourview economics.

## Evidence isolation

`evidence_links` remains internal. A participant's ability to read a transaction or diligence requirement does not grant direct read access to `hv_evidence` or `hv_evidence_documents`. Existing evidence RLS remains authoritative.

If participant document sharing is implemented later, it must be an explicit projection/share state rather than a generic evidence-link join.

## Public boundary

All new canonical tables explicitly revoke anonymous table access. No new anonymous SELECT grants are introduced.

The new views use `security_invoker = true`; they do not bypass underlying RLS.

Existing public marketplace/operator/licence policies are not changed by the transaction RLS migration. Public transaction exposure, if added later, must continue Harbourview's allowlisted DTO/projection pattern.

## Required regression assertions

1. Anonymous requests cannot enumerate canonical transaction, account, assertion, diligence or economics rows.
2. Participant in Transaction A cannot infer Transaction B.
3. Participant-safe economics never exposes Harbourview fee/revenue/margin metrics.
4. Participant transaction access does not unlock raw evidence.
5. `workspaces` remains a tenancy boundary rather than a counterparty identity table.
6. Existing public marketplace leakage tests continue to pass.
