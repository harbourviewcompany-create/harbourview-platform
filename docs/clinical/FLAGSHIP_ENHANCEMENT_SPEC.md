# Clinical Command — Flagship Enhancement Specification

**Status:** Proposal / Product Requirements  
**Audience:** Clinical product, eng, medical reviewers  
**Goal:** Make the Clinical section the flagship surface a Canadian doctor, nurse practitioner, or pharmacist actually reaches for at the moment of prescribing.

## Current State (as of 2026-08-16)

- Thin shell: marketing description + single search box.
- Search for terms such as “Dravel” returns “No reviewed condition or evidence record matches this search.”
- No populated evidence base, dosing, interactions, formulary, or Canada-specific regulatory detail visible in the primary viewport.
- Existing PR #1456 repairs production migration drift, improves diagnostics, and rebuilds the mobile command surface around evidence-first views. That work is foundational and should land first.

This document specifies what is still required to make Clinical *indispensable*.

## Design Principles

1. **Utility over polish** — Answer “what should I prescribe / how / what do I watch for / what’s covered in Canada” in <30 seconds.
2. **Canada-first** — Health Canada status, provincial formularies, CADTH/INESSS, national & provincial guidelines, Choosing Wisely Canada.
3. **Transparent evidence** — Every claim linked to source + date + evidence grade. Explicitly surface uncertainty, conflicts, and unsupported capabilities.
4. **Role-aware but not siloed** — Default views can differ for MD / NP / RPh; core evidence remains shared.
5. **No invented clinical capability** — Do not fabricate interaction checkers, patient-specific monitoring, or NNT numbers that lack reviewed data.

## Required Capabilities

### 1. Intelligent Search
- Fuzzy + synonym matching (brand/generic/INN, common misspellings, abbreviations).
- Support natural-language clinical questions (“first-line for X in pregnancy”, “dose adjust for eGFR 30”).
- Autocomplete, “did you mean”, related conditions.
- Filters: specialty, patient factors (pregnancy, elderly, renal), evidence level, Canada-only, recency.
- Empty results must never be a dead-end (closest matches + request-review path).

### 2. Condition & Drug Detail Pages (the core experience)
For every major condition and associated drug(s):

| Section | Content |
|---------|---------|
| **Evidence summary** | Guideline recommendations (strength/grade), key trials/systematic reviews, “what changed recently” |
| **Prescribing essentials** | Indications, dosing tables (adult/pediatric/renal/hepatic), duration, titration, monitoring parameters, when to refer |
| **Safety** | Contraindications, warnings/precautions, common + serious AEs, black-box, pregnancy/lactation (Canada-relevant), deprescribing notes |
| **Interactions** | Clinically significant drug–drug, drug–disease, drug–food + management advice (only where reviewed data exists) |
| **Alternatives & comparisons** | Relative efficacy/safety, cost, formulary status |
| **Canada layer** | Health Canada status + monograph link, provincial formulary coverage (major provinces), special authorization, CADTH/INESSS recommendations |
| **Patient factors** | One-click or collapsible sections for pregnancy, pediatrics, geriatrics, common comorbidities |

### 3. Workflow & UX
- Role-aware defaults (pharmacist sees more interaction/formulary detail; physician sees more diagnostic/therapeutic pathways).
- Quick-reference formats: dosing cards, interaction summary, decision algorithms, calculators (CrCl, CHA₂DS₂-VASc, etc.).
- Persistent elements: recent searches, favorites/starred topics, “continue where I left off”.
- Progressive disclosure — summary first, expandable evidence second.
- Compact header + safe-area clearance for mobile bottom nav (already partially addressed in #1456).
- “Open clinician workspace” must open a real multi-panel or tabbed surface (Search | Condition | Drug | Guidelines | Tools), not an empty state.

### 4. Trust, Transparency & Maintenance
- Every claim linked to sources (guidelines, monographs, primary literature) with dates and evidence levels.
- Explicit “last reviewed” / “next review” dates. Flag incomplete or expert-opinion-only content.
- Clear separation from marketing / genetics sections.
- Versioning and change logs for high-stakes topics.
- Explicit capability boundaries (e.g. “structured drug–cannabinoid interaction checking not yet available”).

### 5. Coverage Priorities (seed set)
High-volume primary-care and common specialty conditions first:
- Hypertension, diabetes, common infections, contraception, pain, mental health, COPD/asthma, headache/migraine, anticoagulation, heart failure, etc.

Both entry points must work:
- Condition → “what do I prescribe”
- Drug → “everything I need to know”

### 6. Supporting Tools
- Calculators and checklists where evidence-supported.
- Shared-decision-making aids (NNT/NNH only when reviewed data exists).
- Pathways / “what if” flows (treatment failure, intolerance, special populations).
- Printable / shareable patient-friendly summaries.

## Implementation Sequence (recommended)

1. Land #1456 (production diagnostics + mobile command surface).
2. Seed realistic starter content for 8–12 high-value conditions + associated drugs (even if initially curated/mocked under strict review).
3. Ship the condition/drug detail page as the primary experience.
4. Add Canada-specific layers (formulary, Health Canada, key guidelines) early.
5. Instrument search abandonment and top queries; use data to prioritize content expansion.
6. Iterate on role views, calculators, and advanced filters only after core search + detail pages are trusted.

## Out of Scope (for this flagship pass)
- Full EMR integration / CPOE.
- Real-time patient-specific CDS with PHI.
- Unreviewed generative clinical answers.
- Genetics or marketplace content bleeding into Clinical.

## Success Metrics
- Search success rate (results returned for top 50 clinician queries) > 90%.
- Time-to-answer for common prescribing questions < 30 s (measured via instrumentation).
- Clinician NPS / qualitative feedback that the surface is preferred over or complementary to UpToDate / Lexicomp / CPS for Canadian context.
- Zero critical safety regressions (wrong dose, missing black-box, incorrect formulary status).

## Related Work
- PR #1456 — Clinical Command: production failure diagnostics and mobile workspace (must land first).
- Existing clinical evidence spine migration and RPCs.
- Canada jurisdiction + profession metadata already present in evidence model.

---

*This specification is derived from product review of the current Clinical surface and clinician workflow needs. It does not authorize any clinical claim not backed by reviewed evidence.*
