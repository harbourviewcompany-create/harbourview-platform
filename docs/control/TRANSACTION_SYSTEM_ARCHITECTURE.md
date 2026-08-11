# Harbourview Native Transaction System Architecture

## Status

Branch implementation only. No migration in this packet is authorized for production application by virtue of existing in the repository.

Baseline main SHA: `150c24eec7d76b9be7322ac0e6926134dcd17d6f`.

## Purpose

Turn regulatory/commercial intelligence into evidence-backed transactions without replacing Harbourview's existing marketplace, intelligence, evidence, workspace, deal-room, commission, audit or public-projection systems.

## Non-negotiable boundaries

- `workspaces` remains the tenancy/security boundary. It is not a canonical counterparty or economic-account table.
- `hv_evidence` remains the canonical captured-evidence/provenance store.
- `hv_evidence_documents` remains the typed private document layer.
- `listings` and `buyer_requests` remain marketplace offer/demand objects, not canonical product or transaction records.
- `matches` remains a pre-transaction match candidate.
- `deal_rooms` remains a collaboration/data-room surface, not the transaction ledger.
- `audit_events` and `status_history` remain the audit/lifecycle history systems.
- No canonical transaction table is anonymously readable; public exposure remains reviewed DTO/projection based.
- Harbourview revenue is separate from transaction GTV.
- Transaction economics is append-only; corrections are new superseding entries.

## Canonical additive tables

1. `entities`
2. `entity_aliases`
3. `entity_facilities`
4. `products`
5. `product_batches`
6. `economic_accounts`
7. `economic_account_members`
8. `transaction_networks`
9. `transactions`
10. `transaction_parties`
11. `assertions`
12. `evidence_links`
13. `diligence_requirements`
14. `transaction_economics_entries`
15. `transaction_decisions`

Control-only staging adds `transaction_import_staging`; it is not a canonical domain object.

## End-to-end chain

```text
source/regulatory change
  -> hv_artifact / signal
  -> hv_evidence
  -> assertion
  -> entity/licence/facility/product/batch
  -> economic account
  -> opportunity
  -> match
  -> transaction network
  -> transaction
  -> transaction parties
  -> deal room
  -> diligence requirements
  -> evidence receipt/validation
  -> evidenced economics
  -> contracted GTV
  -> transacted GTV
  -> Harbourview revenue entitlement
  -> commission/invoice/collection
  -> audit_events + status_history
```

## Economics authority ladder

`estimated_gtv -> modeled_gtv -> evidenced_gtv -> contracted_gtv -> transacted_gtv`

These are independent immutable entries. Stronger evidence does not overwrite earlier history.

Harbourview economics uses separate metric types:

- `harbourview_addressable_revenue`
- `harbourview_accrued_revenue`
- `harbourview_invoiced_revenue`
- `harbourview_collected_revenue`

Scenario sensitivity never becomes booked or collected revenue.

## Double-counting controls

`transaction_networks.double_count_key` identifies one economic network event and is unique.

Canonical format:

```text
NETWORK|JURISDICTION|BUYER_ACCOUNT|SELLER_ACCOUNT|TRANSACTION_OBJECT|COMMERCIAL_PERIOD
```

`transaction_economics_entries.recognition_key` identifies one economic recognition event beneath the network/transaction.

Canonical format:

```text
ECON|NETWORK...|METRIC_TYPE|ECONOMIC_EVENT|CURRENCY
```

A validated non-scenario replacement must explicitly supersede the current validated leaf with the same recognition key. The current-economics view returns only leaves, so buyer/seller duplicates and prior authority states cannot both enter portfolio sums.

## Temporal truth

Canonical identity, facility, product, batch, account membership, party membership and assertions carry temporal validity fields. Historical records are retained rather than mutated into current truth.

## Evidence lineage

```text
hv_evidence
  -> evidence_links
  -> assertions
  -> transaction_economics_entries
```

Primary-evidence economics requires an evidence or assertion link. Contract-basis economics requires a typed evidence document. `transacted_gtv` cannot be scenario/model based.

## Existing-system reuse

See `TRANSACTION_SCHEMA_MAPPING.md` for the exact bridge contract and `TRANSACTION_RLS_MATRIX.md` for access boundaries.
