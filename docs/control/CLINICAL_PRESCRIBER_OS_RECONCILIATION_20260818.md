# Clinical Prescriber OS reconciliation — 2026-08-18

Status: branch-only reconciliation. No merge, deployment, or production migration application is authorized by this change.

## Reconciliation basis

- Current-main base at implementation start: `7324072436845e15562efdc87ba912047510f584` (descendant of requested `900f2694cbd5b36697dc08e3d15a47314ac9b646`).
- PR #1514 was treated as a source of domain contracts, not as a merge candidate.
- Current-main Evidence V1/V1.1 governance, formulary/SKU work, interaction work, monitoring table, patient/consent/professional verification and RLS remain authoritative where they are newer or more complete.

## Product hierarchy

Command Clinical is a concise decision surface. It shows explicit jurisdiction, professional-authority state, structured Safety/interaction status, formulary coverage and an explicit question entry point. It does not host the full Prescriber OS.

The dedicated `/dashboard/clinical` workspace owns:

`Decision / Evidence / Safety / Products / Regimen / Monitoring / Guidelines / Documentation / History`.

All Clinical client surfaces clear jurisdiction-bound state when jurisdiction changes. A missing/global jurisdiction is unresolved; Brazil, Canada, or another country is never silently substituted.

## Retained current-main contracts

- `lib/clinical/types.ts` and the existing patient/encounter/consent domain.
- `20260727162000_clinical_workflows.sql` patient, core-consent, care-team, clinician-verification and jurisdiction-authority controls.
- Clinical Evidence V1/V1.1 review, credential, snapshot, extraction, grading, freshness, publication and operations controls.
- Current-main formulary and SKU schema/feed work.
- Current-main `clinical_monitoring_protocols` table. It is ALTERed/reconciled; PR #1514's incompatible replacement shape is not created.
- Existing evidence-state model and evidence search RPC/query layer.

## Selectively retained from PR #1514

- Prescriber OS domain concepts: governed concepts/aliases, PICO/effect/claim lineage, structured safety, regimen, guidelines, patient context, therapeutic objectives, longitudinal decision/change-impact records.
- Credential-aware professional-authority resolver.
- Deterministic Ask Clinical boundary.
- Patient readiness jurisdiction/consent check.
- Exact SKU linkage model.
- Pharmacovigilance/adverse-event workflow and its consent/care-team RLS.

The PR's stale all-in-one Command Clinical architecture, BR fallback, alternate monitoring-table creation and generic object-bag DTOs are not retained.

## Repository-seeded provenance audit

These are static repository-seed counts, not a claim about the live production database.

### Published evidence records

Known exact/page-specific source-metadata rows retained: **3** in the original evidence spine.

Published later evidence rows requiring remediation because their source is a generic PubMed landing page, regulator homepage/search portal, or equivalent non-inspectable source: **20**.

- `20260818120000_clinical_formulary_and_evidence_seed.sql`: 4
- `20260818130000_clinical_evidence_formulary_expand.sql`: 4
- `20260818140000_clinical_interactions_sku_depth.sql`: 3
- `20260818192000_clinical_graded_evidence_interactions_depth.sql`: 9

The reconciliation migration preserves those rows but stages them `under-review`; it does not invent replacement URLs. Clinical-synthesis/graded publication additionally requires current claim-level provenance with an inspectable URL and exact `source_locator` plus the existing credential-bound clinical review.

### Published medication interactions

Published seeded interaction rows requiring provenance remediation: **20**.

- `20260818140000_clinical_interactions_sku_depth.sql`: 5
- `20260818192000_clinical_graded_evidence_interactions_depth.sql`: 15

All are retained but removed from the published projection until an inspectable source URL and exact source locator are reviewed. Duplicate normalized medication/cannabinoid pairs are preserved historically while only one normalized pair may be published.

### Published monitoring rows

Current-main monitoring seed rows requiring provenance remediation: **10 / 10**. Their PubMed root / generic Drugs@FDA portal references are not adequate for prescriber inspection. Rows are retained but staged under review until exact source locators exist.

### Fixtures

Clinical fixtures are not a production evidence source. Production interaction queries no longer fall back to fixtures on DB error or empty data. Fixture use requires non-production runtime plus `HARBOURVIEW_CLINICAL_FIXTURES=1`; current generic-source fixture interaction rows also fail the inspectable-source filter.

## Migration order prepared, not applied

1. `20260818212900_clinical_interaction_published_uniqueness.sql`
2. `20260818213000_clinical_prescriber_os_reconciliation.sql`
3. `20260818213100_clinical_provenance_remediation_audit.sql`
4. `20260818213200_clinical_prescriber_sku_links.sql`
5. `20260818213300_clinical_prescriber_pharmacovigilance.sql`

The remediation-audit migration writes the actual post-migration withheld/remaining-invalid counts to the private Clinical operations event log when and only when an operator later applies the migration set. This branch does not supply or infer live-production counts.

## Release evidence required

- zero-state migration replay through the new migration set;
- TypeScript type check;
- Clinical unit/integration tests including explicit-query, jurisdiction-switch, provenance and fixture-fail-closed regression;
- RLS/security/leakage checks;
- Next.js production build;
- mobile evidence at 320×568, 375×812, 390×844, 393×852 and 430×932 for unresolved jurisdiction, Command decision surface, each full-workspace tab family, no-result/review-required/permission/error, jurisdiction switch and bottom-safe-area behaviour.

Final release GO requires all exact-head evidence above. Until then, branch implementation is reviewable but release remains HOLD.
