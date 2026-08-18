# Clinical Prescriber OS reconciliation — 2026-08-18

Status: draft PR / branch-only reconciliation. No merge, deployment, or production migration application is authorized by this change.

## Reconciliation basis

- Current-main base at implementation start: `7324072436845e15562efdc87ba912047510f584` (descendant of requested `900f2694cbd5b36697dc08e3d15a47314ac9b646`).
- PR #1514 is treated as a source of strong domain contracts, not as a merge candidate.
- Current-main patient/consent/professional-verification/RLS, Evidence V1/V1.1, formulary/SKU, interaction and monitoring contracts remain authoritative where they are newer or more complete.

## Product hierarchy

Command Clinical is a concise decision surface: explicit jurisdiction, professional-authority state, structured Safety/interaction status, formulary coverage and an explicit question entry point.

The dedicated `/dashboard/clinical` workspace owns:

`Decision / Evidence / Safety / Products / Regimen / Monitoring / Guidelines / Documentation / History`.

All Clinical client state is jurisdiction-bound and cleared when jurisdiction changes. Missing/global jurisdiction is unresolved. Brazil, Canada or another country is never silently substituted.

## Retained current-main contracts

- `lib/clinical/types.ts` and the existing patient/encounter/consent domain.
- `20260727162000_clinical_workflows.sql` patient, core-consent, care-team, clinician-verification and jurisdiction-authority controls.
- Clinical Evidence V1/V1.1 review, credential, snapshot, extraction, grading, freshness, publication and operations contracts in repository history.
- Current-main formulary and SKU schema/feed work.
- Current-main `clinical_monitoring_protocols` shape. It is ALTERed/reconciled; PR #1514's incompatible alternate table creation is not retained.
- Existing evidence-state model and evidence search RPC/query layer.

## Selectively retained from PR #1514

- governed concepts/aliases, PICO/effect/claim lineage, structured safety, regimen, guidelines, patient context, therapeutic objectives and longitudinal decision/change-impact records;
- credential-aware professional-authority resolver;
- deterministic Ask Clinical boundary;
- patient readiness jurisdiction/consent check;
- exact SKU linkage;
- pharmacovigilance/adverse-event workflow with consent/care-team RLS.

The stale all-in-one Command Clinical architecture, BR fallback, alternate monitoring-table creation and generic Clinical object-bag DTOs are not retained.

## Live production read-only audit — 2026-08-18

This audit queried production read-only. No production row, schema object or migration ledger entry was changed.

### Live evidence records

Published evidence records: **14 total**.

- **3 / 14** have direct page-specific government/legal source URLs and remain individually inspectable at the record level:
  - Health Canada adverse-reaction reporting for health-care professionals;
  - Cannabis Regulations §273 on Justice Laws;
  - Health Canada information for health-care practitioners.
- **11 / 14** do **not** meet the prescriber-inspectable source contract:
  - **10** use the generic PubMed root `https://pubmed.ncbi.nlm.nih.gov/`;
  - **1** Dravet/Lennox-Gastaut record uses the ANVISA homepage rather than the specific primary trial/regulatory source.

Production currently has no claim-level Clinical Evidence V1/V1.1 governance columns/tables capable of proving exact claim provenance for the graded/synthesis records, so the 11 non-inspectable rows are remediation candidates and must not remain prescriber-facing after the governance layer is reconciled.

### Live medication interactions

Published interaction records: **5 total**.

- **0 / 5** meet the new prescriber-inspectable interaction provenance contract.
- **5 / 5** use the generic PubMed root and have no exact source locator in the current production schema.

They are preserved by the prepared data repair but staged under review until a record-specific source URL and locator are reviewed.

### Live governance/schema gap

Production has the original `clinical_evidence_records` spine but is missing the later repository governance foundation required by the Prescriber OS:

- `clinical_evidence_records.publication_scope` — missing;
- `clinical_evidence_records.freshness_status` — missing;
- `clinical_evidence_reviews` — missing;
- `clinical_reviewer_credentials` — missing;
- `clinical_evidence_source_snapshots` — missing.

The production migration ledger contains `20260814121500 clinical_evidence_spine`, then later Clinical data/schema versions, but does not contain the repository's intervening Evidence V1/V1.1 governance migrations. It also contains remote-only `20260818210936 clinical_monitoring_protocols`, which the current Migration Drift workflow reports as remote migration drift against the repository ledger.

This is a hard production-application prerequisite, not a reason to weaken the governance model.

## Repository-seeded audit

These counts describe the complete current-main seed/migration history, including Clinical rows not yet present in live production.

### Evidence

- original direct/page-specific source-metadata records: **3**;
- later published evidence rows requiring remediation: **20**:
  - `20260818120000_clinical_formulary_and_evidence_seed.sql`: 4;
  - `20260818130000_clinical_evidence_formulary_expand.sql`: 4;
  - `20260818140000_clinical_interactions_sku_depth.sql`: 3;
  - `20260818192000_clinical_graded_evidence_interactions_depth.sql`: 9.

### Interactions

Published seeded interaction rows requiring remediation: **20**:

- `20260818140000_clinical_interactions_sku_depth.sql`: 5;
- `20260818192000_clinical_graded_evidence_interactions_depth.sql`: 15.

### Monitoring

Current-main monitoring seed rows requiring remediation: **10 / 10**. Generic PubMed root / generic Drugs@FDA portal references do not qualify as prescriber-inspectable sources.

### Fixtures

Fixtures are not a production evidence source. Production interaction queries no longer fall back to fixtures on DB error or empty data. Fixture use requires non-production runtime plus `HARBOURVIEW_CLINICAL_FIXTURES=1`; generic-source fixture rows also fail the inspectable-source filter.

## Required migration/data-repair sequence — prepared only

Production must **not** jump directly to the new Prescriber OS migrations. Required sequence is:

1. reconcile the live migration ledger, including remote-only `20260818210936 clinical_monitoring_protocols`, against current-main migration history;
2. reconcile/apply the missing current-main Evidence V1/V1.1 governance foundation in its historical order, including `20260814134500_clinical_evidence_v1_governance.sql`, `20260814135500_clinical_evidence_v1_source_reconciliation.sql`, `20260814143500_clinical_evidence_v1_production_foundation.sql` and `20260814150000_clinical_evidence_v1_1_operations.sql`;
3. prove the live schema now contains review/credential/snapshot/grade/freshness/publication controls and preserves all existing production rows;
4. only then run `20260818212800_clinical_prescriber_governance_preflight.sql` — it is mutation-free and fails closed if those prerequisites are absent;
5. `20260818212900_clinical_interaction_published_uniqueness.sql`;
6. `20260818213000_clinical_prescriber_os_reconciliation.sql`;
7. `20260818213100_clinical_provenance_remediation_audit.sql`;
8. `20260818213200_clinical_prescriber_sku_links.sql`;
9. `20260818213300_clinical_prescriber_pharmacovigilance.sql`.

The remediation migration preserves records and stages unsafe published projections under review; it does not invent source URLs or clinical claims. Clinical-synthesis/graded publication requires a current claim-level inspectable URL + exact `source_locator` and the existing credential-bound clinician/pharmacist review.

The remediation-audit migration records the actual post-migration withheld/remaining-invalid counts to the private Clinical operations event log only when an operator later applies the migration set.

## Verification evidence required

- zero-state migration replay through the full current-main + reconciliation migration set;
- production-shaped replay that reproduces the live missing-governance/remote-monitoring state, proves the preflight fails before governance reconciliation and passes only after the governance layer is restored;
- TypeScript type check;
- Clinical unit/integration tests covering explicit query, jurisdiction switch, provenance, publication gating, interaction fixture fail-closed behavior, patient/consent/professional authority and duplicate normalized interaction pairs;
- RLS/security/public-leakage checks;
- Next.js production build;
- mobile evidence at 320×568, 375×812, 390×844, 393×852 and 430×932 covering unresolved jurisdiction, concise Command decision surface, full Clinical workspace, no-result/review-required/permission/error states, jurisdiction switch and bottom-safe-area behavior.

Release remains **HOLD** until the migration-ledger/governance gap is reconciled and all exact-head verification evidence is green. No production change is authorized by this document or PR.
