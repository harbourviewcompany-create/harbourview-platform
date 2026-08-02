# Global Cannabis Regulatory Intelligence and Market-Entry Operating System

## Technical Control Pack v1.0

**Architecture date:** 2026-07-31  
**Status:** Design GO; implementation HOLD pending operator decisions in `docs/control/09_GO_HOLD_GATES.md`.  
**Scope:** Full global target state. Phases define execution order only; they do not remove jurisdictions, source classes, products, activities, modules or transaction capabilities.

## Mission

Build a global operating system that converts authoritative source material into immutable evidence, normalized regulatory concepts, versioned changes, customer-specific applicability, structured obligations, controls, licences, counterparties, corridor determinations, market metrics and auditable execution.

```text
Source -> Snapshot -> Change -> Provision -> Interpretation -> Applicability
-> Obligation -> Control -> Evidence -> Market-Access Decision -> Counterparty
-> Transaction Readiness -> Outcome
```

## Architecture rules

1. PostgreSQL is the canonical transactional system of record.
2. Raw source snapshots are immutable and retained separately from processed data.
3. Search, embeddings, caches, lakehouse tables and graph projections are derived and rebuildable.
4. No published factual claim may exist without evidence lineage.
5. Fact, interpretation, estimate, forecast and recommendation remain distinct record types.
6. Public outputs use explicit allowlisted projections; private canonical rows are never serialized and then redacted.
7. High-risk legal, trade, quality, licensing, sanctions, shipment and transaction outputs require human approval.
8. AI may propose candidates; it may not autonomously publish high-risk determinations or authorize regulated activity.
9. Every determination must explain why it applies, what supports it, what remains uncertain and what could alter it.
10. Coverage gaps remain visible in a global coverage registry.
11. GO requires evidence; missing proof, stale evidence, authorization gaps or unresolved rights produce HOLD.

## Repository map

```text
docs/control/      Constitution, architecture, governance, verification, costs, roadmap and gates
docs/adr/          Architecture decision records
docs/domain/       Ontology, DSL, events and API conventions
docs/workflows/    Analyst, legal, correction and corridor workflows
docs/services/     Exact bounded contexts and service ownership
docs/security/     Threat model, authorization and leakage controls
db/migrations/     PostgreSQL baseline schema, RLS and public projections
api/               OpenAPI contract
events/            Async event contract
schemas/json/      Machine-readable source, provenance, applicability, corridor, metric and AI contracts
infra/             Infrastructure, environments, deployment and recovery
tests/             Test strategy and evidence requirements
tickets/           Phased epics and numbered engineering tickets
ops/               Role matrix, source onboarding and release evidence templates
```

## Delivery phases

| Phase | Purpose |
|---|---|
| 0 | Constitution, global universe, ontology, provenance, security and source rights |
| 1 | Source acquisition, immutable evidence, documents, diffs, regulatory graph, search and analyst review |
| 2 | Organization profiles, applicability, obligations, controls, alerts, tasks and evidence |
| 3 | Entities, licences, facilities, quality, enforcement and counterparty graph |
| 4 | Product classification, import/export corridors, permits, customs, quality gates and market entry |
| 5 | Canonical market metrics, reconciliation, pricing, capacity, signals and scenarios |
| 6 | Partner discovery, deal rooms, transaction readiness, shipment milestones and outcomes |
| 7 | Continuous global depth, government workflows, more languages and private deployments |
