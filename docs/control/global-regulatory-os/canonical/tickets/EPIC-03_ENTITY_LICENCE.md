# Epic P3 — Entities, Licences, Quality and Counterparties

**Duration:** 6–12 months  
**Cost checkpoint:** Included in $6m–$15m annual Phases 2–4 run rate  
**Scope rule:** Execution sequencing only; the global target state remains unchanged.

| Ticket | Deliverable | Dependencies | Primary owner | Acceptance criterion |
|---|---|---|---|---|
| P3-001 | Implement canonical entity registry | P1-012 | Registry Engineer | Entities retain official identifiers, historical names, jurisdiction, status, evidence and public/private ownership. |
| P3-002 | Implement person and beneficial-owner model | P3-001 | Registry Engineer | People and ownership records follow privacy, evidence, validity and restricted-access controls. |
| P3-003 | Implement reversible entity resolution | P3-001,P3-002 | Data Engineer | Merge proposals expose evidence/confidence; automatic high-confidence merges meet 99% precision; split restores history. |
| P3-004 | Implement facility registry | P3-001 | Registry Engineer | Facilities link addresses, geolocation, operators, authorized activities, capacities and validity history. |
| P3-005 | Implement licence-class normalization | P0-005,P3-004 | Regulatory Data Engineer | Jurisdiction licence classes map to canonical activities without losing local conditions. |
| P3-006 | Implement licence ingestion and history | P3-005,P1-003 | Ingestion Engineer | Pending, active, conditional, suspended, expired, revoked and denied states retain official evidence and change history. |
| P3-007 | Implement certification and GxP records | P3-004 | Quality Data Engineer | GACP/GMP/GDP/GLP/accreditation scope, issuer, validity, findings and non-compliance are normalized. |
| P3-008 | Implement inspection, enforcement and recall intelligence | P3-004,P1-008 | Regulatory Data Engineer | Events link entities/facilities/products, severity, resolution and source evidence. |
| P3-009 | Implement counterparty risk components | P3-003,P3-006,P3-007,P3-008 | Risk Engineer | Scores are decomposable, versioned, evidence-backed and never substitute for underlying facts. |
| P3-010 | Build counterparty monitoring and alerts | P3-009,P2-009 | Workflow Engineer | Licence, ownership, quality, enforcement and recall changes re-evaluate approved counterparties. |
| P3-011 | Build due-diligence report and review workflow | P3-009 | Product Engineer | Reports expose sources, freshness, unresolved conflicts, reviewer status and export restrictions. |
| P3-012 | Certify entity/licence/counterparty release | P3-001..P3-011 | QA/Data Governance Lead | Resolution benchmark, licence history, privacy, quality evidence, risk explainability and monitoring meet gate. |

## Epic GO gate

All listed ticket criteria, phase-specific evidence in `docs/control/07_EVIDENCE_MATRIX.md`, and the matching release gate in `docs/control/09_GO_HOLD_GATES.md` must pass. Partial completion is HOLD for the phase, although independently evidenced submodules may remain enabled behind explicit entitlements and feature flags.
