# Epic P5 — Canonical Market and Commercial Intelligence

**Duration:** 9–15 months  
**Cost checkpoint:** $3m–$8m incremental depending on licensed data  
**Scope rule:** Execution sequencing only; the global target state remains unchanged.

| Ticket | Deliverable | Dependencies | Primary owner | Acceptance criterion |
|---|---|---|---|---|
| P5-001 | Implement canonical metric registry | P1-012 | Market Data Architect | Every metric has definition, inclusions, exclusions, units, period, methodology, owner and revision policy. |
| P5-002 | Implement market data zones and contracts | P5-001 | Data Platform Engineer | Raw, standardized, reconciled, canonical, analytical, published, private and restricted zones enforce contracts and rights. |
| P5-003 | Onboard official market datasets | P5-002,P1-003 | Market Data Engineer | Approved official sales, production, inventory, licence, patient, tax and trade datasets retain source lineage. |
| P5-004 | Integrate licensed commercial datasets | P5-002,P0-007 | Data Partnerships Engineer | POS, price or commercial feeds enforce field-level rights, tenant entitlements and termination controls. |
| P5-005 | Implement unit, currency and period normalization | P5-003,P5-004 | Data Engineer | Conversions retain rate/date lineage and never merge incompatible market definitions. |
| P5-006 | Implement metric reconciliation engine | P5-005 | Data Quality Engineer | Components, totals, revisions and source conflicts produce explicit exceptions instead of silent overwrites. |
| P5-007 | Implement observation revision history | P5-006 | Backend Engineer | Actual, preliminary, estimate, imputed, forecast and scenario states remain distinct and time-versioned. |
| P5-008 | Implement forecast and scenario registry | P5-007 | Market Science Lead | Models expose baselines, assumptions, confidence intervals, versions, approval and backtesting. |
| P5-009 | Implement commercial signal detection | P5-003,P3-008 | Market Intelligence Engineer | Tenders, shortages, openings, capital projects, recalls, funding and partnerships produce evidence-backed signals. |
| P5-010 | Build market explorer and executive reports | P5-006,P5-008,P5-009 | Product Engineer | Charts and reports expose as-of dates, definitions, states, sources, confidence and reconciliation notes. |
| P5-011 | Implement opportunity score methodology | P5-006,P4-009 | Market Science Lead | Score components and weights are transparent, versioned, challengeable and never hide gating failures. |
| P5-012 | Certify market-intelligence release | P5-001..P5-011 | QA/Data Governance Lead | No conflicting canonical totals; actual/estimate/forecast labels, rights, reconciliation and forecast baselines pass. |

## Epic GO gate

All listed ticket criteria, phase-specific evidence in `docs/control/07_EVIDENCE_MATRIX.md`, and the matching release gate in `docs/control/09_GO_HOLD_GATES.md` must pass. Partial completion is HOLD for the phase, although independently evidenced submodules may remain enabled behind explicit entitlements and feature flags.
