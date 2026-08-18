# Clinical Prescriber OS — source coverage and open evidence gaps

## Covered architecture

The repository can represent governed evidence, source snapshots/extractions, grading, conflicts/supersession, formulary classes/SKUs, medication interactions, jurisdiction profiles, professional authority, clinical concepts, claim-level PICO/effects, safety rules, product-specific regimens, monitoring protocols, guidelines, patient context, objectives, decision records, change events, patient-impact review and clinician-authored adverse-event/pharmacovigilance records.

The shared Prescriber surface can resolve the authenticated clinician's governed authority, select an existing RLS-visible patient, read active core-consent/open-encounter readiness, select an inspectable exact SKU, retrieve governed evidence/safety/regimen/monitoring/guideline data and record an adverse event after server/database gates pass.

## Prescriber-ready source requirements

A material prescriber-facing claim requires a specific inspectable HTTPS primary source or governed source snapshot/locator, completed review, current/supersession state and applicable jurisdiction/population/product context. A regulator or PubMed homepage does not meet this requirement by itself.

## Known gaps at current candidate

- Several legacy evidence records cite only the PubMed root and therefore require record-level article/publication identifiers and re-review.
- Several medication-interaction rows cite only generic literature landing pages and therefore require exact label, study or authoritative interaction source records.
- Bootstrap ANVISA/TGA SKU rows include curated or authority-list snapshots. They are useful formulary/access context, but any row lacking product-specific inspectable provenance must remain review-gated for prescriber use.
- No regimen protocol is published by this branch. Dose/titration content must come from a product-specific authoritative label/monograph/guideline and professional review; the generic legacy mg/kg helper is not used as a source.
- Contraindication, special-population, monitoring and stopping-rule schema is available but remains empty/review-gated unless record-level authoritative sources are loaded.
- The workspace reads existing patients, core consent and open encounters but intentionally does not auto-create a patient, encounter or consent record. Existing clinical workflows remain authoritative for those writes.
- Professional authority can only become `loaded` where the existing clinician link and effective `clinical_jurisdiction_authority` row support the authenticated professional role. Missing authority fails closed.
- Adverse-event recording does not determine whether a regulator report is legally required and does not submit one. External reporting status/reference remain clinician-authored record fields.
- Patient-specific prescribing readiness remains blocked until a verified patient/open encounter, active required consent, professional prescribing authority, inspectable evidence, selected exact SKU, resolved major safety issues and applicable monitoring context are all present.

These are evidence/content/workflow coverage gaps, not permission to infer missing clinical facts or authority.
