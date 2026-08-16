# Clinical Command — Flagship Enhancement Specification

**Status:** Proposal / Product Requirements  
**Audience:** Clinical product, eng, medical reviewers  
**Goal:** Make the Clinical section the flagship surface a doctor, nurse practitioner, or pharmacist reaches for at the moment of prescribing — in **any supported jurisdiction**, not only Canada.

## Current State (as of 2026-08-16)

- Thin shell: marketing description + single search box.
- Search for terms such as “Dravel” returns “No reviewed condition or evidence record matches this search.”
- No populated evidence base, dosing, interactions, formulary, or jurisdiction-specific regulatory detail visible in the primary viewport.
- Existing PR #1456 repairs production migration drift, improves diagnostics, and rebuilds the mobile command surface around evidence-first views. That work is foundational and should land first.
- Evidence model already stores `jurisdiction` as an array and the search API accepts a jurisdiction parameter. UI and content remain heavily Canada-centric (`CANADA_CLINICAL_AUTHORITIES`, Canada-default copy, Canada-seeded records).

This document specifies what is still required to make Clinical *indispensable* and **jurisdiction-correct worldwide**.

## Design Principles

1. **Utility over polish** — Answer “what should I prescribe / how / what do I watch for / what’s covered here” in <30 seconds for the user’s current jurisdiction.
2. **Jurisdiction-first, not Canada-first** — Every surface is driven by the active country/jurisdiction. Canada is the deepest seed market, not the permanent default for rules, authorities, or copy.
3. **No silent cross-jurisdiction transfer** — Evidence published for one country must never be presented as applicable in another without an explicit reviewed record that says so.
4. **Transparent evidence** — Every claim linked to source + date + evidence grade. Explicitly surface uncertainty, conflicts, limited coverage, and unsupported capabilities.
5. **Role-aware but not siloed** — Default views can differ for MD / NP / RPh (and local equivalents); core evidence remains shared and jurisdiction-scoped.
6. **No invented clinical capability** — Do not fabricate interaction checkers, patient-specific monitoring, formulary status, or NNT numbers that lack reviewed data for that jurisdiction.

## Multi-Jurisdiction Architecture (required)

### 1. Jurisdiction-aware authority registry
Replace (or strictly generalize) `CANADA_CLINICAL_AUTHORITIES` with a multi-jurisdiction registry. Each supported jurisdiction must define at minimum:

| Field | Purpose |
|-------|---------|
| Primary regulator(s) | e.g. Health Canada, FDA, MHRA, BfArM, TGA, ANVISA |
| Key legislation / scheduling framework | Controlled-substance class, medical access pathway |
| Safety / pharmacovigilance channel | Adverse-reaction reporting URL and authority name |
| Medical document / authorization rules | Who may authorize or prescribe |
| Guideline bodies | National or major subnational guideline sources |
| Formulary / reimbursement model note | High-level model (public formulary, insurance, out-of-pocket) — not fabricated coverage claims |

Authorities are **metadata + links**, not clinical claims. Missing authority data for a jurisdiction must produce a clear limited-coverage state, never a Canada fallback.

### 2. Tiered content strategy
Full equal depth for every country is not feasible on day one. Explicit tiers:

- **Tier 1 (deep):** Canada + 2–4 priority markets (chosen by product). Structured dosing, safety, guidelines, formulary/regulatory notes, high-volume conditions.
- **Tier 2 (core):** Authority registry + reviewed evidence records for priority conditions/drugs; clear “limited structured detail” labels.
- **Tier 3 (authority + honest empty):** Correct primary authorities, jurisdiction filter works, explicit “no reviewed evidence published for this jurisdiction” state. Never show another country’s rules.

Content expansion order must be product-prioritized and instrumented (search abandonment by jurisdiction).

### 3. Data model & query rules
- Keep `jurisdiction` as a first-class array on evidence records and change events.
- Search and list endpoints must accept jurisdiction (single or multi) and must not return out-of-jurisdiction records unless the user explicitly requests broader scope.
- “All jurisdictions” / multi-select is allowed; default is the user’s active country from Command context.
- Profession relevance remains evidence metadata only until role taxonomies are reconciled per jurisdiction.

### 4. UI requirements for multi-country
- Status bar and headings show active jurisdiction (e.g. “Evidence command · Germany · All roles”), never hard-coded Canada.
- Authority links, safety panels, and practice panels are driven by the authority registry for the active jurisdiction.
- Empty / limited-coverage states are jurisdiction-specific and actionable (request review, open primary regulator).
- Desktop and mobile share the same jurisdiction contract.
- Country switch in Command must re-scope Clinical immediately (new search context, new authorities, new empty states).

### 5. Non-negotiable safety rules
- Do not transfer Canadian formulary, scheduling, or authorization rules to any other country.
- Do not present a record whose `jurisdiction` array does not include the active country as applicable there.
- When coverage is thin, prefer “no reviewed record for [country]” over partial or borrowed content.

## Required Capabilities (all jurisdictions)

### 1. Intelligent Search
- Fuzzy + synonym matching (brand/generic/INN, common misspellings, abbreviations).
- Support natural-language clinical questions (“first-line for X in pregnancy”, “dose adjust for eGFR 30”).
- Autocomplete, “did you mean”, related conditions.
- Filters: specialty, patient factors (pregnancy, elderly, renal), evidence level, **jurisdiction**, recency.
- Empty results must never be a dead-end (closest matches within jurisdiction + request-review path).

### 2. Condition & Drug Detail Pages (the core experience)
For every major condition and associated drug(s), scoped to the active jurisdiction:

| Section | Content |
|---------|---------|
| **Evidence summary** | Guideline recommendations (strength/grade), key trials/systematic reviews, “what changed recently” |
| **Prescribing essentials** | Indications, dosing tables (adult/pediatric/renal/hepatic), duration, titration, monitoring parameters, when to refer |
| **Safety** | Contraindications, warnings/precautions, common + serious AEs, black-box / equivalent, pregnancy/lactation (jurisdiction-relevant), deprescribing notes |
| **Interactions** | Clinically significant drug–drug, drug–disease, drug–food + management advice (only where reviewed data exists for that jurisdiction) |
| **Alternatives & comparisons** | Relative efficacy/safety, cost, formulary / reimbursement status where reviewed |
| **Jurisdiction layer** | Regulator status + monograph/label link, formulary or coverage notes, special authorization, local HTA/guideline recommendations |
| **Patient factors** | One-click or collapsible sections for pregnancy, pediatrics, geriatrics, common comorbidities |

### 3. Workflow & UX
- Role-aware defaults (pharmacist sees more interaction/formulary detail; physician sees more diagnostic/therapeutic pathways), respecting local profession labels where defined.
- Quick-reference formats: dosing cards, interaction summary, decision algorithms, calculators (CrCl, CHA₂DS₂-VASc, etc.) when evidence-supported.
- Persistent elements: recent searches, favorites/starred topics, “continue where I left off” (jurisdiction-aware).
- Progressive disclosure — summary first, expandable evidence second.
- Compact header + safe-area clearance for mobile bottom nav (already partially addressed in #1456).
- “Open clinician workspace” must open a real multi-panel or tabbed surface (Search | Condition | Drug | Guidelines | Tools), not an empty state.

### 4. Trust, Transparency & Maintenance
- Every claim linked to sources (guidelines, monographs, primary literature) with dates and evidence levels.
- Explicit “last reviewed” / “next review” dates. Flag incomplete or expert-opinion-only content.
- Clear separation from marketing / genetics sections.
- Versioning and change logs for high-stakes topics.
- Explicit capability boundaries (e.g. “structured drug–cannabinoid interaction checking not yet available for this jurisdiction”).

### 5. Coverage Priorities (seed set)
High-volume primary-care and common specialty conditions first (same clinical priorities across markets):
- Hypertension, diabetes, common infections, contraception, pain, mental health, COPD/asthma, headache/migraine, anticoagulation, heart failure, etc.

Both entry points must work:
- Condition → “what do I prescribe”
- Drug → “everything I need to know”

Seed depth follows the tier model above. Canada may remain the deepest initial corpus; other Tier-1 markets must have authority registry + starter evidence before Clinical is marketed as available there.

### 6. Supporting Tools
- Calculators and checklists where evidence-supported and jurisdiction-appropriate.
- Shared-decision-making aids (NNT/NNH only when reviewed data exists).
- Pathways / “what if” flows (treatment failure, intolerance, special populations).
- Printable / shareable patient-friendly summaries (jurisdiction-scoped).

## Implementation Sequence (recommended)

1. Land #1456 (production diagnostics + mobile command surface).
2. **Generalize authorities** — introduce multi-jurisdiction authority registry; remove hard-coded Canada-only UI paths; drive status bar, safety, and practice panels from registry.
3. **Jurisdiction contract tests** — country switch re-scopes Clinical; out-of-jurisdiction records never appear by default; limited-coverage states are correct.
4. Seed realistic starter content for Tier-1 markets (start with Canada depth, then expand) for 8–12 high-value conditions + associated drugs under strict review.
5. Ship the condition/drug detail page as the primary experience, jurisdiction-scoped.
6. Instrument search abandonment and top queries **by jurisdiction**; use data to prioritize content expansion.
7. Iterate on role views, calculators, and advanced filters only after core search + detail pages are trusted for at least one Tier-1 market beyond Canada.

## Out of Scope (for this flagship pass)
- Full EMR integration / CPOE.
- Real-time patient-specific CDS with PHI.
- Unreviewed generative clinical answers.
- Genetics or marketplace content bleeding into Clinical.
- Claiming equal depth for every country on day one (use the tier model instead).

## Success Metrics
- Search success rate (results returned for top clinician queries **within the active jurisdiction**) > 90% for Tier-1 markets; honest limited-coverage for others.
- Time-to-answer for common prescribing questions < 30 s (measured via instrumentation).
- Zero cross-jurisdiction leakage (no Canadian rule shown as applicable elsewhere without explicit reviewed record).
- Clinician feedback that the surface is trusted for local regulatory context, not only Canadian.
- Zero critical safety regressions (wrong dose, missing black-box/equivalent, incorrect formulary or authorization status).

## Related Work
- PR #1456 — Clinical Command: production failure diagnostics and mobile workspace (must land first).
- Existing clinical evidence spine migration and RPCs (`jurisdiction` already on records).
- `CANADA_CLINICAL_AUTHORITIES` / `clinicalCommandContract` — must be generalized, not extended only for Canada.
- Country/Command context already supplies `country` / jurisdiction to the Clinical surface.

---

*This specification is derived from product review of the current Clinical surface and clinician workflow needs. It does not authorize any clinical claim not backed by reviewed evidence for the active jurisdiction.*
