# Evidence Framework Spine

**Branch:** `feat/clinical-evidence-framework-spine`  
**Issue:** #1609  
**Scope:** Additive commercial evidence strategy alignment. No change to liability posture, public search, or SaMD claims.

## Purpose

Map the commercial evidence strategy (IMDRF three-pillar clinical evaluation, DTA five-domain quality & timing, DTx RWE Framework phases, FDA 2025 Device RWE relevance/reliability, ALCOA+/provenance, commercial stage-gates) onto Harbourview’s existing Clinical Evidence Spine **without** expanding product scope beyond cannabinoid / medical-cannabis clinical reference.

## Phase A — DONE

1. **Types** (`lib/clinical/types.ts`)
   - `ImdrfPillar`, `DtaDomain`, `DtaEcosystem`, `DtxRwePhase`, `CommercialStageGate`
   - `RelevanceReliabilityStatus`, `FrameworkAlignment`, `EvidenceClaimMapEntry`
   - Optional `frameworkAlignment?: FrameworkAlignment` on `EvidenceRecord`

2. **Sample annotation** — `ev-dravet-cbd` fixture includes a complete example `frameworkAlignment`.

3. **Governance rules** (unchanged)
   - Clinical conclusions still require named clinical reviewer path + jurisdiction check before publish.
   - `frameworkAlignment` is metadata for commercial / regulatory readiness; it does **not** replace GRADE-style certainty, claim provenance, or primary-source links.
   - Product remains professional clinical reference, not SaMD or patient-specific advice.

## Phase B — DONE

1. **Claim map fixtures** — `lib/fixtures/clinical/claim-map.ts` (Dravet CBD, neuropathic pain, MS spasticity samples).

2. **Gap analysis helpers** — `lib/clinical/framework-gap.ts`
   - Collect partial/missing/unmapped dimensions from IMDRF pillars, DTA domains, ALCOA+, FDA relevance/reliability
   - Summary + triage sort for operators

3. **Admin UI** — `/admin/clinical-review/claim-map`
   - Gap dashboard (counts by status/dimension, high-priority filter)
   - Claim map list with pillar/domain badges
   - Minimal form: validate `EvidenceClaimMapEntry` JSON before committing to fixtures or notes

4. **Optional persistence** — `supabase/migrations/20260821190000_clinical_framework_alignment_optional.sql`
   - Additive `framework_alignment jsonb` on `clinical_evidence_records`
   - Optional `clinical_evidence_claim_map` table for living claim dossiers
   - **Not required** for the fixture-backed admin UI; apply when ready to persist production rows

### Operator practice

- Use Claim Map UI for triage and dossier planning.
- Prefer supersession + new review over silent mutation of published clinical meaning.
- Store draft alignment in fixtures or intake notes until migration is applied and write path wired.

## Phase C — DONE

1. **Read-only block** — `components/clinical/FrameworkAlignmentBlock.tsx`
   - IMDRF pillars, DTA domains, DTx RWE phase, FDA RWE relevance/reliability, ALCOA+, stage-gate / priority
   - Renders only when `frameworkAlignment` is present

2. **Clinical Command integration** — `ClinicalWorkspacePage` Evidence tab
   - Under each citation, fixture lookup by `evidenceRecordId`
   - Shows compact Framework Alignment block when the matching evidence fixture is annotated
   - No clinical inference; graded strength and primary sources remain authoritative

## Phase D — DONE

1. **Evidence Readiness Checker** — `lib/clinical/evidence-readiness.ts`
   - `assessClaimMapReadiness`, `corridorEvidenceFlags`, `alignmentQuickScore`
   - Pure helpers over claim-map fixtures / gap analysis

2. **Corridor plan flags** — `CorridorPlanWorkspace`
   - “Evidence readiness (commercial)” section with severity-tagged flags
   - Top framework gaps for operator triage
   - Product-class awareness (orientation only)

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
| Living claims | `EvidenceClaimMapEntry` / claim-map fixtures / optional `clinical_evidence_claim_map` |

## Acceptance criteria

### Phase A
- [x] Types compile (additive, optional)
- [x] Existing fixtures remain valid
- [x] One high-traffic record (`ev-dravet-cbd`) annotated
- [x] Docs for operators

### Phase B
- [x] Claim map fixtures + gap helpers
- [x] Admin Claim Map + gap dashboard
- [x] Minimal admin form (JSON validate)
- [x] Optional additive migration (not forced on production)
- [ ] Live write path to `framework_alignment` column — when migration applied

### Phase C
- [x] Read-only Framework Alignment block component
- [x] Wired into Clinical workspace Evidence citations when data present
- [x] No change to CLINICAL_DISCLAIMER or public search

### Phase D
- [x] Evidence Readiness Checker helpers
- [x] Corridor-plan commercial flags + top gaps
- [x] Fixture-backed; no clinical inference

## Non-goals

- No general-Rx expansion
- No generative “what should I prescribe” behaviour
- No change to CLINICAL_DISCLAIMER or entitlement gates
- No automatic inference of efficacy from framework fields
