# Evidence Framework Spine — Commercial Playbook Integration

**Status:** Phases A–D DONE (additive / optional)  
**Scope:** Cannabinoid / medical-cannabis clinical-reference only. Non-SaMD professional-reference posture.  
**Invariant:** Does **not** change `CLINICAL_DISCLAIMER`, public search behaviour, clinical conclusions, or review_status gates.

---

## Purpose

Map Harbourview clinical evidence records to commercial and regulatory evidence frameworks so operators can:

- Score claim readiness for corridor plans
- Triage IMDRF / DTA / ALCOA+ / FDA RWE gaps
- Stage-gate evidence for pilot → scale → label-support → payer dossier → post-market RWE

All mapping is **metadata**. It never drives clinical recommendations.

---

## Frameworks mapped

| Framework | Use in spine |
|-----------|----------------|
| **DTx RWE Framework** phases | `dtxRwePhases`: discovery → development → launch → post_market → lifecycle |
| **IMDRF N41** three pillars | `imdrfPillars`: clinical_association, analytical_validation, clinical_validation |
| **DTA five-domain quality** | `dtaDomains` + optional `dtaEcosystem` |
| **FDA 2025 Device RWE** relevance/reliability | `fdaRweRelevanceReliability` (mapping only; not a regulatory claim) |
| **ALCOA+** provenance | `alcoaPlus` dimensions on source-backed records |
| **Commercial stage-gates** | `commercialStageGates`: pre_clinical_ref, pilot_corridor, scale_corridor, label_support, payer_dossier, post_market_rwe |

---

## Code map

| Artifact | Role |
|----------|------|
| `lib/clinical/types.ts` | `FrameworkAlignment`, `EvidenceClaimMapEntry`, optional on `EvidenceRecord` |
| `lib/fixtures/clinical/evidence.ts` | High-traffic fixtures annotated (`ev-dravet-cbd`, `ev-lgs-cbd`, `ev-ms-spasticity`, `ev-neuropathic-pain`) |
| `lib/fixtures/clinical/claim-map.ts` | Claim statements ↔ evidence IDs ↔ stage-gates |
| `lib/clinical/framework-gap.ts` | Gap collection, triage sort, summarise, alignment quick score |
| `lib/clinical/evidence-readiness.ts` | `assessClaimMapReadiness`, `corridorEvidenceFlags`, record readiness |
| `components/clinical/FrameworkAlignmentBlock.tsx` | Read-only UI block (full + compact) |
| `app/admin/(protected)/clinical-review/claim-map/page.tsx` | Gap dashboard + local JSON form |
| `app/admin/(protected)/clinical-review/page.tsx` | Link to claim-map |
| `components/dashboard/pages/ClinicalEvidenceCommandPage.tsx` | Compact alignment block via fixture condition match |
| `supabase/migrations/20260821190000_clinical_framework_alignment_optional.sql` | `framework_alignment` jsonb + `clinical_evidence_claim_map` table |

---

## Governance rules

1. **Optional everywhere** — records without `frameworkAlignment` remain valid for clinical search.
2. **No clinical inference** — scores and flags are operator tools only.
3. **Human-gated publish** — claim-map and framework mapping do not bypass clinical review for published evidence.
4. **Non-SaMD** — IMDRF/DTA language is reference mapping for commercial dossiers, not a software-as-medical-device claim.
5. **Cannabinoid scope** — do not map non-cannabinoid primary-care claims into this spine.

---

## Mapping cheat-sheet

| Evidence strength / type | Typical stage-gates | Typical IMDRF | FDA RWE tag |
|--------------------------|---------------------|---------------|-------------|
| High-certainty pivotal RCT (e.g. purified CBD Dravet/LGS) | label_support, payer_dossier, scale_corridor | association + validation | relevant_reliable |
| Moderate (e.g. nabiximols MS spasticity) | scale_corridor, payer_dossier, post_market_rwe | association + validation | relevant_limited |
| Low / heterogeneous (e.g. neuropathic pain meta-analyses) | pre_clinical_ref, pilot_corridor | association | relevant_limited / insufficient |
| Safety-only snapshots | post_market_rwe, lifecycle | association | relevant_limited |

---

## Phase checklist

- [x] **Phase A** — Types + optional `frameworkAlignment` on `EvidenceRecord`
- [x] **Phase B** — Annotate high-traffic fixtures + claim-map samples
- [x] **Phase C** — Gap helpers + readiness checker + corridor flags
- [x] **Phase D** — Admin claim-map UI, FrameworkAlignmentBlock, migration, Command compact block, docs

### Live path (implemented)

- **API** `GET/POST /api/clinical/admin/framework-alignment` — list claim-map + aligned records; upsert/delete claim-map; set `framework_alignment` on evidence by id or slug (admin-gated, audited).
- **Admin UI** Claim map page loads live table when migration is applied; falls back to fixtures; **Persist to live** / **Seed fixtures → live** / JSON apply & persist.
- **Corridor flags** Access Pathway → Corridor Playbooks tab shows `CorridorEvidenceFlagsFromFixtures`; shared panel for other workspaces.

Apply migration `20260821190000_clinical_framework_alignment_optional.sql` before expecting live writes to succeed.

---

## Operator quick start

1. Open **Admin → Clinical review → Claim map & framework gaps**.
2. Filter by condition; review corridor flags and gap triage.
3. Use **Seed fixtures → live** once after migration, or paste JSON and **Apply & persist**.
4. Ensure linked `evidenceRecordIds` exist in fixtures/spine and have `frameworkAlignment` for stage-gate scoring.
5. On Command Centre → Access Pathway → **Corridor Playbooks**, review clinical evidence readiness flags.
