# Epic P2 — Applicability, Obligations and Workflow

**Duration:** 6–9 months  
**Cost checkpoint:** Included in $6m–$15m annual Phases 2–4 run rate  
**Scope rule:** Execution sequencing only; the global target state remains unchanged.

| Ticket | Deliverable | Dependencies | Primary owner | Acceptance criterion |
|---|---|---|---|---|
| P2-001 | Implement organization operating profiles | P1-012 | Backend Engineer | Versioned customer facts cover entities, facilities, licences, products, activities, jurisdictions and business roles. |
| P2-002 | Implement applicability DSL parser and validator | P0-005,P2-001 | Rules Engineer | DSL validates typed facts, operators, missing-input policy, conflict policy and deterministic AST compilation. |
| P2-003 | Implement deterministic applicability evaluator | P2-002 | Rules Engineer | Evaluations are reproducible by profile, rule, date and input hash and emit complete reason traces. |
| P2-004 | Implement obligation extraction candidates | P1-008 | ML/Extraction Engineer | Provision candidates extract subject, action, object, conditions, exceptions, triggers, timing and evidence requirements with citations. |
| P2-005 | Build obligation specialist-review workflow | P2-004 | Regulatory Product Engineer | Risk-tier routing, jurisdiction authority, dual review and version approval are enforced. |
| P2-006 | Implement obligation versioning and supersession | P2-005 | Backend Engineer | Current and historical obligations are time-bounded; superseded obligations cannot generate current actions. |
| P2-007 | Implement control and SOP mapping | P2-006 | Compliance Engineer | Obligations map to control objectives, procedures, evidence, owner and frequency with partial/conflict semantics. |
| P2-008 | Implement compliance calendar and deadlines | P2-003,P2-006 | Workflow Engineer | Relative and fixed deadlines recalculate at runtime and preserve source/effective-date lineage. |
| P2-009 | Implement alert rules, routing and digests | P2-003,P2-008 | Workflow Engineer | Alerts deduplicate, apply materiality and entitlements, explain applicability and track acknowledgement. |
| P2-010 | Implement assessments, findings and remediation | P2-007 | Product Engineer | Assessments create evidence-backed findings, owners, due dates, approvals and closure history. |
| P2-011 | Implement customer evidence room and attestations | P2-007,P2-010 | Security/Product Engineer | Tenant-isolated evidence, signatures, retention, download controls and audit bundles work end to end. |
| P2-012 | Certify obligation and applicability release | P2-001..P2-011 | QA/Domain Review Lead | Counsel-reviewed benchmark has no critical false negatives; reason traces, supersession, deadlines and tenant isolation pass. |

## Epic GO gate

All listed ticket criteria, phase-specific evidence in `docs/control/07_EVIDENCE_MATRIX.md`, and the matching release gate in `docs/control/09_GO_HOLD_GATES.md` must pass. Partial completion is HOLD for the phase, although independently evidenced submodules may remain enabled behind explicit entitlements and feature flags.
