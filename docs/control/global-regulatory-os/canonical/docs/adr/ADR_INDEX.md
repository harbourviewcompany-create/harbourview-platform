# Architecture Decision Records

| ADR | Decision | Status |
|---|---|---|
| 001 | PostgreSQL is canonical; search, graph and analytical stores are derived | Accepted |
| 002 | Original source bytes enter immutable storage before processing | Accepted |
| 003 | Modular core plus isolated acquisition/document/AI/export workers | Accepted |
| 004 | Hybrid lexical/semantic search with visibility-separated indexes | Accepted |
| 005 | Durable workflows for acquisition, review, corrections, alerts and corridors | Accepted |
| 006 | Versioned event envelope with evidence and correlation metadata | Accepted |
| 007 | Layered application policy, RLS and explicit projections | Accepted |
| 008 | Ontology and mappings are effective-dated and versioned | Accepted |
| 009 | AI produces candidates; humans retain high-risk authority | Accepted |
| 010 | Public/private outputs are separate allowlisted projections | Accepted |
| 011 | Graph analytics are derived from canonical relationship records | Accepted |
| 012 | Lakehouse is analytical, not canonical transactional truth | Accepted |
| 013 | Regional data planes are introduced only for verified need | Accepted |
| 014 | API and event contracts precede UI-specific coupling | Accepted |
| 015 | Relative dates and countdowns are computed at request time | Accepted |

## ADR-001 Canonical PostgreSQL

PostgreSQL owns canonical transactional facts, effective-dated records, review state and tenant data. Other stores are rebuildable projections. This avoids multiple editable sources of truth.

## ADR-002 Immutable Evidence

A secure acquisition worker writes original bytes and integrity metadata before any parser, OCR, translation or model processing. Processed text cannot substitute for original evidence.

## ADR-003 Modular Core and Workers

Start with strict bounded modules in one deployable application where practical, while independently deploying source acquisition, document processing, AI gateway, notification, search indexing and exports. Extract more services only for verified isolation, scaling, runtime or team ownership.

## ADR-004 Derived Hybrid Search

Use lexical and semantic retrieval together because legal research requires exact phrase/identifier retrieval and conceptual matching. Search results remain subject to authorization and are never canonical.

## ADR-005 Durable Workflows

Long-running work with retries, timers, human review, deadlines, compensation and recovery uses a durable workflow engine. Workflow versions and authorization checks are explicit.

## ADR-006 Event Envelope

Use a CloudEvents-like envelope with event ID, versioned type, tenant, actor, correlation, causation, classification and evidence references. Delivery is at least once and consumers are idempotent.

## ADR-007 Layered Authorization

Application policy decides business authorization, PostgreSQL RLS limits tenant rows, and output projections control publication. No layer replaces the others.

## ADR-008 Versioned Ontology

Canonical concepts and jurisdiction mappings change over time. Historical evaluations resolve using the ontology version effective at the determination date.

## ADR-009 Human Authority

AI may extract, classify, summarize and propose. High-risk obligations, legal interpretations, corridor gates, sanctions and transaction eligibility require authorized human approval.

## ADR-010 Projection Separation

Public, partner and tenant DTOs are explicitly designed and contract-tested. Private canonical objects are not serialized and redacted after the fact.

## ADR-011 Derived Graph

Entities and relationships are stored canonically in PostgreSQL. A graph engine or projection may optimize analysis, but direct graph writes are prohibited.

## ADR-012 Analytical Lakehouse

Raw and standardized analytical datasets use object storage, Parquet and open table formats. Canonical metric definitions, rights and approval remain transactional records.

## ADR-013 Regional Deployment

Do not add multi-region writes by default. Introduce regional data planes for contractual, legal, latency or resilience evidence, with controlled schema/policy versions.

## ADR-014 API-First

Capabilities expose versioned internal/external contracts and events. User interfaces consume those capabilities rather than embedding business rules.

## ADR-015 Runtime Time Calculations

Countdowns and relative time are derived from canonical timestamps at request time. User interfaces display source date, effective date and as-of timestamp.

## Decision process

New decisions require an ADR with owner, status, context, decision, consequences, supersession link and review date. Accepted ADRs are append-only; replacement occurs through an explicit superseding ADR rather than silent editing.

