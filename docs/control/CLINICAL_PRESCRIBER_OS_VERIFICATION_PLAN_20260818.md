# Clinical Prescriber OS — verification plan

Candidate verification is exact-head and non-production.

Required gates:

1. Reconcile candidate branch with current `main` and confirm zero commits behind.
2. TypeScript typecheck, including the preserved legacy patient/professional Clinical contracts consumed outside the new workspace.
3. Focused Clinical Prescriber OS contract/integration tests plus existing evidence runtime/storage/operations and patient/professional regressions affected by the diff.
4. Canonical Next.js production build.
5. Security/leakage, critical environment and release-safety gates.
6. Migration SQL parse/drift/full replay through `20260818162000_clinical_prescriber_pharmacovigilance.sql`; no production application.
7. Validate anon/authenticated/service-role grants and RLS for all added reference and patient-derived tables, including adverse-event ownership immutability, care-team scope and active treatment/data-processing consent.
8. Verify weak generic-source evidence/interactions are review-gated and not returned as prescriber-inspectable Ask Clinical material.
9. Verify professional authority is resolved from the authenticated verified clinician and existing `clinical_jurisdiction_authority`, never from the Command role label.
10. Verify patient readiness is read-only and fails closed unless the selected accessible patient has active core consent and an open encounter.
11. Verify product readiness requires a selected inspectable exact SKU; class/pathway formulary rows alone cannot clear it.
12. Verify pharmacovigilance records remain clinician-authored, do not infer regulatory reporting obligations and never auto-submit externally.
13. Capture exact-head authenticated mobile Clinical evidence at 375×812, 390×844 and 430×932 for both compact Command and open full workspace; assert no horizontal page overflow and preserved Command bottom navigation.
14. Confirm the full workspace contains Decision, Evidence, Safety, Products, Regimen, Monitoring, Guidelines, Documentation and History without resurrecting the generic mg/kg helper or the prior mobile Clinical split.
15. Record final exact candidate SHA, changed files, workflow/run evidence and any unrelated repository debt separately before GO/HOLD.

Final GO requires green exact-head applicable gates plus inspectable evidence for every material clinical output. Missing source-specific regimen/safety/monitoring content remains an evidence-coverage limitation even if the software gates pass. No merge, deployment or production migration is authorized by this plan.
