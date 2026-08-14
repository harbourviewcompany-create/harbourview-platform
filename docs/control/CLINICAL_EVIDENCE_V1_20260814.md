# Clinical Evidence V1 — 2026-08-14

## Objective

Extend the verified Clinical P0 evidence spine with a governed, provenance-bearing condition evidence architecture without publishing unsupported clinical synthesis, dosing, interaction, profession-rule, marketplace-product, or genetics claims.

## Canonical V1 model

- `clinical_condition_terms`: controlled, versioned condition vocabulary with aliases, source system/identifier/version, deprecation and supersession fields.
- `clinical_evidence_sources`: private normalized source registry with canonical source key, source type, URL, jurisdiction, DOI/PMID/DIN/NOC identifiers, source version/currentness and optional content hash.
- `clinical_evidence_records`: reviewed public projection; extended with normalized source-registry identity, grading-method identity and publication scope.
- `clinical_condition_evidence_links`: safe published condition-to-evidence relationships.
- `clinical_evidence_extractions`: private extraction provenance and source locator.
- `clinical_evidence_reviews`: private provenance/clinical/methodology review decisions.
- `clinical_evidence_conflicts`: private contradiction workbench.
- `clinical_evidence_grading_methods`: versioned evidence-grading governance.

## Publication governance

All new evidence is ingested as `under-review` and `ungraded` by default.

A transition to `published` requires an approved provenance review. Any `clinical-synthesis` record or any record assigned `high`, `moderate`, `low`, `very-low`, or `conflicted` certainty additionally requires an approved review by a reviewer typed `clinician` or `pharmacist`.

The migration's system provenance review for the first public corpus approves only source fidelity and the narrow regulatory-indication summary. It does not represent a clinician review and cannot authorize graded clinical synthesis.

## Evidence grading

`harbourview-clinical-evidence-v1` version `1.0.0` is GRADE-compatible governance, not an automated GRADE engine. The architecture records the method and blocks automated assignment of clinical certainty. A qualified clinical reviewer must document the assessment before a graded synthesis is publishable.

Regulatory authorization, a product monograph, or a single study is never converted automatically into a clinical efficacy grade.

## First public condition corpus

The first public records are deliberately narrow regulated-drug indication metadata:

1. EPIDIOLEX — Lennox-Gastaut syndrome.
2. EPIDIOLEX — Dravet syndrome.
3. EPIDIOLEX — tuberous sclerosis complex.
4. SATIVEX — multiple sclerosis spasticity.

Every record remains `regulated-cannabinoid-drug`, `product-monograph`, `ungraded`, `source-metadata`. The summaries explicitly avoid independent efficacy conclusions and do not generalize to general cannabis products, marketplace listings, genetics/cultivars, or patient-specific treatment.

## Staged systematic reviews

Two review-level sources are normalized and staged as private `clinical-synthesis` records:

- PubMed PMID 36417631: systematic review/meta-analysis of adjunctive cannabidiol in Lennox-Gastaut syndrome, Dravet syndrome and tuberous sclerosis complex.
- PubMed PMID 39502271: systematic review/meta-analysis of cannabinoids for multiple-sclerosis spasticity.

They remain `under-review` and therefore are excluded by public RLS and deterministic public search until qualified clinical review is recorded.

## Source map

- EPIDIOLEX Canadian product monograph: `https://pp.jazzpharma.com/pi/epidiolex.ca.PM-en.pdf`
- Health Canada Drug Product Database EPIDIOLEX DIN 02543079 / NOC 32096.
- SATIVEX Canadian product monograph: `https://pdf.hres.ca/dpd_pm/00054388.PDF`
- Health Canada Drug Product Database SATIVEX DIN 02266121.
- PubMed PMID 36417631 / DOI 10.1016/j.seizure.2022.10.010.
- PubMed PMID 39502271 / DOI 10.1177/20552173241282379.

## Public/private boundary

Anon/authenticated browser roles may read only published evidence records, published condition terms, safe condition-evidence relationships, public grading-method metadata and published evidence-change events.

The normalized source registry, extraction provenance, review decisions and contradiction workbench are not granted to anon. Authenticated access to those private tables is gated by the existing `user_roles` model to `admin`, `operator`, or `analyst`; service-role access remains server-side.

## Deterministic synthesis boundary

The TypeScript synthesis helper reports only counts, evidence-type composition, regulated-drug/general-cannabis separation, currentness, grading coverage, conflict presence and latest verification time. It explicitly does not infer efficacy or comparative superiority.

## Remaining V1 work

- Qualified clinical review of staged systematic reviews before any graded public synthesis.
- Expanded controlled condition vocabulary from authoritative sources without silently importing licensing-restricted terminology.
- Additional condition evidence and source snapshots/content hashes.
- Reviewer/admin workflow UI for the private governance tables.
- Contradiction-resolution workflow and explicit public conflict-event publishing.
- Medication/cannabinoid interaction data, province×profession rules, monitoring/follow-up and structured pharmacovigilance remain separate future contracts and are not activated by this migration.

## Release boundary

No production migration application, merge, or deployment is part of this change. Production activation requires exact-head migration replay/RLS proof, focused Clinical tests, full CI/build/security/leakage checks, and authenticated mobile verification at 375x812, 390x844 and 430x932.
