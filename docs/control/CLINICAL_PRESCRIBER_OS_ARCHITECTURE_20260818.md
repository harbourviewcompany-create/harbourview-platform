# Clinical Prescriber Operating System — architecture

## Surfaces

Command Clinical is the compact decision surface. It reports governed evidence, safety, exact-product, jurisdiction and professional-authority readiness and opens the full Clinical Workspace. The full workspace uses Decision, Evidence, Safety, Products, Regimen, Monitoring, Guidelines, Documentation and History. Desktop and mobile render the same `ClinicalEvidenceCommandPage`; the older mobile Evidence Explorer remains in the repository only as inherited compatibility code and is not the active Clinical section.

## Existing contracts preserved

The Prescriber OS extends the existing `clinical_patients`, `clinical_care_team`, `clinical_consent_records`, `clinical_encounters`, professional verification/link, jurisdiction authority, calculation-history, recommendation, prescription/dispensing, clinical audit, evidence governance, formulary, interaction, education and release-gate contracts. Patient-derived Prescriber OS data reuses verified-clinician access, care-team/creator scope and treatment/data-processing consent. Existing recommendation and prescription APIs remain authoritative write paths.

## New governed model

- `clinical_concepts` / `clinical_concept_aliases`: canonical condition, symptom, population, intervention, product, medicine and outcome resolution.
- `clinical_evidence_claims`: claim-level PICO, effect estimates, certainty, applicability, source locator, publication-family and independence-group lineage.
- `clinical_safety_rules`: contraindication, precaution, special-population and interaction rules.
- `clinical_regimen_protocols`: source-versioned product/indication/population/jurisdiction regimen, titration, monitoring and stopping-rule contracts. Generic calculator output is not a regimen source.
- `clinical_monitoring_protocols`: baseline requirements, therapeutic objectives, efficacy/safety measures, labs, reassessment and stop criteria.
- `clinical_guideline_recommendations`: jurisdiction/authority recommendations independently versioned from evidence claims.
- `clinical_patient_contexts` / `clinical_therapeutic_objectives` / `clinical_decision_records`: longitudinal clinician-authored patient workflow.
- `clinical_change_events` / `clinical_patient_impact_reviews`: governed material changes and clinician review queues without autonomous treatment modification.
- `clinical_adverse_events`: restricted clinician-authored adverse-event/pharmacovigilance records. The platform records clinician assessment and external-report status but does not infer reporting obligations or submit to regulators.
- `/api/clinical/ask`: deterministic retrieval over the existing evidence spine; material outputs require published/current clinical-synthesis records and inspectable record-level sources.
- `/api/clinical/authority`: read-only verified-clinician authority resolution using the existing `clinical_jurisdiction_authority` effective-window/capability model.
- `/api/clinical/patients/[id]/readiness`: read-only accessible-patient, core-consent and open-encounter state.
- `/api/clinical/workspace`: published/current safety, regimen, monitoring and guideline reference data under existing RLS.

## Decision readiness

The prescriber-facing readiness check fails closed. A patient-specific prescribing context cannot clear unless the workspace has an accessible selected patient, an open encounter, active treatment and data-processing consent, current professional authority permitting prescribing in the jurisdiction, inspectable evidence, a selected inspectable exact SKU, no unresolved major/contraindicated safety items and an applicable monitoring protocol. The generic Command role label is never treated as professional authority.

Formulary class/pathway records remain useful context but do not clear exact-product readiness. Product-specific regimen and monitoring rows can link to the inherited `clinical_formulary_skus` layer without collapsing SKU, class/pathway and evidence concepts.

## Source boundary

Generic PubMed search roots, generic regulator homepages and class/pathway snapshots can support discovery or operational context but cannot satisfy the prescriber-inspectable source contract for a material clinical claim, exact product or regimen. Weak pre-existing evidence/interaction rows are preserved and moved back to review rather than deleted.

## Patient and pharmacovigilance boundary

Patient names/context are loaded only through verified-clinician authenticated APIs and existing RLS. The Prescriber surface does not auto-create patients, encounters or consent. Adverse-event writes require verified clinician access, care-team/creator scope and active core consent; patient/reporter/professional/jurisdiction ownership fields are immutable after creation. Recording an event does not constitute external regulatory reporting.

## Production boundary

No migration in this branch is self-applying. No production deployment, migration application or merge is authorized by this architecture document.
