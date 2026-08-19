# First-Wave Clinical Content Pack (P1.1)

**Status:** Ready for clinical reviewer sign-off  
**Hard rule:** No clinical-synthesis record may be marked `published` until the named primary clinical reviewer (D4) is appointed and has approved the record.  
**Scope:** Highest-evidence cannabinoid indications only. No general primary-care claims.

## Wave 1 indications (≤ 12 records)

| Priority | Condition / Topic | Evidence strength target | Jurisdictions | Notes |
|----------|-------------------|---------------------------|---------------|-------|
| 1 | Dravet syndrome – purified CBD adjunctive | high | global, CA, US, GB, AU, BR | Existing fixture is strong base |
| 2 | Lennox-Gastaut syndrome – purified CBD adjunctive | high | global, CA, US, GB, AU, BR | Existing fixture is strong base |
| 3 | MS spasticity – nabiximols-class THC:CBD | moderate | global, CA, GB, EU, AU | Existing fixture |
| 4 | Chemotherapy-induced nausea/vomiting – selected THC agents | moderate | global, US, CA, GB | Existing fixture |
| 5 | Chronic neuropathic pain – cannabinoids (graded) | low–moderate | global, CA, AU, GB, DE, BR | Existing fixture; keep uncertainty explicit |
| 6 | CBD hepatic enzyme elevation / valproate interaction | moderate | global | Safety record |
| 7 | Cannabinoid–drug interaction overview (CYP focus) | moderate | global | Interactions record |
| 8 | Canada federal medical document & authorization pathway | source-metadata | CA | Authority + pathway, not efficacy |
| 9 | Germany medical cannabis access / BfArM context | source-metadata | DE | Pathway only |
| 10 | Australia SAS / Authorised Prescriber pathway | source-metadata | AU | Pathway only |
| 11 | UK CBPM specialist pathway | source-metadata | GB | Pathway only |
| 12 | Common adverse effects & monitoring considerations | moderate | global | Safety overview |

## Required fields for every published clinical-synthesis record

- `evidence_type`, `evidence_strength`, full GRADE domains (or explicit `ungraded` + reason)
- `uncertainty` and `conflict_status`
- `jurisdiction[]` (never empty for synthesis)
- `primary_source` with live URL + publisher + title
- `verified_at`, `review_due_at` (max 12 months for synthesis records)
- `publication_scope = 'clinical-synthesis'`
- `intervention_class` correctly set
- Supersession pointer if replacing an older record

## Authoring rules

1. Prefer pharmaceutical-grade / regulated product evidence over unregulated extracts.
2. Never extrapolate purified-CBD trial results to broad-spectrum or unregulated products without explicit uncertainty language.
3. Every efficacy claim must cite the specific trial / systematic review / regulatory assessment.
4. Safety records must list monitoring actions, not just list adverse events.
5. Pathway records are `source-metadata` only — no efficacy language.

## Review checklist (clinical reviewer)

- [ ] Population matches the evidence base
- [ ] Intervention class and formulation are accurate
- [ ] Certainty grade is justified by the source quality
- [ ] Uncertainty and limitations are complete
- [ ] No jurisdiction bleed (especially no silent Canada fallback)
- [ ] Primary source URL resolves and is current
- [ ] Review-due date set

## Next after Wave 1

- Expand DE/AU/GB with selective condition-level depth only where reviewed sources exist.
- Add structured interaction rows for the highest-frequency CYP and CNS interactions.
- Begin living source-currentness checks against the primary URLs above.
