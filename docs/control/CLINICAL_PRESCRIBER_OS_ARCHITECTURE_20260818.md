# Clinical Prescriber Operating System — architecture

## Surfaces

Command Clinical is the compact decision surface. It reports governed evidence/product/safety/change readiness and opens the full Clinical Workspace. The full workspace uses Decision, Evidence, Safety, Products, Regimen, Monitoring, Guidelines, Documentation and History.

## Existing contracts preserved

The Prescriber OS extends the existing `clinical_patients`, `clinical_care_team`, `clinical_consent_records`, `clinical_encounters`, professional verification/link, jurisdiction authority, calculation-history, recommendation, prescription/dispensing, clinical audit, evidence governance, formulary, interaction, education and release-gate contracts. Patient-derived Prescriber OS data reuses verified-clinician access, care-team/creator scope and treatment/data-processing consent.

## New governed model

- `clinical_concepts` / `clinical_concept_aliases`: canonical condition, symptom, population, intervention, product, medicine and outcome resolution.
- `clinical_evidence_claims`: claim-level PICO, effect estimates, certainty, applicability, source locator, publication-family and independence-group lineage.
- `clinical_safety_rules`: contraindication, precaution, special-population and interaction rules.
- `clinical_regimen_protocols`: source-versioned product/indication/population/jurisdiction regimen, titration, monitoring and stopping-rule contracts. Generic calculator output is not a regimen source.
- `clinical_monitoring_protocols`: baseline requirements, therapeutic objectives, efficacy/safety measures, labs, reassessment and stop criteria.
- `clinical_guideline_recommendations`: jurisdiction/authority recommendations independently versioned from evidence claims.
- `clinical_patient_contexts` / `clinical_therapeutic_objectives` / `clinical_decision_records`: longitudinal clinician-authored patient workflow.
- `clinical_change_events` / `clinical_patient_impact_reviews`: governed material changes and clinician review queues without autonomous treatment modification.
- `/api/clinical/ask`: deterministic retrieval over the existing evidence spine; material outputs require published/current clinical-synthesis records and inspectable record-level sources.

## Source boundary

Generic PubMed search roots, generic regulator homepages and class/pathway snapshots can support discovery or operational context but cannot satisfy the prescriber-inspectable source contract for a material clinical claim, exact product or regimen. Weak pre-existing evidence/interaction rows are preserved and moved back to review rather than deleted.

## Production boundary

No migration in this branch is self-applying. No production deployment, migration application or merge is authorized by this architecture document.
