# Infrastructure Plan

## Environment topology

| Environment | Purpose | Data | External access | Promotion rule |
|---|---|---|---|---|
| local | Developer execution | Synthetic fixtures only | Developer machine | Never receives production secrets |
| ci | Deterministic tests | Synthetic and licensed test fixtures | CI runners | Ephemeral |
| development | Shared integration | Synthetic and approved public samples | Team VPN/identity | Automated from protected branches |
| staging | Production-equivalent release candidate | Sanitized or explicitly approved data | Restricted enterprise identity | Signed artifact from CI only |
| production | Customer and canonical operations | Classified production data | WAF/API gateway | Manual release approval and evidence gate |
| disaster-recovery | Recovery and continuity | Encrypted replicated data | Disabled until exercise/failover | Recovery authority only |

Separate production accounts/projects/subscriptions are required. Administrative and workload identities are separate. Direct human database writes are break-glass operations.

## Regional model

- Start with one declared primary region and one backup region.
- Add data-residency regions only after a contractual or legal requirement.
- Tenant region is immutable without a controlled migration.
- Raw licensed data remains in permitted regions and is not copied into unrestricted analytical stores.
- Cross-region replication follows classification and source-rights policies.

## Core managed components

| Capability | Component | Control |
|---|---|---|
| Web/API edge | CDN, WAF, API gateway | Rate limits, bot control, request IDs, token validation |
| Application compute | Managed containers/serverless where appropriate | Workload identities, no static cloud keys |
| Canonical database | Managed PostgreSQL HA | PITR, encryption, RLS, connection proxy, restricted owner role |
| Evidence storage | Versioned object storage | Retention lock, hash verification, malware scan, lifecycle policy |
| Search | Managed OpenSearch | Derived indexes, per-tenant filters, rebuild runbook |
| Event fabric | Managed Kafka-compatible service | Schema registry, ACLs, dead-letter topics, idempotent consumers |
| Workflow | Temporal-compatible managed service | Durable retries, workflow versioning, encrypted payload references |
| Cache | Managed Redis-compatible service | No canonical records, TTLs, private networking |
| Lakehouse | Object storage and open table format | Separate raw/standardized/canonical/published zones |
| Analytics | Warehouse/distributed SQL | Data contracts, row/column controls, licensed data enforcement |
| AI gateway | Internal provider-neutral service | Redaction, policy routing, prompt/model registry, cost controls |
| Observability | OpenTelemetry collectors and managed backend | Trace/log redaction, tenant-safe telemetry, immutable security logs |
| Secrets | KMS and secret manager | Rotation, workload identities, audit logging |

## Network zones

1. Public edge.
2. Application private network.
3. Acquisition egress network with source-specific allowlists.
4. Restricted document-processing network.
5. Data and control plane.
6. Security and observability plane.
7. Administrative access plane.

Acquisition workers cannot reach internal metadata endpoints, arbitrary private addresses or unregistered hosts. Browser automation runs in isolated sandboxes.

## Deployment model

- Trunk-based or short-lived branches with protected main.
- Reproducible lockfiles and signed build artifacts.
- Software bill of materials and provenance attestation.
- Database migrations are forward-compatible and rehearsed in staging.
- Expand/contract schema changes precede destructive cleanup.
- Feature flags protect incomplete modules.
- Canary or blue/green release for high-risk services.
- Public projections receive automated leakage probes before promotion.
- Rollback targets the application; database roll-forward is preferred after committed migrations.

## Availability targets

| Service class | Target |
|---|---:|
| Enterprise read API | 99.9% monthly |
| Critical alert processing | 99.9% monthly |
| Analyst workbench | 99.5% monthly |
| Standard source acquisition | Source cadence plus SLA |
| Critical source acquisition | Detection within 15–60 minutes |

## Recovery targets

| Data | RPO | RTO |
|---|---:|---:|
| Canonical PostgreSQL | 5 minutes | 4 hours |
| Immutable evidence | Zero after confirmed write | 8 hours |
| Event fabric | 15 minutes | 4 hours |
| Search indexes | Rebuildable | 24 hours |
| Lakehouse canonical zone | 1 hour | 24 hours |

## Capacity gates

- Partition high-volume snapshots, events, audit records and observations by time and/or jurisdiction after measured need.
- Introduce graph database only after PostgreSQL and projected graph benchmarks fail agreed workloads.
- Introduce additional warehouses only after query isolation or licensed-data requirements justify them.
- Maintain provider abstraction at contracts, not by duplicating every cloud service.

## Required runbooks

- Source outage and freshness failure.
- Credential compromise.
- Cross-tenant access attempt.
- Evidence-integrity failure.
- Model rollback.
- Publication correction or retraction.
- Database restoration.
- Region failover.
- Event replay.
- Search rebuild.
- Licensed-data termination.
- Public leakage incident.
