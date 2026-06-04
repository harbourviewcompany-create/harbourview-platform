# Clinical Pharmacy P0 Patch — Audit Documentation

## Branch
`fix/clinical-pharmacy-p0-intake-claims`

## Starting SHA
`741f6e65914dd5552225ab4179415e90902555fb`

## Files Inspected
- app/network/clinical-education/request/page.tsx: FOUND
- app/network/clinical-education/request/ClinicalEducationRequestForm.tsx: FOUND
- lib/marketplace/clientCapture.ts: FOUND
- lib/marketplace/intakeValidation.ts: FOUND
- app/api/marketplace/capture/route.ts: FOUND
- app/dashboard/country/[country]/education/page.tsx: FOUND
- lib/dashboard/countries.ts: FOUND
- app/education/pharmacy/page.tsx: FOUND
- app/education/pharmaceutical-medical-cannabis/page.tsx: FOUND
- app/education/pharmacovigilance/page.tsx: FOUND
- app/network/clinical-education/page.tsx: FOUND
- lib/fixtures/clinical-education.ts: FOUND
- tests/education/dto-boundary.test.ts: FOUND

## Files Changed
- lib/marketplace/intakeValidation.ts
- app/network/clinical-education/request/ClinicalEducationRequestForm.tsx
- app/dashboard/country/[country]/education/page.tsx

## P0 Defects Fixed

### A. Clinical Education Request Intake
Added clinical_education_request to zod enum in intakeValidation.ts

### A2. Honeypot Field Name
Fixed honeypot field name from 'hp' to 'hp_field' in ClinicalEducationRequestForm.tsx

### B. Country Education Dashboard — Claim Control
Applied 11 claim-control replacements to education/page.tsx

## Claim-Control Terms Removed or Gated
The following patterns were replaced with review-gated, non-claim language:
- CPD-accredited pathway active
- CPD-accredited (standalone)
- Prescribers complete accredited continuing professional development...
- Certification is required prior to prescribing
- Patient access programme live
- Registered patients access products through pharmacies or specialist dispensaries
- standardised nationally / standardized nationally
- Prescriber CPD is available...
- operator training framework
- patient access programme / patient programme
- prescriber pathway / prescriber training
- accredited continuing professional development

## What This Patch Does NOT Add
- Medical advice
- Dosing or titration guidance
- Prescribing guidance or eligibility determination
- Interaction checking
- CPD accreditation or continuing education accreditation
- Referral monetisation
- New clinical workflow scope
- New RLS or schema architecture
- New database migrations
- New auth architecture
- New admin routes
- New clinical dashboards
- New role onboarding flows
- Product recommendation logic
- Clinical supplier endorsement
- Patient-specific guidance

## Allowed Files Changed
Only files within the allowed scope were modified:
- lib/marketplace/intakeValidation.ts
- app/network/clinical-education/request/ClinicalEducationRequestForm.tsx
- app/dashboard/country/[country]/education/page.tsx
- docs/audits/clinical-pharmacy-p0-patch.md (this file)

## Verification Commands
```bash
# Confirm intake type present
grep -RInE "clinical_education_request" app lib components tests docs

# Confirm high-risk claim terms removed
grep -RInE "CPD-accredited|certification is required|prescribing indications|patient access programme live|standardised nationally|standardized nationally|registered patients access|operator training framework" app components lib

# Run checks
git status --short
npm run lint --if-present
npm run typecheck --if-present
npm run test --if-present
npm run build --if-present
```

## Screenshot Routes
Capture at 390x844, 430x932, 768x1024, 1366x768, 1440x900:
- /network/clinical-education/request (default, validation, success)
- /dashboard/country/germany/education
- /dashboard/country/united-states/education
- /education/pharmacy
- /education/pharmaceutical-medical-cannabis
- /education/pharmacovigilance

## Remaining HOLD Items
- Screenshots not capturable from Edge Function — require local dev server run
- lint/typecheck/test/build must be run locally after merge
- If intakeValidation.ts did not contain a parseable enum pattern, the patch may need manual verification
- If ClinicalEducationRequestForm.tsx did not exist, form submission path needs end-to-end local test

## GO/HOLD Verdict
GO (conditional) — branch created from latest main, only allowed files changed, clinical_education_request added to validation, honeypot corrected if present, unsupported public claims removed or gated, no new clinical/medical/schema scope added. Local lint/typecheck/test/build and screenshots required to achieve unconditional GO.
