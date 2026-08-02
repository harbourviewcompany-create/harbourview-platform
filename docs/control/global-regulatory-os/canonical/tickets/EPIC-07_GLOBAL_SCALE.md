# Epic P7 — Global Institutional Depth

**Duration:** Continuous  
**Cost checkpoint:** $15m–$35m annual institutional run rate  
**Scope rule:** Execution sequencing only; the global target state remains unchanged.

| Ticket | Deliverable | Dependencies | Primary owner | Acceptance criterion |
|---|---|---|---|---|
| P7-001 | Establish multilingual source operations | P1-012 | Global Operations Lead | Language-specific parsers, translation review, terminology and quality benchmarks operate by jurisdiction. |
| P7-002 | Expand municipal, tribal and autonomous coverage | P0-002,P1-012 | Jurisdiction Programme Lead | Lower-level authorities and conflicts with higher-level law are modeled and coverage status is visible. |
| P7-003 | Deploy regional data-residency cells | P0-008,P1-001 | Platform Architect | Residency cells enforce tenant placement, restricted replication, encryption and tested recovery. |
| P7-004 | Implement private and sovereign deployment pattern | P7-003 | Platform Architect | Customer-isolated deployments preserve contracts, evidence lineage, update delivery and support boundaries. |
| P7-005 | Build government and regulator workspace | P2-012,P3-012 | Public Sector Product Lead | Regulator workflows support controlled data exchange, inspections, registers and public transparency without customer leakage. |
| P7-006 | Implement global coverage assurance programme | P0-002,P1-012 | Data Governance Lead | Coverage SLAs, source gaps, legal changes, analyst capacity and public claims are continuously reconciled. |
| P7-007 | Implement model localization and evaluation | P7-001 | Model Risk Lead | Every supported language/jurisdiction has benchmark, review authority, failure thresholds and rollback. |
| P7-008 | Implement advanced policy and market scenarios | P5-012 | Market Science Lead | Scenarios combine regulatory probability, obligations, corridors, entities and market effects with explicit uncertainty. |
| P7-009 | Implement customer data warehouse delivery | P5-012 | Data Platform Engineer | Versioned bulk tables, change data, rights, lineage and deletion/termination controls operate at enterprise scale. |
| P7-010 | Implement external agent and MCP control plane | P1-012,P2-012 | API Platform Lead | Agents receive scoped tools, citations, approvals, rate limits and auditable actions; no hidden autonomous decisions. |
| P7-011 | Complete institutional assurance programme | P7-003,P7-006 | Security/Compliance Lead | SOC 2/ISO readiness, BCP, privacy, accessibility, penetration testing and vendor risk are independently evidenced. |
| P7-012 | Operate continuous global release gate | P7-001..P7-011 | Programme Director | Quarterly coverage, quality, security, model, rights, cost and commercial evidence produces GO/HOLD by module and region. |

## Epic GO gate

All listed ticket criteria, phase-specific evidence in `docs/control/07_EVIDENCE_MATRIX.md`, and the matching release gate in `docs/control/09_GO_HOLD_GATES.md` must pass. Partial completion is HOLD for the phase, although independently evidenced submodules may remain enabled behind explicit entitlements and feature flags.
