# Epic P1 — Evidence and Regulatory Spine

**Duration:** 4–6 months  
**Cost checkpoint:** $2m–$4.5m incremental  
**Scope rule:** Execution sequencing only; the global target state remains unchanged.

| Ticket | Deliverable | Dependencies | Primary owner | Acceptance criterion |
|---|---|---|---|---|
| P1-001 | Provision canonical PostgreSQL platform | P0-012 | Platform Engineer | HA database, migrations, backups, restricted owner roles and environment isolation verified. |
| P1-002 | Implement source registry service | P1-001 | Backend Engineer | Source CRUD enforces rights, allowed hosts, cadence, freshness SLA, parser and owner requirements. |
| P1-003 | Implement secure acquisition runtime | P1-002 | Ingestion Engineer | Idempotent fetch, rate limiting, backoff, run locks, SSRF blocking, credentials and dead-letter handling pass tests. |
| P1-004 | Implement immutable evidence storage | P1-001,P1-003 | Platform Engineer | Every successful fetch writes versioned, hash-verified, retention-controlled raw evidence before processing. |
| P1-005 | Implement document normalization pipeline | P1-004 | Document Engineer | HTML, XML, JSON, PDF, scans, tables and attachments produce versioned normalized artifacts with processing lineage. |
| P1-006 | Implement passage and citation anchoring | P1-005 | Document Engineer | Stable page/section/paragraph/table anchors survive reprocessing and reconstruct exact source passages. |
| P1-007 | Implement document version and diff engine | P1-005,P1-006 | Data Engineer | Structural and semantic differences identify additions, deletions, moves, status and effective-date changes. |
| P1-008 | Implement regulatory instrument and provision service | P1-006 | Backend Engineer | Documents map to versioned instruments, provisions, legal effects, commencement and supersession relationships. |
| P1-009 | Implement hybrid regulatory search | P1-006,P1-008 | Search Engineer | Exact legal terms and semantic concepts retrieve evidence-filtered results; indexes are reproducibly rebuilt. |
| P1-010 | Build analyst triage and review workbench | P1-007,P1-008 | Product Engineer | Analysts compare versions, inspect citations, classify materiality, route specialist review and record decisions. |
| P1-011 | Implement publication, correction and retraction | P1-006,P1-010 | Backend Engineer | No publication without evidence/review; corrections propagate to alerts, exports and public projections. |
| P1-012 | Certify evidence-spine release | P1-001..P1-011 | QA/Security Lead | Acquisition, integrity, lineage, change recall/precision, RLS, leakage, replay and correction evidence meet Phase 1 gate. |

## Epic GO gate

All listed ticket criteria, phase-specific evidence in `docs/control/07_EVIDENCE_MATRIX.md`, and the matching release gate in `docs/control/09_GO_HOLD_GATES.md` must pass. Partial completion is HOLD for the phase, although independently evidenced submodules may remain enabled behind explicit entitlements and feature flags.
