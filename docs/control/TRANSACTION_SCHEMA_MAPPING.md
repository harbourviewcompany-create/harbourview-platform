# Transaction Schema Mapping

## Rule

Existing tables remain operational. Canonical transaction objects are connected by nullable bridge FKs so current APIs can migrate incrementally without destructive rewrites.

| Existing table | Native transaction role | Bridge added | Canonical vs legacy/projection |
|---|---|---|---|
| `cannabis_operators` | public/regulatory cannabis operator profile | `entity_id` | `entities.id` is canonical identity; operator-specific attributes remain here |
| `ia_counterparties` | private relationship/commercial profile | `entity_id` | `entities.id` is canonical identity; needs/supply/relationship intelligence remains here |
| `operator_licences` | public/regulatory licence observation | `entity_id`, `facility_id` | licence row remains canonical regulatory observation; entity/facility text becomes linkable |
| `hv_evidence` | evidence capture/provenance | reused | canonical evidence store |
| `hv_evidence_documents` | typed private document | reused | canonical commercial/diligence document store |
| `opportunities` | internal commercial opportunity | `entity_id`, `economic_account_id`, `trigger_artifact_id`, `transaction_network_id` | existing text `counterparty` and `value_num` remain compatibility/estimate fields; not contracted/transacted GTV |
| `listings` | sell-side marketplace offer | `product_id`, `economic_account_id` | listing `sku`, `brand`, price, stock, MOQ remain offer snapshots; `products` is canonical product identity |
| `buyer_requests` | buy-side marketplace demand | `product_id`, `economic_account_id`, `opportunity_id` | demand object, not transaction |
| `matches` | supply-demand match candidate | `opportunity_id`, `transaction_network_id` | pre-transaction record |
| `deal_rooms` | transaction collaboration/data-room | `transaction_id` | execution surface; `transactions` is canonical commercial lifecycle |
| `engagements` | Harbourview mandate/client economics | `economic_account_id`, `transaction_id` | retained |
| `commissions` | downstream Harbourview commission/collection | `transaction_id`, `economics_entry_id` | retained; links to evidenced transaction economics |
| `audit_events` | generic mutation audit | reused | canonical audit history |
| `status_history` | lifecycle transition history | reused | canonical status history |
| `workspaces` | tenancy/security | no identity bridge added | never used as a generic external counterparty/economic account |

## Canonical objects

### Identity

`entities` is neutral legal/commercial/regulatory identity. It does not absorb workspace membership, IA commercial notes or cannabis-specific operator fields.

`entity_aliases` resolves legal/trade/former/registry names with provenance.

`entity_facilities` resolves durable external facility identity. Workspace-private `hv_facilities` remains a separate participant dossier.

### Product

`products` represents durable product/SKU identity. `product_batches` represents batch-level truth and is the correct landing point for COA/testing/inventory assertions.

### Economic account

`economic_accounts` represents the buying/contracting unit used for procurement ownership and deduplicated commercial value. `economic_account_members` preserves the individual legal entities/licences/facilities/workspaces that make up the account over time, including non-overlapping historical re-entry.

### Transaction

`transaction_networks` groups both sides of the same economic opportunity. It persists canonical buyer economic account, seller economic account, jurisdiction, transaction object and commercial period inputs; the database derives `double_count_key` from those persisted inputs rather than trusting caller-supplied key text.

`transactions` owns Harbourview-facilitated commercial lifecycle. `transaction_parties` owns buyer/seller/lab/manufacturer/regulator/advisor roles, supports non-overlapping participation periods, and supplies participant-safe authorization membership through explicit workspace party links.

### Truth and diligence

`assertions` is the typed evidence-backed truth layer. Finalized assertions are append-retained; corrections are new assertion rows connected by `supersedes_assertion_id`. `evidence_links` attaches existing evidence to canonical subjects and is traversed by internal economics lineage for assertion-backed economics. `diligence_requirements` turns evidence requests/validation gates into native transaction records.

### Economics and decisions

`transaction_economics_entries` is immutable, append-only and authority-aware. Validated economics must use the transaction's canonical network, duplicate support is serialized before lookup, authoritative transacted/invoiced/settled rows require support, and terminal voids cannot be resurrected or branched behind.

`transaction_decisions` is commercial decision governance and remains separate from `hv_review_decisions` publication/review governance. Superseding decisions are constrained to the same transaction and finalized decisions are append-retained.

## Migration implementation

The native transaction foundation is implemented by eight ordered migrations:

1. `20260811010000_transaction_identity_foundation.sql`
2. `20260811011000_transaction_product_account_foundation.sql`
3. `20260811012000_transaction_core_foundation.sql`
4. `20260811013000_transaction_assertion_diligence_foundation.sql`
5. `20260811014000_transaction_economics_decisions_foundation.sql`
6. `20260811015000_transaction_rls_views_import_staging.sql`
7. `20260811015100_transaction_boundary_hardening.sql`
8. `20260811015200_transaction_review_hardening.sql`

## Compatibility rule

Existing APIs continue reading existing columns until a route is deliberately migrated. The new bridge FKs begin nullable. No production backfill or workbook import is performed by these migrations.