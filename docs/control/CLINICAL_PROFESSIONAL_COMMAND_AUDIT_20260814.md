# Clinical Professional Command audit — 2026-08-14

Base: `main` @ `d998f511f62eeb0539ebf21a7132dcb161eaac3f`

## Objective

Move mobile Clinical from long-form jurisdiction prose toward a professional command surface while preserving existing Clinical-in-Command navigation and refusing to imply clinical capabilities that the repository does not yet support.

## Repository-verified capability map

### Command and deep-link wiring

- Mobile Clinical is a first-class Command domain in `components/dashboard/mobile-command/contracts.ts`.
- `SECTION_GROUPS.overview` contains `clinical`; global mobile destinations remain Command / Market / Intel / Actions.
- Mobile `clinical` maps to desktop `CommandPage` value `clinical` and supports `commandHref('clinical')` deep linking.
- `components/dashboard/MobileCommandCentreRebuild.tsx` renders `ClinicalSection` from the selected country/role context.
- Current mobile Clinical inputs are limited to `countryIntel.briefing_program_status`, `medical_status`, `briefing_patient_access`, `briefing_physician_access`, plus the selected role label. These fields do not carry field-level provenance, evidence grading, source timestamp, or professional-regulator identity.

### Clinical UI implementations

- `components/dashboard/mobile-command/sections/DomainSections.tsx`: current mobile surface. Before this remediation it rendered two long-form cards: patient access and prescriber access.
- `components/dashboard/ClinicalPanel.tsx`: authenticated clinical workspace with clinician verification, patient creation/listing, consent creation and a cannabinoid dose-calculation tab.
- The authenticated panel is not the same data model as the mobile jurisdiction briefing and is not currently a condition-evidence explorer, interaction checker, formulary browser, monitoring workspace, pharmacovigilance workflow, or guideline-change feed.

### Clinical APIs — complete `app/api/clinical` route-file universe on the audited base

1. `app/api/clinical/me/route.ts`
2. `app/api/clinical/patients/route.ts`
3. `app/api/clinical/patients/[id]/consent/route.ts`
4. `app/api/clinical/calculations/route.ts`
5. `app/api/clinical/prescriptions/route.ts`
6. `app/api/clinical/recommendations/route.ts`
7. `app/api/clinical/verification/request/route.ts`
8. `app/api/clinical/admin/verify/route.ts`

`docs/control/CLINICAL_COMMAND_CENTRE_WIRING.md` confirms the authenticated surface expects `/api/clinical/me`, verification, patients, consent, calculations, recommendations and prescriptions; mutation access is intended for verified clinicians.

### Clinical education

- `lib/server/clinicalEducationQuery.ts` contains server queries for `clinical_education_modules` and `clinical_education_country_readiness`.
- Module DTO fields include audience, module status, risk level, public summary, research status, professional-review requirement, source basis, reviewer role, audience boundary, last/next review dates, public-use approval, medical-advice boundary, country relevance, format relevance, disclaimer and CTA.
- Routes exist at `/network/clinical-education`, `/network/clinical-education/[slug]`, and `/network/clinical-education/request`.
- Repository search on the audited base found `getClinicalEducationModules()` only in its query module and control documentation; the mobile Clinical section does not receive those module DTOs. This is a wiring gap, not proof that no records exist in production.

### Dosing / product-formulation logic

- `lib/clinical/dosing.ts` contains `cannabinoid.weight_based.v1` and optional THC/CBD percentage inputs.
- The source itself states the hard ceiling is an interim value, is not a clinically validated maximum, and **must be reviewed by qualified clinical/legal reviewers before use with a real patient**.
- `app/api/clinical/calculations/route.ts` previously permitted verified clinicians to execute and persist that algorithm. This remediation adds a fail-closed runtime gate (`CLINICAL_CALCULATOR_REVIEW_APPROVED=1`) so the code remains available but cannot be used clinically by default before the required review.
- This algorithm is not a product/formulary dataset. No reviewed mobile product/formulation evidence DTO was verified during this audit.

### Regulatory / jurisdiction data visible to mobile Clinical

- Mobile Clinical receives country briefing strings through `countryIntel`; it does not receive source/evidence metadata for each statement.
- The screenshot-era ACMPR text is stale. The current federal framework is the Cannabis Act / Cannabis Regulations. Primary Canadian sources verified for this remediation are represented in `clinicalCommandContract.ts`: Cannabis Regulations §272, §273, current Health Canada safety/interaction guidance, and Health Canada health-professional adverse-reaction guidance.
- Provincial/territorial professional-regulator requirements are not represented by a verified Clinical DTO in the mobile component. They must remain unknown until a regulator-source contract is wired.

### Existing professional actions

Verified actions/routes are: open the authenticated Clinical workspace, open the jurisdiction Command context, open the professional clinical-education surface, request clinical education through the existing request route, request clinician verification, manage patients/consent through authenticated APIs, and use prescription/recommendation APIs where their existing authenticated contracts permit. This P0 does not promote recommendation/prescription/calculation APIs as evidence-backed point-of-care decision support.

## P0 remediation implemented in this branch

- Replaces the mobile title `Clinical access and education` and long-form two-card hierarchy with `Professional clinical command`.
- Organizes the first operational content around **What changed**, **What requires attention**, and **What can I do next**.
- Suppresses any incoming briefing text containing `ACMPR` or the full legacy regulation name instead of re-publishing stale legal framing.
- Adds deterministic source states: loaded, empty, no-match, stale, degraded, permission and error. The current country-briefing adapter can derive loaded/empty/stale/degraded; no-match/permission/error are explicit contract states for adapters that can actually signal them.
- Adds primary-authority cards for current federal authorization/document requirements, Health Canada safety/interaction guidance, and adverse-reaction guidance.
- Every new material federal card includes jurisdiction, evidence/source type, explicit “evidence strength not graded by source”, primary-source identity, direct source URL and verification date.
- Distinguishes primary-authority clinical guidance from Harbourview genetics/product marketing by explicit UI copy.
- Keeps Clinical within Command and preserves Command / Market / Intel / Actions global navigation.
- Adds focused contract tests for legacy-term suppression, state derivation, provenance completeness and interaction-capability honesty.
- Fails closed on the repository’s explicitly unreviewed cannabinoid dose calculator until qualified review is affirmatively enabled.

## Missing capability matrix

### P0 — blocks a defensible professional clinical surface

| Capability | Current verified state | Required production contract |
|---|---|---|
| Field-level clinical provenance | Missing from mobile country briefing | `ClinicalEvidenceRecordDTO` with source URL/id, authority, jurisdiction, evidence type, evidence grade/grade methodology or explicit ungraded status, effective/published/reviewed timestamps, supersession and review state |
| Evidence-by-condition discovery | Not verified | Condition taxonomy + evidence records + search/filter API + primary citations + population/outcome/formulation distinctions |
| Structured interaction checker | Not verified | Reviewed drug/substance interaction knowledge model, mechanism/evidence/severity/uncertainty/provenance, versioning and clinical-review workflow |
| Cannabinoid/formulation evidence explorer | Not verified | Separate regulated-drug vs general-cannabis evidence DTO; formulation/route/cannabinoid composition; jurisdiction/product status; evidence provenance |
| Provincial/territorial profession rules | Not wired to Clinical | Regulator authority records keyed by jurisdiction + profession, effective dates, source docs and change state |
| Clinical changes/attention feed | Not verified | Change-event DTO linking old/new evidence or requirement, materiality, affected jurisdiction/profession and source snapshot |
| Source-state propagation | Partial | Server/source adapters must propagate loaded/empty/no-match/stale/degraded/permission/error plus retry metadata; UI must not infer permission/error from missing prose |
| Dose calculator clinical approval | Explicitly not approved by its own source comments | Qualified clinical/legal review artifact, approved algorithm/version, indication/population boundaries, test vectors, jurisdiction/formulary policy and deployment enablement |

### P1 — needed for a best-in-class professional workflow

| Capability | Gap |
|---|---|
| Safety assessment workspace | No structured patient-safety/contraindication workflow verified |
| Monitoring/outcomes | Patient records exist, but no verified therapeutic-objective, outcome, adverse-effect, follow-up or stop/adjust workflow was found in the mobile Clinical contract |
| Pharmacovigilance workflow | Primary-source guidance can be linked, but no structured Harbourview adverse-event intake/reporting workflow was verified |
| Guideline/evidence update tracking | No Clinical-specific guideline version/change feed verified |
| Contextual education | Education module model exists but is not wired into the mobile Clinical data contract |
| Professional-role adaptation | Selected Command role exists, but role-specific Clinical capability changes are currently prose-only and not backed by explicit profession-rule DTOs |
| Search | Command search does not index Clinical evidence records because no Clinical evidence record source is wired |

### P2 — differentiation after P0/P1 evidence foundations

- Comparative evidence views by condition/population/formulation/route.
- Saved professional evidence watchlists and change alerts.
- Audit-ready evidence packets for clinical committees and pharmacy/medical affairs review.
- Cross-jurisdiction professional-rule comparison with supersession history.
- Trial/guideline/pharmacovigilance signal convergence views.
- Structured export/interoperability only after privacy, consent, data-governance and clinical-validation contracts are defined.

## Before / after information architecture

Before:

`Clinical → Clinical access and education → Patient access long-form prose + Prescriber access long-form prose`

P0 after:

`Clinical → Professional clinical command → Source state → What changed / What requires attention → What can I do next → Authorization & documentation / Safety & interactions / Pharmacovigilance / Professional education → Jurisdiction pathway / Professional pathway → Inspectable primary-source provenance`

Target after the missing P0/P1 contracts exist:

`Clinical → Attention & changes → Condition evidence → Safety/interactions → Cannabinoid/formulation evidence → Authorization/documentation → Monitoring/outcomes → Pharmacovigilance → Guidelines/education → Provenance/change history`

## GO / HOLD criteria

P0 code can be GO only after typecheck, focused Vitest, security/leakage checks and production build pass on the exact branch head. Visual GO additionally requires screenshots at 375×812, 390×844 and 430×932 showing the initial Clinical viewport is compact, readable, does not re-surface legacy ACMPR prose, preserves the one-row domain rail and Command / Market / Intel / Actions bottom navigation, and has no clipping/safe-area defects.

Full “production-grade clinical decision support” remains HOLD until the missing evidence-by-condition, structured interaction, formulation evidence, regulator-source, change-event and reviewed-calculator contracts are implemented and validated. The P0 UI must not claim those capabilities before that evidence exists.
