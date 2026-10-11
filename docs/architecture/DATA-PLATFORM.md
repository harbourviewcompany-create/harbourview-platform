# Harbourview Data Platform

## Decision

Harbourview is moving from a single-provider database architecture to a provider-neutral, workload-partitioned data platform.

The target production topology is:

- **Core relational store** — authoritative accounts, organizations, memberships, workspaces and workflow state.
- **Independent identity** — authentication is isolated from application data and regulatory ingestion.
- **Intelligence document store** — regulations, jurisdictions, signals, enrichment and provenance.
- **Immutable evidence store** — original source artifacts addressed by object key + SHA-256.
- **Cache** — disposable acceleration only; never authoritative.
- **Event/workflow backbone** — asynchronous fan-out, retries, DLQ and replay.
- **Search/vector** — derived index, fully rebuildable.
- **Analytics SQL** — derived projections, never on the critical request path.

Candidate providers are PlanetScale Postgres (core), a dedicated identity provider, MongoDB Atlas (intelligence), Cloudflare R2 (evidence), Upstash Redis/QStash (cache/events), and Neon (analytics). Provider selection is deliberately kept outside application contracts.

## Non-negotiable invariants

1. A regulatory ingestion workload cannot exhaust or lock the core transactional database.
2. Identity failure and core database failure are separate failure domains.
3. Every data kind has exactly one authoritative owner.
4. Browser/UI code never imports a provider database SDK to choose a data source.
5. Cross-store writes are not distributed transactions. Commit authoritative state plus an outbox event, then project asynchronously.
6. Consumers are idempotent. Events are versioned and replayable.
7. Original evidence is immutable and checksum-addressed; intelligence is a derived interpretation.
8. Cache, search and analytics can be destroyed and rebuilt without data loss.
9. Every provider call has a timeout, retry budget and circuit breaker.
10. Degraded optional dependencies never cause an infinite loading state.
11. Critical production data has PITR/backups and tested restore procedures.
12. The legacy Supabase project remains quarantined until recovery/export is complete.

## Data ownership

| Data | Owner |
| --- | --- |
| Account/profile | Core |
| Organization/membership/RBAC | Core |
| Workspace/workflow state | Core |
| Jurisdiction/regulation/signal | Intelligence |
| Intelligence provenance/confidence | Intelligence |
| Original PDF/HTML/JSON/source artifact | Evidence |
| Cache | Cache |
| Event delivery | Events |
| Search/vector index | Derived search |
| Reporting/BI | Derived analytics |

## Failure policy

Core or identity unavailable means the authenticated application is unavailable. Intelligence, evidence, cache, search, analytics, and ingestion may independently degrade without taking login, account, organization, or settings flows down.

## Migration phases

### Phase 0 — boundary first
Introduce provider-neutral contracts, ownership rules, health states, stable IDs and environment slots. No production provider switch.

### Phase 1 — core extraction
Create the new core Postgres and independent identity tenant. Rebuild the minimum schema from reviewed migrations. Dual-read validation may be used, but only one system is authoritative at a time.

### Phase 2 — evidence and intelligence
Write new source artifacts immutably to object storage; normalize intelligence into its dedicated store. Add provenance and confidence metadata.

### Phase 3 — event backbone
Implement transactional outbox, idempotency keys, retry budgets, DLQ and replay. Move ingestion/enrichment off request paths.

### Phase 4 — derived systems
Build Redis caches, search/vector indexes and analytics projections entirely from authoritative stores/events.

### Phase 5 — cutover
Run reconciliation, backup/restore drill, authenticated smoke tests and rollback rehearsal. Switch production configuration only after gates pass.

### Phase 6 — legacy recovery
Recover/export legacy Supabase data, reconcile historical records, archive evidence, then decide whether the old project can be retired.

## Production cutover gates

- Core schema and RBAC verified.
- Identity login/recovery/MFA verified.
- Cross-tenant authorization tests pass.
- Outbox replay is idempotent.
- Evidence checksum round-trip passes.
- Optional-provider outage tests prove graceful degradation.
- PITR/restore drill passes.
- Production smoke: login -> market routing -> dashboard -> settings.
- Observability reports dependency-specific errors and latency.
- Rollback procedure has been executed in staging.
