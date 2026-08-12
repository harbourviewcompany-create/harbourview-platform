# Epic P4 — Market Access and Import/Export Corridors

**Duration:** 9–12 months  
**Cost checkpoint:** Included in $6m–$15m annual Phases 2–4 run rate  
**Scope rule:** Execution sequencing only; the global target state remains unchanged.

| Ticket | Deliverable | Dependencies | Primary owner | Acceptance criterion |
|---|---|---|---|---|
| P4-001 | Implement product and substance classifier | P0-004,P1-008 | Trade Product Engineer | Products retain composition, form, strength, intended use, packaging and jurisdiction-specific controlled status. |
| P4-002 | Implement corridor version model | P4-001,P3-006 | Backend Engineer | Origin, transit, destination, parties, product, purpose, quantity, date and route are immutable per version. |
| P4-003 | Define mandatory corridor gate library | P2-006,P3-007 | Trade/Legal Lead | Legal, licence, permit, quota, quality, customs, logistics, insurance, contract and counterparty gates are versioned. |
| P4-004 | Implement corridor gate evaluator | P4-002,P4-003,P2-003 | Rules Engineer | Gate results are deterministic, evidence-backed, expiry-aware and explain missing inputs. |
| P4-005 | Implement import/export permit intelligence | P3-006,P4-003 | Trade Data Engineer | Authority, permit class, prerequisites, forms, fees, lead times and validity are normalized with official evidence. |
| P4-006 | Implement customs, tax and tariff layer | P4-001,P4-002 | Customs Engineer | Commodity classifications, duties, taxes, declarations and uncertainty are date- and corridor-specific. |
| P4-007 | Implement quality and batch-release gates | P3-007,P4-003 | Quality Engineer | GACP/GMP/GDP, testing, CoA, release and facility conditions evaluate against product and corridor. |
| P4-008 | Implement logistics, security and transit gates | P4-002,P4-003 | Supply Chain Engineer | Carrier, storage, security, transit, route and receipt requirements are modeled and reviewed. |
| P4-009 | Implement GO/CONDITIONAL GO/HOLD determination | P4-004..P4-008 | Trade Product Engineer | Determination exposes blocking gates, conditions, assumptions, confidence, validity and specialist approval. |
| P4-010 | Build market-entry project workspace | P4-009,P2-008 | Product Engineer | Projects sequence gates, owners, dates, documents, counterparties and approvals. |
| P4-011 | Build controlled deal room and document readiness | P4-010,P2-011 | Security/Product Engineer | Matter-scoped external access, conditions, documents, expiration and audit logging work. |
| P4-012 | Certify corridor release | P4-001..P4-011 | Trade QA/Counsel Lead | Representative corridors pass counsel review, transit/product/quantity changes trigger re-evaluation, and no GO lacks evidence. |

## Epic GO gate

All listed ticket criteria, phase-specific evidence in `docs/control/07_EVIDENCE_MATRIX.md`, and the matching release gate in `docs/control/09_GO_HOLD_GATES.md` must pass. Partial completion is HOLD for the phase, although independently evidenced submodules may remain enabled behind explicit entitlements and feature flags.
