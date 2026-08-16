# Clinical Command — Flagship Enhancement Specification

**Status:** Proposal / Product Requirements  
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

## 1. Product Scope (cannabinoid-first vs general Rx)

### Decision (required product call)

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

### Relationship to high-volume condition lists

Earlier drafts listed hypertension, diabetes, infections, etc. as seed priorities. Under this scope decision those conditions are **in scope only insofar as reviewed cannabinoid-related evidence exists** for them (or as explicit future general-Rx phases). They are not a commitment to full primary-care monographs in v1.

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

Marketing, sales, and in-app copy must align with the cannabinoid-first scope and the reference-not-directive posture. Expanding claims (e.g. “replaces your monograph lookup for all meds”) requires a new liability and regulatory review.

### Clinician audit trail (phase 1.1)

After core search and detail pages work, add a lightweight “what I viewed” capability for authenticated clinicians: record id, version/verified-at, jurisdiction context, timestamp. Purpose: professional accountability — not secondary use of PHI (v1 has no patient chart).

### Open legal questions (track explicitly)

- Whether any jurisdiction treats this presentation as regulated CDS/SaMD
- Cross-border provision of clinical reference information to clinicians outside the org’s home jurisdiction
- Requirements for adverse-event or safety signaling if pharmacovigilance content is summarized

These do not block building the governed reference surface; they do block over-claiming and certain automated recommendation features.

---

## 3. Content Governance & Medical Review

Without a governed pipeline, multi-jurisdiction content is a liability. The following is required before scaling beyond a small curated set.

### Roles

| Role | Responsibility |
|------|----------------|
| **Evidence author** | Drafts structured records from primary sources; no publish rights alone |
| **Clinical reviewer** | Licensed clinician (or jurisdiction-appropriate professional) who accepts/rejects clinical accuracy and applicability |
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
- Authority-registry entries (links and labels only) may use a lighter review bar than clinical-synthesis records; still require ownership and periodic link checks.
- Material conflicts between published records must surface in UI (`conflicted` state) and trigger review workflow — not average away.
- Private intake and unreviewed candidates must never appear in clinician-facing result lists.

### SLAs (initial targets — tune with capacity)

- Broken primary-source link: fix or unpublish within 5 business days of detection.
- Regulator-notified safety signal affecting a published record: triage within 2 business days.
- Routine re-review: per `review_due_at` (default cadence set per evidence type).

### Staffing implication

Tier-1 depth in multiple countries is gated on reviewer capacity, not only engineering. The tier model exists so product does not promise inventory the review process cannot supply.

---

## 4. Subnational Rules

Country-level jurisdiction is necessary but not sufficient where authorization, formulary, or professional guidance is subnational.

### Model

- **Country (required):** ISO-aligned country context from Command (e.g. Canada, Germany, Australia).
- **Subnational (optional, structured):** province/state/territory code when the platform has reviewed subnational data (e.g. `CA-ON`, `US-CA`, `AU-NSW`).
- Evidence records may list country-only, or country + one or more subnational codes, in `jurisdiction` (or a dedicated subnational field if the spine is extended).

### v1 policy

- **Default display context:** country from Command. Subnational refinement is opt-in when the user (or org profile) sets a province/state and data exists.
- **No inference:** Do not infer Ontario formulary rules from a Canada-only record, or California rules from a US-only record.
- **Canada:** Provincial formulary / program detail is Tier-1 enhancement only where explicitly reviewed; otherwise show federal authorities + “subnational coverage not published.”
- **US / AU / others:** Same pattern — state/PBS-style detail only with reviewed records; otherwise honest limited coverage.

### UI

- Status bar: `Evidence command · Canada · Ontario` when subnational is active; otherwise country only.
- Filters: allow subnational when present in corpus; do not show empty subnational pickers as if data existed.
- Authority registry may include subnational entries (e.g. provincial colleges, state programs) nested under country.

### Engineering note

Prefer extending the existing jurisdiction representation over a parallel ad-hoc string. Any schema change must preserve “no cross-jurisdiction transfer” and RLS/publish boundaries.

---

## 5. Language & Localization

### v1 policy

- **UI chrome:** English first; existing product i18n patterns apply if already present elsewhere in Command.
- **Clinical record content:** Published in the language of the primary source review. v1 does not require full translation of all records into all languages.
- **Canada:** French is a Tier-1 *capability goal* for authority labels and high-traffic records where Canadian professional use demands it; not a blocker for English-only publish of a record if FR is pending — but FR-CA markets must not be marketed as complete without a FR plan.
- **Other markets:** Local language for authority names and “limited coverage” messaging is higher priority than full translation of every evidence summary.

### Rules

- Do not auto-translate clinical dosing or safety text without human clinical review of the translation.
- Patient-facing printable summaries (if any) inherit stricter language and readability requirements than clinician reference text.
- Language of interface and language of evidence are independent dimensions (e.g. English UI + German primary source link is valid).

### Tier interaction

| Tier | Language expectation |
|------|----------------------|
| Tier 1 | UI + core authority labels in primary professional language(s) of that market; key records reviewed in those languages over time |
| Tier 2 | UI in product default; authority labels localized where cheap/accurate; records in source language |
| Tier 3 | Correct authority links; messaging may be English until localized |

---

## 6. Design Principles

1. **Utility over polish** — Answer the in-scope question in <30 seconds for the user’s current jurisdiction.
2. **Jurisdiction-first, not Canada-first** — Every surface is driven by the active country (and optional subnational). Canada is the deepest seed market, not the permanent default for rules, authorities, or copy.
3. **Scope-honest** — Cannabinoid / medical-cannabis clinical command in v1; no silent general-Rx inventory.
4. **No silent cross-jurisdiction transfer** — Evidence for one country/subnational unit is not applicable elsewhere without an explicit reviewed record.
5. **Transparent evidence** — Source + date + grade; surface uncertainty, conflicts, limited coverage, and unsupported capabilities.
6. **Role-aware but not siloed** — Defaults may differ by profession; evidence remains shared and jurisdiction-scoped.
7. **No invented clinical capability** — No fabricated interactions, monitoring protocols, formulary status, or NNT figures.
8. **Governed publish path** — Clinician-facing content passes clinical (and jurisdiction) review before publish.

---

## 7. Multi-Jurisdiction Architecture (required)

### 7.1 Jurisdiction-aware authority registry
Replace (or strictly generalize) `CANADA_CLINICAL_AUTHORITIES` with a multi-jurisdiction registry. Each supported jurisdiction must define at minimum:

| Field | Purpose |
|-------|---------|
| Primary regulator(s) | e.g. Health Canada, FDA, MHRA, BfArM, TGA, ANVISA |
| Key legislation / scheduling framework | Controlled-substance class, medical access pathway |
| Safety / pharmacovigilance channel | Adverse-reaction reporting URL and authority name |
| Medical document / authorization rules | Who may authorize or prescribe |
| Guideline bodies | National or major subnational guideline sources |
| Formulary / reimbursement model note | High-level model only — not fabricated coverage claims |
| Optional subnational entries | Provincial/state programs and colleges when reviewed |

Authorities are **metadata + links**, not clinical claims. Missing authority data → limited-coverage state, never a Canada fallback.

### 7.2 Tiered content strategy

- **Tier 1 (deep):** Canada + product-chosen priority markets. Structured fields for in-scope cannabinoid topics; subnational where reviewed; language plan as in §5.
- **Tier 2 (core):** Authority registry + reviewed evidence for priority in-scope topics; “limited structured detail” labels.
- **Tier 3 (authority + honest empty):** Correct authorities; filter works; explicit no reviewed evidence for this jurisdiction.

### 7.3 Data model & query rules
- `jurisdiction` remains first-class; extend carefully for subnational.
- Default query scope = active Command country (± subnational if set).
- Out-of-jurisdiction records only when user explicitly broadens scope.
- Profession relevance stays metadata until role taxonomies are reconciled per jurisdiction.

### 7.4 UI requirements
- Status bar: jurisdiction (and subnational if active), not hard-coded Canada.
- Authority / safety / practice panels from registry.
- Country (and subnational) switch re-scopes Clinical immediately.
- Scope and liability framing always visible.

### 7.5 Non-negotiable safety rules
- No cross-country or cross-subnational transfer without explicit reviewed applicability.
- Prefer “no reviewed record for [jurisdiction]” over borrowed content.
- No general-Rx depth beyond governed cannabinoid-related corpus in v1.

---

## 8. Required Capabilities (within product scope)

### 8.1 Intelligent Search
- Fuzzy + synonym matching (brand/generic/INN, cannabinoid names, common misspellings).
- Clinical questions in-scope (“CBD in Dravet”, “authorization pathway in [jurisdiction]”).
- Filters: specialty, patient factors, evidence level, **jurisdiction / subnational**, recency.
- Empty results: closest in-jurisdiction matches + request-review path; out-of-scope general Rx searches fail closed with clear messaging.

### 8.2 Condition & Drug Detail Pages
Scoped to active jurisdiction and **in-scope intervention classes**:

| Section | Content |
|---------|---------|
| **Evidence summary** | Guideline recommendations, key trials/reviews, what changed |
| **Prescribing essentials** | Indications, dosing (when reviewed), duration, titration, monitoring, referral triggers |
| **Safety** | Contraindications, warnings, AEs, pregnancy/lactation (jurisdiction-relevant), deprescribing notes |
| **Interactions** | Only where a governed dataset exists; otherwise explicit boundary |
| **Alternatives & comparisons** | Within reviewed cannabinoid options; no fabricated superiority |
| **Jurisdiction layer** | Regulator status, access/authorization pathway, formulary notes only if reviewed |
| **Patient factors** | Pregnancy, pediatrics, geriatrics, comorbidities when evidence addresses them |

### 8.3 Workflow & UX
- Role-aware defaults; jurisdiction-aware persistence (recents, favorites).
- Progressive disclosure; mobile safe-area (see #1456).
- Real workspace (Search | Evidence | Guidelines | Authorities | Tools), not an empty state.

### 8.4 Trust, Transparency & Maintenance
- Source + date + grade on every claim.
- Last reviewed / next review visible.
- Separation from marketing and genetics.
- Versioning and supersession preferred over silent edits.

### 8.5 Supporting Tools
- Calculators only if clinically reviewed and in-scope (existing dosing calculator remains fail-closed until its gate is approved).
- Shared-decision aids only with reviewed numbers.
- No patient-specific protocol engine in v1.

---

## 9. Implementation Sequence (recommended)

1. Land #1456 (production diagnostics + mobile command surface).
2. **Lock product scope** in UI copy and empty states (cannabinoid / medical-cannabis clinical command).
3. **Generalize authorities** — multi-jurisdiction registry; remove Canada-only hard-coding.
4. **Jurisdiction contract tests** — country switch; no cross-jurisdiction leakage; limited-coverage states.
5. **Governance path** — enforce review roles on publish; keep intake private.
6. Seed Tier-1 in-scope content (Canada depth first, then next priority markets) under the review process.
7. Subnational support where reviewed data exists (start with priority Canadian provinces if applicable).
8. Language: authority labels + high-traffic FR-CA (or other Tier-1 local language) without auto-translating dosing/safety.
9. Instrument search abandonment **by jurisdiction and query type**; feed the backlog.
10. Audit trail (“what I viewed”) as phase 1.1.
11. Only after the above: consider a **separate** general-Rx expansion program with its own liability review.

---

## 10. Out of Scope (flagship v1)

- General primary-care / all-class drug monographs
- Full EMR integration / CPOE / patient chart CDS
- Unreviewed generative clinical answers
- Auto-translation of clinical safety/dosing text without human review
- Silent inference of subnational rules from country-level records
- Genetics or marketplace content inside Clinical
- Equal content depth for every country on day one
- Claiming SaMD/CDS regulatory clearance without a dedicated program

---

## 11. Success Metrics

- In-jurisdiction search success for **top in-scope** clinician queries > 90% on Tier-1 markets; honest limited/out-of-scope elsewhere.
- Zero cross-jurisdiction leakage in automated tests and spot audits.
- Zero publish of clinical-synthesis records without clinical review.
- Time-to-answer for common in-scope questions < 30 s.
- Clinician feedback that local regulatory context is trusted and scope is clear.
- Zero critical safety regressions (wrong dose, missing warning, wrong authorization framing).

---

## 12. Related Work

- PR #1456 — Clinical Command production repair + mobile workspace (land first).
- Clinical evidence spine migrations and RPCs (`jurisdiction`, review status, supersession, change events).
- `CANADA_CLINICAL_AUTHORITIES` / `clinicalCommandContract` — generalize.
- Existing clinical education country readiness and jurisdiction briefings — align, do not fork a second truth.
- Cannabinoid dosing calculator — remain fail-closed until explicit clinical-review gate.
- Private clinical evidence intake / review queues — keep non-published.

---

## Appendix A — Delivery Plan (executable)

This appendix turns policy into a backlog. Numbers and named topics are **starting templates** — product and clinical review may substitute equivalents, but the plan must stay named and finite.

### A.1 Named MVP topic list (ship target)

**Hard cap for first publish wave:** ≤ 30 clinician-facing records (condition, drug/class, or pathway). Prefer depth over breadth.

#### Conditions / clinical contexts (illustrative starter set)

| ID | Topic | Why in scope | Priority |
|----|-------|--------------|----------|
| C1 | Dravet syndrome (cannabinoid context) | High-recognition query; matches known empty-search pain (“Dravel”) | P0 |
| C2 | Lennox-Gastaut syndrome (cannabinoid context) | Paired epilepsy evidence | P0 |
| C3 | MS-related spasticity | Common authorized context in multiple markets | P0 |
| C4 | Chemotherapy-induced nausea/vomiting (CINV) | Established cannabinoid use-case | P0 |
| C5 | Selected chronic pain contexts (narrow, evidence-bounded) | High demand; strict uncertainty labeling required | P1 |
| C6 | Palliative / appetite–cachexia contexts (where evidence exists) | Specialty use | P1 |
| C7 | Pediatric considerations (cross-cutting, not a diagnosis) | Safety-critical | P0 |
| C8 | Pregnancy & lactation (cross-cutting) | Safety-critical | P0 |

#### Drugs / product classes (illustrative)

| ID | Topic | Notes | Priority |
|----|-------|-------|----------|
| D1 | Cannabidiol (CBD) — purified / authorized products | Jurisdiction-specific authorization | P0 |
| D2 | THC-containing authorized products (class-level) | Avoid brand promotion; label-linked | P0 |
| D3 | Nabiximols / oromucosal sprays (where marketed) | Market-dependent | P1 |
| D4 | Plant cannabis medical authorization (framework, not strain claims) | Pathway + practice rules | P0 |
| D5 | Formulation & route differences (oil, capsule, inhaled where legal) | Safety and onset — reviewed only | P1 |

#### Pathways / practice (illustrative)

| ID | Topic | Notes | Priority |
|----|-------|-------|----------|
| P1 | Medical authorization / access pathway — Canada | Federal + “subnational not published” unless reviewed | P0 |
| P2 | Adverse reaction reporting — how/where | Authority-registry driven | P0 |
| P3 | Access pathway — Tier-1 market #2 (product-chosen) | Same structure as P1 | P1 |
| P4 | Access pathway — Tier-1 market #3 | Same structure | P1 |
| P5 | Drug–drug interaction boundary notice | Explicit “not a full interaction checker” | P0 |

Product replaces any row with higher-value in-scope topics; **does not** add general hypertension/diabetes monographs under this MVP.

### A.2 Corpus gap table (fill before scaling)

Run once against production (or staging mirror). Update weekly during the 90-day window.

| Jurisdiction | Topic ID | Record exists? | Status (`published` / draft / none) | Structured dosing? | Safety section? | Primary source linked? | Last verified | Owner |
|--------------|----------|----------------|-------------------------------------|--------------------|-----------------|------------------------|---------------|-------|
| Canada | C1 | | | | | | | |
| Canada | C2 | | | | | | | |
| Canada | … | | | | | | | |
| [Tier-1 #2] | … | | | | | | | |

**Baseline metrics to capture on day 0**

- Count of `published` clinical evidence records by jurisdiction
- Count of published records with non-empty dosing / safety / source fields
- Top 50 search queries (if any instrumentation exists) and hit rate
- Current hard-coded Canada-only UI paths (`CANADA_CLINICAL_AUTHORITIES` call sites)

### A.3 Authority registry — engineering checklist (ADR-level)

Produce a short ADR + initial seed (not only prose in this doc):

- [ ] Data shape: `country_iso2`, optional `subnational_code`, regulator name, URLs, scheduling/access summary (non-clinical), pharmacovigilance URL, guideline body links, last_checked_at, owner
- [ ] Code location: replace hard-coded `CANADA_CLINICAL_AUTHORITIES` consumption in mobile/desktop Clinical
- [ ] Seed: Canada complete; ≥2 additional Tier-1 countries minimum viable labels + official URLs
- [ ] Behavior: missing registry row → limited-coverage UI, never Canada fallback
- [ ] Tests: country switch swaps authorities; snapshot test for no CA URLs when country ≠ CA
- [ ] Link health: quarterly check or automated HEAD/GET job for primary URLs

### A.4 Clinician pilot (validation loop)

**Who:** 5–10 target users (mix of MD / NP / RPh where possible), at least one non-Canada if Tier-1 #2 is live.

**Tasks (timed, observed or self-reported):**

1. Find evidence related to Dravet / CBD (or local equivalent query).
2. Find medical access / authorization pathway for active jurisdiction.
3. Find adverse-reaction reporting path.
4. Search an out-of-scope general drug (e.g. metformin) — confirm honest empty/out-of-scope.
5. Switch country — confirm authorities and results re-scope.

**Pass signals:** tasks 1–3 completable in <60s with correct jurisdiction framing; task 4 does not show invented general Rx; task 5 shows zero cross-jurisdiction leakage.

**Fail → action:** if P0 topics still empty after day 60, freeze UI feature work and only publish content + fix empty states.

### A.5 Instrumentation & metric baselines

| Metric | Definition | Baseline | Target (Tier-1, in-scope) |
|--------|------------|----------|---------------------------|
| Search hit rate | Queries with ≥1 in-jurisdiction published result / all in-scope probe queries | Measure day 0 | >90% on probe set |
| Empty-result rate | Share of searches with zero results | Measure day 0 | Decline as corpus grows; never “fake” hits |
| Cross-jurisdiction leakage | Automated tests + monthly audit | 0 required | 0 |
| Time-to-first-useful-view | Search → open record with sources visible | Qualitative in pilot | <30s median in pilot |
| Publish without review | Count of clinical-synthesis publishes missing reviewer metadata | 0 required | 0 |

**Probe query set:** maintain a versioned list of 30–50 in-scope queries (including common misspellings such as “Dravel”) and 10 out-of-scope controls.

### A.6 90-day sequence

Assumes #1456 lands early in the window. If #1456 slips, days shift; do not build content UX on a broken production spine.

| Window | Outcomes |
|--------|----------|
| **Days 0–14** | Land #1456; lock scope copy + empty states; capture corpus baseline; draft gap table; ADR for authority registry; confirm entitlement (who sees Clinical) |
| **Days 15–30** | Ship multi-jurisdiction authority registry (CA + ≥2 countries); jurisdiction contract tests; governance publish path enforced; liability framing in UI |
| **Days 31–60** | Publish P0 MVP records for Canada (conditions + pathways + key drug classes); fill gap table weekly; start clinician pilot recruitment |
| **Days 61–75** | Pilot running; fix top failure modes; optional Tier-1 #2 pathway + 3–5 records if reviewer capacity allows |
| **Days 76–90** | Pilot readout; hit-rate on probe set; decide go/no-go for wider Tier-1 content vs freeze and deepen Canada only; audit-trail (“what I viewed”) design or thin ship |

### A.7 Risks, dependencies, kill criteria

| Risk | Impact | Mitigation |
|------|--------|------------|
| #1456 delayed | UI rebuild and production diagnostics blocked | Sequence content authoring in parallel; do not market Clinical as fixed |
| Reviewer capacity < publish ambition | Stale or empty flagship | Cap MVP at P0; tier model; freeze new countries |
| Scope creep to general Rx | Liability + thin content everywhere | Reject out-of-scope records; empty state for general queries |
| Legal delay on positioning language | Launch copy uncertainty | Ship conservative reference framing by default |
| Authority URLs rot | Trust failure | last_checked_at + link job; unpublish/replace on break |
| Divergent truth vs education/briefings | Clinician confusion | Single jurisdiction owner; cross-link, don’t duplicate |
| Entitlement undecided | Wrong RLS / wasted content | Decide in days 0–14 |

**Kill / freeze criteria**

- Stop adding countries if P0 Canada records are not published by day 60.
- Stop UI feature expansion if cross-jurisdiction leakage is found in production.
- Stop marketing “flagship” language if pilot tasks 1–3 fail for majority of participants.

### A.8 Open product decisions (resolve in days 0–14)

1. Tier-1 markets beyond Canada (exactly which 2–4).
2. Entitlement: which roles/orgs/plans see Clinical Command.
3. Named final MVP list (confirm or edit A.1).
4. Primary clinical reviewer(s) and backup.
5. Whether FR-CA authority labels are in the 90-day window or immediately after.

---

*This specification does not authorize any clinical claim not backed by reviewed evidence for the active jurisdiction. It does not expand product scope to general medicine without a separate governance and liability decision. Appendix A is a delivery template — topic rows may be substituted, but the program must remain finite, measured, and governed.*
