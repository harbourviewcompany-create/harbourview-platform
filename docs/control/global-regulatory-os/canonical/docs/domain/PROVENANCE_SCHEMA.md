# Provenance Schema

## Evidence chain

```text
Source Registry -> Acquisition Run -> Immutable Snapshot -> Document -> Document Version
-> Passage/Anchor -> Claim-Evidence Relationship -> Claim/Interpretation/Obligation
-> Review -> Publication Release -> Export/Alert/Determination
```

## Claim constraints

- Every factual, normalized, interpretive, estimated, forecast or recommended claim has a truth class.
- Published claims require at least one supporting evidence passage.
- Contradicting evidence is retained and displayed according to policy.
- Source publication, legal effective and retrieval timestamps remain distinct.
- Exact quoted passages are optional in redistribution-restricted contexts, but stable evidence references remain mandatory.
- Translation never replaces the original passage.
- Correction creates a new version and impact assessment; original release remains in history.

## Evidence bundle manifest

A bundle contains object IDs and versions, source and snapshot hashes, citation anchors, ontology/rule/model versions, review decisions, as-of time, classification, rights instructions and manifest hash. Export bundles must be reproducible from canonical records.

Machine contract: `schemas/json/provenance-claim.schema.json`.  
Canonical tables: `evidence.*`, `publication.releases`, `governance.corrections`.
