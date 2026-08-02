# Epic P0 — Constitution and Foundation

**Duration:** 8–12 weeks  
**Cost checkpoint:** $600k–$1.4m  
**Scope rule:** Execution sequencing only; the global target state remains unchanged.

| Ticket | Deliverable | Dependencies | Primary owner | Acceptance criterion |
|---|---|---|---|---|
| P0-001 | Ratify product constitution | none | Product Lead | Constitution fixes source-to-action chain, global scope, publication limits and operator authority; approval recorded. |
| P0-002 | Create global jurisdiction registry | P0-001 | Data Governance Lead | All countries and territories are represented; parent/relationship model supports all declared jurisdiction layers; missing-universe test passes. |
| P0-003 | Define regulatory source taxonomy | P0-001 | Regulatory Ontology Lead | All binding, rulemaking, administrative, licence, market and secondary source classes map to controlled concepts. |
| P0-004 | Define cannabis product and substance ontology | P0-001 | Regulatory Ontology Lead | Product form, intended use, cannabinoid, controlled status, dosage, material and packaging concepts pass multi-regime review. |
| P0-005 | Define activity, licence and facility ontology | P0-003,P0-004 | Regulatory Ontology Lead | Cultivation through destruction plus import/export, research, prescribing and dispensing map without jurisdiction-specific information loss. |
| P0-006 | Approve provenance and truth-class specification | P0-001 | Data Governance Lead | Fact, normalized fact, interpretation, estimate, forecast and recommendation have required evidence and review rules. |
| P0-007 | Approve source-rights policy | P0-003 | Privacy/Data Rights Lead | Collection, storage, transformation, redistribution and termination controls are documented and enforceable. |
| P0-008 | Approve data classification and retention model | P0-001 | Security Architect | Classification, residency, retention, legal hold and deletion policies are mapped to storage and access controls. |
| P0-009 | Complete system threat model | P0-006,P0-008 | Security Architect | Threat model covers cross-tenant access, public leakage, source injection, SSRF, evidence tampering, model misuse and privileged access. |
| P0-010 | Approve service and bounded-context map | P0-002,P0-003,P0-006 | Principal Architect | Ownership and transactional boundaries are fixed; canonical and derived stores are explicitly separated. |
| P0-011 | Establish architecture decision process | P0-010 | Principal Architect | ADR template, owners, decision authority, supersession and review cadence are operational. |
| P0-012 | Build phase-zero proof matrix | P0-002,P0-005,P0-006,P0-009,P0-010 | QA Lead | Representative regulatory archetypes prove ontology, provenance, authorization and source-rights design; GO/HOLD signed. |

## Epic GO gate

All listed ticket criteria, phase-specific evidence in `docs/control/07_EVIDENCE_MATRIX.md`, and the matching release gate in `docs/control/09_GO_HOLD_GATES.md` must pass. Partial completion is HOLD for the phase, although independently evidenced submodules may remain enabled behind explicit entitlements and feature flags.
