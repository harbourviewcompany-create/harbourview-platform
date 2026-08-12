# Licence and Counterparty Graph Specification

## Canonical rule

PostgreSQL tables in `registry` are authoritative. Graph/search representations are generated projections. Direct writes to a graph projection are prohibited.

## Node families

- Legal entity and government entity.
- Person and beneficial owner.
- Facility and site.
- Licence class and licence instance.
- Permit, registration and authorization.
- Certification and accreditation.
- Inspection, finding, enforcement action and recall.
- Product, brand and batch.
- Regulator, certification body and laboratory.
- Importer, exporter, distributor, pharmacy, prescriber and logistics provider.
- Transaction, shipment and commercial relationship.
- Jurisdiction and authority.

## Edge model

Every edge stores relationship kind, source and target, confidence, effective period, review status and evidence references. Ownership edges may include percentage and control basis. Operational edges may include activity and product scope.

## Identity and merge policy

| Confidence basis | Automated action |
|---|---|
| Same official identifier and authority | Merge candidate; auto-approval only if no material conflict |
| Same verified licence and exact legal name/address | High-confidence candidate |
| Name/address/domain similarity only | Human review required |
| Conflicting official identifiers | Never auto-merge |
| Person match without reliable identifier | Restricted specialist review |

Merges retain source identities, aliases and a reversible operation log. Splits restore historical relationships and trigger dependent projection rebuilds.

## Licence history

A licence record distinguishes the licence instance from each status or scope event. Status, effective date, expiry, authorized activities, products, facilities, conditions and evidence are time-versioned. Currentness is computed from the latest approved event, not overwritten fields alone.

## Counterparty profile

A tenant-specific profile references global canonical facts plus customer-private assessments. Risk components include:

- Licence validity and authorized scope.
- Ownership transparency.
- Facility and quality status.
- Inspection, enforcement and recall history.
- Sanctions, debarment and litigation.
- Import/export and transaction history.
- Documentation completeness.
- Delivery, quality and payment outcomes.
- Dependency and concentration.
- Data freshness, source quality and unresolved conflicts.

The profile stores score version and components. The score cannot exist without decomposable inputs and supporting evidence.

## Access control

- Public projections expose only officially public, approved fields.
- Personal and beneficial-owner data follow purpose, region and classification controls.
- Customer notes and performance records are tenant-private.
- Privileged legal assessments are separate from factual registry data.
- Search and graph queries enforce the same authorization scope as canonical reads.

## Projection queries

Required graph workloads include ownership traversal, common-control detection, licence-to-facility paths, qualified-corridor counterparties, enforcement propagation, certification expiry and concentration analysis. Each result returns canonical IDs and evidence links.
