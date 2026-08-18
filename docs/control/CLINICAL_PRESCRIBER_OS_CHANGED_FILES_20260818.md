# Clinical Prescriber OS — candidate changed files

Candidate-owned files relative to the current reconciled `main` are:

## Clinical application and APIs

- `app/api/clinical/adverse-events/route.ts`
- `app/api/clinical/ask/route.ts`
- `app/api/clinical/authority/route.ts`
- `app/api/clinical/patients/[id]/readiness/route.ts`
- `app/api/clinical/workspace/route.ts`
- `components/dashboard/mobile-command/sections/ClinicalSection.tsx`
- `components/dashboard/pages/ClinicalEvidenceCommandPage.tsx`
- `lib/clinical/formulary.ts`
- `lib/clinical/prescriber.ts`
- `lib/clinical/types.ts`
- `lib/server/clinicalPrescriberWorkspaceQuery.ts`
- `lib/server/clinicalProfessionalAuthority.ts`

## Database

- `supabase/migrations/20260818154500_clinical_prescriber_operating_system.sql`
- `supabase/migrations/20260818161500_clinical_prescriber_sku_links.sql`
- `supabase/migrations/20260818162000_clinical_prescriber_pharmacovigilance.sql`

## Verification

- `.github/workflows/clinical-prescriber-os-visual.yml`
- `tests/clinical/prescriberOSContracts.test.ts`
- `tests/clinical/prescriberOSIntegration.test.ts`
- `tests/e2e/clinical-prescriber-os-visual.spec.ts`

## Control documentation

- `docs/control/CLINICAL_PRESCRIBER_OS_ARCHITECTURE_20260818.md`
- `docs/control/CLINICAL_PRESCRIBER_OS_CHANGED_FILES_20260818.md`
- `docs/control/CLINICAL_PRESCRIBER_OS_RECONCILIATION_20260818.md`
- `docs/control/CLINICAL_PRESCRIBER_OS_SOURCE_GAPS_20260818.md`
- `docs/control/CLINICAL_PRESCRIBER_OS_VERIFICATION_PLAN_20260818.md`

## Verification-only upstream unblocker

- `lib/google/driveClient.ts` — local type-only compatibility bridge required because current repository typecheck otherwise fails on duplicated Google auth-client type instances. Runtime authentication behavior is unchanged.

Current-main Clinical SKU/feed/jurisdiction/admin-audit infrastructure and the hardened legacy `ClinicalEvidenceExplorer` are inherited through merge reconciliation. They remain in the branch tree but are not listed above as Prescriber OS-owned replacements unless the compare against current `main` shows a candidate-specific diff.
