# System Architecture

## Style

Use a modular transactional core with independently scalable acquisition, document-processing, AI, search-indexing, notification and export workers. Extract services when isolation, security, scaling, runtime or ownership requires it.

PostgreSQL is canonical. Object storage retains immutable source evidence. OpenSearch is a derived retrieval index. Lakehouse tables are derived analytical assets. Graph projections are rebuilt from canonical entity and relationship records. A durable workflow engine coordinates long-running, timer-driven and failure-prone work.

## Bounded contexts

| Context | Owns |
|---|---|
| Identity and Tenancy | Tenants, users, memberships, roles, attributes and service accounts |
| Entitlements | Plans, modules, jurisdictions, data rights and quotas |
| Jurisdiction Registry | Jurisdictions, authorities, programmes, relationships and coverage |
| Source Operations | Sources, endpoints, schedules, rights, credentials references and health |
| Evidence and Documents | Snapshots, documents, versions, passages, translations, citations and hashes |
| Regulatory Intelligence | Instruments, provisions, changes, definitions and interpretations |
| Ontology | Canonical concepts, hierarchies and jurisdiction mappings |
| Applicability and Obligations | Rules, profiles, evaluations, obligations and controls |
| Entity and Licence | Entities, people, ownership, facilities, licences, certification and enforcement |
| Counterparty Risk | Verification, risk factors, monitoring and performance |
| Product Classification | Composition, form, use and jurisdictional classification |
| Corridor and Market Access | Routes, gates, permits, documents, determinations and projects |
| Market Intelligence | Metric definitions, observations, estimates, forecasts and scenarios |
| Alerts and Workflow | Watchlists, alerts, tasks, deadlines, approvals and evidence requests |
| AI Governance | Models, prompts, runs, evaluations, overrides and release status |
| Publication | Releases, public/partner/tenant projections, reports, corrections and exports |
| Audit and Governance | Audit events, incidents, retention, legal holds and release evidence |

## Canonical and derived stores

| Store | Canonical | Rebuildable |
|---|---:|---:|
| PostgreSQL domain schemas | Yes | From backup/history only |
| Immutable source object store | Yes for evidence | No |
| Processed object store | No | Yes |
| OpenSearch/embedding indexes | No | Yes |
| Lakehouse/warehouse | No for transactional truth | Yes |
| Graph projection | No | Yes |
| Redis cache | No | Yes |

## Data flow

```text
Official/Licensed Source -> Rights Check -> Secure Fetch -> Immutable Snapshot
-> Parse/OCR/Translate -> Version and Citation Anchors -> Structural/Semantic Diff
-> Regulatory/Entity/Metric Candidates -> Automated Validation -> Human Review
-> Canonical Publication -> Applicability/Corridor Evaluation -> Alerts/Tasks/API
-> Customer Evidence and Outcomes -> Correction and Evaluation Loop
```

## Environments

Local development; ephemeral pull-request; integration; staging with synthetic/licensed-test data; pre-production; regional production; isolated research sandbox. Production evidence, customer data and secrets must not enter local or pull-request environments.
