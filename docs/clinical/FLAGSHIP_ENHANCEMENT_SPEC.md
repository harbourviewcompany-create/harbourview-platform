# Clinical Command — Flagship Enhancement Specification

**Status:** Proposal / Product Requirements (open decisions resolved 2026-08-16)  
**Audience:** Clinical product, eng, medical reviewers, legal/compliance  
**Goal:** Make the Clinical section the flagship surface a doctor, nurse practitioner, or pharmacist reaches for at the moment of prescribing — in **any supported jurisdiction**, not only Canada — within a defined, defensible product and governance boundary.

## Current State (as of 2026-08-16)

- Thin shell: marketing description + single search box.
- Search for terms such as “Dravel” returns “No reviewed condition or evidence record matches this search.”
- No populated evidence base, dosing, interactions, formulary, or jurisdiction-specific regulatory detail visible in the primary viewport.
- Existing PR #1456 repairs production migration drift, improves diagnostics, and rebuilds the mobile command surface around evidence-first views. That work is foundational and should land first.
- Evidence model already stores `jurisdiction` as an array and the search API accepts a jurisdiction parameter. UI and content remain heavily Canada-centric (`CANADA_CLINICAL_AUTHORITIES`, Canada-default copy, Canada-seeded records).
- Codebase and evidence spine are still primarily oriented to **regulated cannabinoid / medical-cannabis clinical evidence**, not general primary-care prescribing across all therapeutic classes.

This document specifies what is still required to make Clinical *indispensable*, **jurisdiction-correct**, and **safe to operate**.

---

## 0. Resolved Product Decisions (2026-08-16)

These were the Appendix A.8 open items. They are now **locked for v1** unless product explicitly revises them.

### D1 — Tier-1 markets

| Priority | Market | ISO | Rationale |
|----------|--------|-----|-----------|
| Anchor | **Canada** | CA | Deepest existing corpus path; federal medical access; bilingual obligation |
| Tier-1 | **Germany** | DE | Largest EU medical Rx volume in platform intel; BfArM / G-BA / GKV clinical relevance |
| Tier-1 | **Australia** | AU | Mature TGA/ODC dual authority; high Authorised Prescriber / SAS volume |
| Tier-1 | **United Kingdom** | GB | Clear CBPM Schedule 2 specialist pathway; MHRA + Home Office |

**Next expansion (not Tier-1 for 90-day depth):** Israel (IMCA — strong clinical market, export hub). France, NL, PL, IT remain authority-registry / Tier-2–3 until capacity allows.

**90-day content depth:** Canada P0 full; Germany and Australia get authority registry + access pathway records; UK authority registry at minimum. Do not promise equal condition-level depth for DE/AU/UK inside 90 days.

### D2 — Entitlement (who sees Clinical)

Aligned to existing `lib/clinical/auth.ts` gates:

| Surface | Gate | Notes |
|---------|------|-------|
| Marketing / empty teaser on Clinical tab | Public or signed-out OK | No published evidence body |
| Search + read **published** evidence, authorities, pathways | **Authenticated user** (`requireClinicalUser`) | Professional Command context |
| Dosing calculator, persisted clinical operations, prescription-related APIs | **Verified clinician** (`requireVerifiedClinician`) | Fail closed if not verified |
| “What I viewed” audit trail | Authenticated; prefer verified clinician | No PHI in v1 |
| Draft / intake / review / publish | **Internal staff roles only** | Never clinician-facing until `published` |

No separate paid “Clinical plan” is required for v1 read access beyond normal authenticated Command access. If commercial packaging changes later, entitlement must be updated explicitly.

### D3 — MVP topic list

**Confirmed:** Section A.1 is the final v1 MVP list (not merely illustrative), with pathway rows bound to named markets:

- P3 = Access pathway — **Germany**
- P4 = Access pathway — **Australia**
- P6 (added) = Access pathway — **United Kingdom** (P1)

Hard cap remains ≤ 30 clinician-facing records for the first publish wave. No general-Rx monographs.

### D4 — Primary clinical reviewer

**Cannot be invented in-repo.** Gate:

- Product owner (**Tyler**) appoints a **named primary clinical reviewer** and **backup** before any clinical-synthesis record is published.
- Appointment recorded in this doc (amendment) or HANDOFF within days 0–14.
- Until appointed: authority-registry links may ship; **no** efficacy/dosing/safety synthesis publishes.

### D5 — French (Canada) in the 90-day window

| In 90 days | After 90 days (or after EN P0 ships) |
|------------|--------------------------------------|
| FR labels for Canadian **authority registry** entries | FR translation of high-traffic clinical record bodies |
| FR strings for limited-coverage / empty states when locale is FR-CA | Human-reviewed FR dosing/safety (never auto-translate) |

English publish of P0 records is **not** blocked on FR. Do not market “complete FR-CA Clinical” until record-level FR exists.

---

## 1. Product Scope (cannabinoid-first vs general Rx)

### Decision (locked)

**Flagship v1 scope is cannabinoid / medical-cannabis clinical command**, not a general-purpose competitor to UpToDate, Lexicomp, or CPS across all of medicine.

| In scope (v1) | Out of scope (v1) |
|---------------|-------------------|
| Regulated cannabinoid drugs, isolates, cannabis-derived formulations | General small-molecule and biologic prescribing across all classes |
| Medical-cannabis authorization / access pathways by jurisdiction | Full primary-care formulary for hypertension, diabetes, antibiotics, etc. as first-class depth |
| Cannabinoid-relevant conditions with reviewed evidence (e.g. certain epilepsies, spasticity, nausea, selected pain contexts where evidence exists) | Claiming comprehensive coverage for all common primary-care conditions |
| Safety, interactions, formulations, guidelines, practice rules **where reviewed for cannabinoids** | Inventing general drug monographs or interaction engines |
| Clear links to primary regulators and professional authorities | Substituting for local product monographs or national formularies |

### Why this boundary exists

- The evidence spine, intervention classes, and current production corpus are built around cannabinoid / cannabis-medicine concepts.
- “Flagship for all prescribing” implies a content and medical-review operation the organization does not yet have.
- Over-claiming general Rx depth creates safety, liability, and trust failure modes.

### How the UI must express scope

- Clinical header and empty states must not imply general medical reference coverage.
- Prefer language such as “Reviewed cannabinoid and medical-cannabis clinical evidence” over “all clinical evidence.”
- If a user searches a general condition/drug with no cannabinoid-related reviewed record, return an honest no-match / out-of-scope state — not a thin general-medicine answer.
- Future expansion to general Rx is a **separate product decision** with its own governance, staffing, and liability review — not a silent widening of v1.

---

## 2. Liability & Regulatory Posture

### Positioning (default until legal signs otherwise)

Clinical Command is **professional clinical reference / decision-support information** grounded in reviewed sources. It is **not**:

- A substitute for clinical judgment, local product labels, or jurisdictional standards of practice
- An electronic health record or order-entry system
- Patient-specific treatment advice
- (Unless separately validated and approved) software as a medical device (SaMD) or regulated clinical decision support in jurisdictions that distinguish those categories

### Required UI / legal affordances

- Persistent, non-dismissible framing that records are reviewed source summaries, not patient-specific orders.
- Every detail surface must retain primary-source links and verification dates.
- Explicit capability boundaries remain visible (e.g. no structured interaction checker until a governed dataset exists).
- No generative “what should I prescribe for this patient” answers in v1.

### Claims control

Marketing, sales, and in-app copy must align with the cannabinoid-first scope and the reference-not-directive posture. Expanding claims requires a new liability and regulatory review.

### Clinician audit trail (phase 1.1)

After core search and detail pages work, add a lightweight “what I viewed” capability for authenticated clinicians: record id, version/verified-at, jurisdiction context, timestamp. Purpose: professional accountability — not secondary use of PHI (v1 has no patient chart).

### Open legal questions (track explicitly)

- Whether any jurisdiction treats this presentation as regulated CDS/SaMD
- Cross-border provision of clinical reference information to clinicians outside the org’s home jurisdiction
- Requirements for adverse-event or safety signaling if pharmacovigilance content is summarized

---

## 3. Content Governance & Medical Review

### Roles

| Role | Responsibility |
|------|----------------|
| **Evidence author** | Drafts structured records from primary sources; no publish rights alone |
| **Clinical reviewer** | Licensed clinician (or jurisdiction-appropriate professional) who accepts/rejects clinical accuracy and applicability — **named appointee required (D4)** |
| **Jurisdiction reviewer** | Confirms regulator links, scheduling/access framing, and that claims match that country’s framework |
| **Publisher** | Final gate to `published`; may be dual-control with clinical reviewer for high-risk records |
| **Owner (product)** | Backlog prioritization, tier assignment, retirement of stale programs |

### Lifecycle

1. **Intake** — source identification (private queue; not visible as clinical guidance).
2. **Draft** — structured fields populated; uncertainty and conflicts called out.
3. **Clinical review** — accept, revise, or reject; record reviewer identity and timestamp.
4. **Jurisdiction check** — for the jurisdictions listed on the record.
5. **Publish** — visible in Clinical Command search/detail.
6. **Review due / re-verify** — driven by `review_due_at`, source currentness checks, and material change events.
7. **Supersede / unpublish** — prefer supersession with pointer over silent mutation of meaning.

### Rules

- No publish without clinical review for records that state efficacy, dosing, or safety conclusions.
- No clinical-synthesis publish until D4 appointment is recorded.
- Authority-registry entries (links and labels only) may use a lighter review bar; still require ownership and periodic link checks.
- Material conflicts between published records must surface in UI (`conflicted` state) and trigger review workflow.
- Private intake and unreviewed candidates must never appear in clinician-facing result lists.

### SLAs (initial targets)

- Broken primary-source link: fix or unpublish within 5 business days of detection.
- Regulator-notified safety signal affecting a published record: triage within 2 business days.
- Routine re-review: per `review_due_at`.

---

## 4. Subnational Rules

- **Country (required)** from Command context.
- **Subnational (optional)** only when reviewed data exists — **never inferred**.
- Canada: provincial detail only where explicitly reviewed; else federal authorities + “subnational coverage not published.”
- Same pattern for AU state endorsement notes and any future US state data.

---

## 5. Language & Localization

- UI chrome: English first.
- Clinical record bodies: language of review; no auto-translate of dosing/safety.
- **FR-CA:** per D5 — authority labels + empty-state strings in 90 days; full FR record bodies later.
- DE/AU/UK: local-language authority **names** in registry; record bodies may ship EN first with primary-source links in local language.

---

## 6. Design Principles

1. **Utility over polish**
2. **Jurisdiction-first, not Canada-first**
3. **Scope-honest** (cannabinoid / medical-cannabis v1)
4. **No silent cross-jurisdiction transfer**
5. **Transparent evidence**
6. **Role-aware but not siloed**
7. **No invented clinical capability**
8. **Governed publish path**

---

## 7. Multi-Jurisdiction Architecture

### Authority registry

Generalize `CANADA_CLINICAL_AUTHORITIES`. Minimum seed for 90 days: **CA, DE, AU, GB** (full CA; DE/AU/GB labels + official URLs + pharmacovigilance + who-may-prescribe summary).

Missing registry row → limited-coverage UI, never Canada fallback.

### Tiers

- **Tier 1:** CA, DE, AU, GB (depth as in D1 — not equal depth in 90 days)
- **Tier 2:** Authority + selective records (e.g. Israel next)
- **Tier 3:** Authority + honest empty

### Query / UI

- Default scope = active Command country (± subnational if set).
- Country switch re-scopes Clinical immediately.
- Status bar shows active jurisdiction, never hard-coded Canada.

---

## 8. Required Capabilities (within product scope)

Intelligent search, condition/drug detail pages, role-aware workflow, trust/transparency, and supporting tools as previously specified — all jurisdiction-scoped and cannabinoid-scope-honest. Existing dosing calculator remains **fail-closed** until its clinical-review gate is approved and only behind `requireVerifiedClinician`.

---

## 9. Implementation Sequence

1. Land #1456.
2. Lock scope copy + empty states; apply entitlement matrix (D2).
3. Appoint clinical reviewer + backup (D4) — hard gate for synthesis publish.
4. Authority registry for CA + DE + AU + GB; jurisdiction contract tests.
5. Governance path enforced.
6. Publish Canada P0 MVP (A.1).
7. DE + AU access pathway records; GB authority-complete.
8. FR-CA authority labels (D5).
9. Instrumentation by jurisdiction; clinician pilot.
10. Audit trail design/thin ship (phase 1.1).
11. General-Rx expansion only as a **separate** program.

---

## 10. Out of Scope (flagship v1)

- General primary-care / all-class drug monographs
- Full EMR / CPOE / patient-chart CDS
- Unreviewed generative clinical answers
- Auto-translation of clinical safety/dosing text
- Silent subnational inference
- Genetics or marketplace inside Clinical
- Equal content depth for every country on day one
- SaMD/CDS clearance claims without a dedicated program

---

## 11. Success Metrics

- In-jurisdiction search success for top **in-scope** probe queries > 90% on Canada after P0 publish; honest limited coverage elsewhere
- Zero cross-jurisdiction leakage
- Zero clinical-synthesis publish without named reviewer metadata
- Pilot tasks 1–3 pass for majority of participants
- Zero critical safety regressions

---

## 12. Related Work

- PR #1456 — Clinical Command production repair + mobile workspace
- Clinical evidence spine + RPCs
- `CANADA_CLINICAL_AUTHORITIES` / `clinicalCommandContract` — generalize
- `lib/clinical/auth.ts` — entitlement alignment
- Country intelligence profiles (DE, AU, UK, …) — authority seed source, not clinical claims
- Clinical education / jurisdiction briefings — align, don’t fork truth
- Cannabinoid dosing calculator — fail-closed until review gate

---

## Appendix A — Delivery Plan (executable)

### A.1 Named MVP topic list (**confirmed**)

**Hard cap:** ≤ 30 clinician-facing records for first publish wave.

#### Conditions / clinical contexts

| ID | Topic | Priority |
|----|-------|----------|
| C1 | Dravet syndrome (cannabinoid context) | P0 |
| C2 | Lennox-Gastaut syndrome (cannabinoid context) | P0 |
| C3 | MS-related spasticity | P0 |
| C4 | Chemotherapy-induced nausea/vomiting (CINV) | P0 |
| C5 | Selected chronic pain contexts (narrow, evidence-bounded) | P1 |
| C6 | Palliative / appetite–cachexia contexts (where evidence exists) | P1 |
| C7 | Pediatric considerations (cross-cutting) | P0 |
| C8 | Pregnancy & lactation (cross-cutting) | P0 |

#### Drugs / product classes

| ID | Topic | Priority |
|----|-------|----------|
| D1 | Cannabidiol (CBD) — purified / authorized products | P0 |
| D2 | THC-containing authorized products (class-level) | P0 |
| D3 | Nabiximols / oromucosal sprays (where marketed) | P1 |
| D4 | Plant cannabis medical authorization (framework, not strain claims) | P0 |
| D5 | Formulation & route differences (reviewed only) | P1 |

#### Pathways / practice

| ID | Topic | Priority |
|----|-------|----------|
| P1 | Medical authorization / access pathway — **Canada** | P0 |
| P2 | Adverse reaction reporting — how/where (per active jurisdiction) | P0 |
| P3 | Access pathway — **Germany** | P1 |
| P4 | Access pathway — **Australia** | P1 |
| P5 | Drug–drug interaction boundary notice | P0 |
| P6 | Access pathway — **United Kingdom** | P1 |

### A.2 Corpus gap table

Fill day 0 against production; update weekly. Columns: Jurisdiction × Topic ID × exists × status × dosing × safety × source linked × last verified × owner.

### A.3 Authority registry checklist

Seed **CA, DE, AU, GB** in first registry ship. Tests: no CA fallback; country switch swaps authorities; link health job.

### A.4 Clinician pilot

5–10 users (MD/NP/RPh mix); ≥1 non-Canada if DE or AU pathway live. Tasks: Dravet/CBD evidence; access pathway; ADR reporting; out-of-scope metformin; country switch. Fail if P0 still empty after day 60 → freeze UI features.

### A.5 Instrumentation

Probe set: 30–50 in-scope queries (include “Dravel”) + 10 out-of-scope controls. Targets per §11.

### A.6 90-day sequence

| Window | Outcomes |
|--------|----------|
| **Days 0–14** | #1456; scope + entitlement (D2); corpus baseline; ADR; **appoint reviewer (D4)** |
| **Days 15–30** | Authority registry CA+DE+AU+GB; contract tests; liability framing; FR-CA authority labels start |
| **Days 31–60** | Canada P0 publish under review; gap table weekly; pilot recruit |
| **Days 61–75** | Pilot; DE/AU pathway records if capacity; fix failures |
| **Days 76–90** | Pilot readout; go/no-go deepen vs widen; audit-trail thin ship |

### A.7 Risks & kill criteria

Unchanged in substance: #1456 slip, reviewer capacity, scope creep, legal delay, URL rot, divergent briefings. **Kill:** no Canada P0 by day 60 → stop new countries; leakage → stop UI expansion; pilot fail tasks 1–3 → stop “flagship” marketing.

### A.8 Decision log

| ID | Decision | Status |
|----|----------|--------|
| D1 | Tier-1 = CA, DE, AU, GB | **Resolved** 2026-08-16 |
| D2 | Entitlement matrix (auth vs verified vs staff) | **Resolved** 2026-08-16 |
| D3 | MVP list A.1 confirmed; pathways named | **Resolved** 2026-08-16 |
| D4 | Named clinical reviewer + backup | **Gate** — Tyler appoints by day 14 |
| D5 | FR-CA labels in 90 days; full FR records later | **Resolved** 2026-08-16 |

---

*This specification does not authorize any clinical claim not backed by reviewed evidence for the active jurisdiction. It does not expand product scope to general medicine without a separate governance and liability decision.*
