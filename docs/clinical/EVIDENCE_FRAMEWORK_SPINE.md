# Evidence Framework Spine (Phase A)

**Status:** Implemented on branch `feat/clinical-evidence-framework-spine`  
**Issue:** #1609  
**Scope:** Additive types + optional fixture annotation only. No change to liability posture, public search, or SaMD claims.

## Purpose

Map the commercial evidence strategy (IMDRF three-pillar clinical evaluation, DTA five-domain quality & timing, DTx RWE Framework phases, FDA 2025 Device RWE relevance/reliability, ALCOA+/provenance, commercial stage-gates) onto Harbourview’s existing Clinical Evidence Spine **without** expanding product scope beyond cannabinoid / medical-cannabis clinical reference.

## What shipped in Phase A

1. **Types** (`lib/clinical/types.ts`)
   - `ImdrfPillar`, `DtaDomain`, `DtaEcosystem`, `DtxRwePhase`, `CommercialStageGate`
   - `RelevanceReliabilityStatus`, `FrameworkAlignment`, `EvidenceClaimMapEntry`
   - Optional `frameworkAlignment?: FrameworkAlignment` on `EvidenceRecord`

2. **Sample annotation**
   - `ev-dravet-cbd` fixture includes a complete example `frameworkAlignment` object so authors and reviewers can copy the shape.

3. **This doc** — operator guidance for later phases.

## Governance rules (unchanged)

- All clinical-synthesis conclusions still require the named clinical reviewer path and jurisdiction check before publish.
- `frameworkAlignment` is metadata for commercial / regulatory readiness; it does **not** replace GRADE-style certainty, claim provenance, or primary-source links.
- Clinician-facing surfaces must continue to present reviewed source summaries only; framework blocks (when added in Phase C) are read-only transparency, not directives.
- Product remains professional clinical reference, not SaMD or patient-specific advice.

## Minimal admin support (Phase A)

Production evidence records live in Supabase (`clinical_evidence_records` and related governance tables). Phase A does **not** add a new DB column or change `app/clinical/review/actions.ts`.

**Operator practice until Phase B:**

- Use the fixture shape as the canonical JSON for claim maps and dossier notes.
- Store draft alignment notes in intake `notes` or internal review rationale fields when useful.
- Prefer supersession + new review over silent mutation of published meaning.

**Phase B (next):** Admin Claim Map view + optional JSON column or structured child table for `framework_alignment`, gap dashboard, and stage-gate filters.

**Phase C:** Read-only Framework Alignment block on Clinical Command detail pages (only when data present).

**Phase D:** Evidence Readiness Checker in operator tools + corridor-plan flags.

## Mapping cheat-sheet

| Framework concept | Where it lives in Harbourview |
|-------------------|-------------------------------|
| IMDRF valid clinical association / clinical validation | Strength + summary + keyFindings + primary sources; optional `imdrfPillars` |
| Analytical validation | Mostly N/A for pure drug products; partial for assay/manufacturing; software contexts later |
| DTA Safety / Benefit / Durability / Usability / Engagement | Optional `dtaDomains[]` with ecosystem |
| DTx RWE phase | Optional `dtxRwePhase` (design → monitor) |
| FDA relevance + reliability | Optional `relevanceReliability` |
| ALCOA+ / provenance | Existing claim provenance + snapshots + `alcoaPlusComplete` flag |
| Commercial stage-gate | Optional `commercialStageGate` + `commercialPriority` |

## Acceptance criteria (Phase A)

- [x] Types compile (additive, optional)
- [x] Existing fixtures remain valid
- [x] One high-traffic record (`ev-dravet-cbd`) annotated
- [x] Docs for operators
- [ ] Full admin form UI and DB persistence → Phase B

## Non-goals for Phase A

- No general-Rx expansion
- No generative “what should I prescribe” behaviour
- No change to CLINICAL_DISCLAIMER or entitlement gates
- No automatic inference of efficacy from framework fields
