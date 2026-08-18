# Clinical Prescriber OS — verification plan

Candidate verification is exact-head and non-production.

Required gates:

1. Reconcile candidate branch with current `main` and confirm zero commits behind.
2. TypeScript typecheck.
3. Focused Clinical tests including Prescriber OS, evidence runtime/storage/operations and existing patient/professional contracts affected by the diff.
4. Canonical Next.js build.
5. Security/leakage and critical environment gates.
6. Migration drift/full replay through `20260818154500_clinical_prescriber_operating_system.sql`; no production application.
7. Validate anon/authenticated/service-role grants and RLS for all added reference and patient-derived tables.
8. Verify weak generic-source evidence/interactions are review-gated and not returned as prescriber-inspectable Ask Clinical material.
9. Mobile Clinical presentation at the repository-required mobile viewports, including 375×812, 390×844 and 430×932 where those existing visual gates apply.
10. Confirm Command remains compact and the full workspace contains Decision, Evidence, Safety, Products, Regimen, Monitoring, Guidelines, Documentation and History without resurrecting the generic mg/kg helper.

Final GO requires green exact-head applicable gates plus inspectable evidence for every material clinical output. Missing source-specific regimen/safety/monitoring content remains an evidence-coverage limitation even if the software gates pass.
