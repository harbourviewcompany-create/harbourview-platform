# Epic P6 — Transaction and Ecosystem Layer

**Duration:** 12–24 months  
**Cost checkpoint:** $4m–$12m incremental plus legal/commercial operations  
**Scope rule:** Execution sequencing only; the global target state remains unchanged.

| Ticket | Deliverable | Dependencies | Primary owner | Acceptance criterion |
|---|---|---|---|---|
| P6-001 | Implement qualified partner discovery | P3-009,P4-009 | Marketplace Engineer | Search returns only entitlement-appropriate counterparties with licence, quality, corridor and freshness context. |
| P6-002 | Implement structured demand and supply requests | P6-001 | Marketplace Engineer | Requests specify product, quantity, quality, jurisdictions, dates, documents and confidentiality. |
| P6-003 | Implement matching and eligibility rules | P6-002,P4-004 | Rules Engineer | Matches cannot bypass licence, product, corridor, quality or counterparty gates. |
| P6-004 | Implement transaction workspace | P6-003,P4-011 | Product Engineer | Parties manage questions, conditions, documents, approvals and change history in a matter-scoped room. |
| P6-005 | Implement transaction readiness determination | P6-004,P4-009 | Trade Product Engineer | Readiness combines current corridor, counterparty, documents, quality and commercial conditions. |
| P6-006 | Implement shipment milestone model | P6-005 | Supply Chain Engineer | Permit, dispatch, customs, release, transit, receipt and exception events retain evidence and responsible party. |
| P6-007 | Implement quality-event and dispute workflow | P6-006,P3-007 | Quality Product Engineer | Deviations, rejected batches, recalls, disputes and corrective actions are isolated and auditable. |
| P6-008 | Implement counterparty performance history | P6-006,P6-007 | Risk Engineer | Delivery, document, quality and payment outcomes are evidence-backed and permissioned. |
| P6-009 | Implement transaction notifications and escalations | P6-005,P2-009 | Workflow Engineer | Material condition, permit, quality and schedule changes route to responsible parties. |
| P6-010 | Implement lawful commercial fee controls | P6-005 | Legal/Finance Lead | Fee types, jurisdictions, tax, invoicing and licensing exposure are approved before activation. |
| P6-011 | Implement marketplace public/private projections | P6-001,P6-004 | Security Engineer | Public discovery cannot expose provenance, private evidence, counterparties, negotiation or restricted data. |
| P6-012 | Certify transaction-layer release | P6-001..P6-011 | QA/Legal/Security Lead | Unverified parties and failed gates cannot transact; fees, documents, shipment evidence and leakage controls pass. |

## Epic GO gate

All listed ticket criteria, phase-specific evidence in `docs/control/07_EVIDENCE_MATRIX.md`, and the matching release gate in `docs/control/09_GO_HOLD_GATES.md` must pass. Partial completion is HOLD for the phase, although independently evidenced submodules may remain enabled behind explicit entitlements and feature flags.
