# Clinical Prescriber OS — source coverage and open evidence gaps

## Covered architecture

The repository can represent governed evidence, source snapshots/extractions, grading, conflicts/supersession, formulary classes/SKUs, medication interactions, jurisdiction profiles, clinical concepts, claim-level PICO/effects, safety rules, product-specific regimens, monitoring protocols, guidelines, patient context, objectives, decision records, change events and patient-impact review.

## Prescriber-ready source requirements

A material prescriber-facing claim requires a specific inspectable HTTPS primary source or governed source snapshot/locator, completed review, current/supersession state and applicable jurisdiction/population/product context. A regulator or PubMed homepage does not meet this requirement by itself.

## Known gaps at branch creation

- Several legacy evidence records cite only the PubMed root and therefore require record-level article/publication identifiers and re-review.
- Several medication-interaction rows cite only generic literature landing pages and therefore require exact label, study or authoritative interaction source records.
- Bootstrap ANVISA/TGA SKU rows are pathway/class snapshots with generic authority-homepage sources; they are useful discovery/access context but are not exact prescriber-ready SKUs until a registration/product record and inspectable source are resolved.
- No regimen protocol is published by this branch. Dose/titration content must come from a product-specific authoritative label/monograph/guideline and professional review; the generic legacy mg/kg helper is not used as a source.
- Contraindication, special-population, monitoring and stopping-rule schema is available but remains empty/review-gated unless record-level authoritative sources are loaded.
- Patient-specific readiness remains blocked until a verified patient/encounter, active required consent, professional authority, product, safety and monitoring context are resolved.

These are evidence/content gaps, not permission to infer missing clinical facts.
