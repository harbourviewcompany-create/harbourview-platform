# clinical_jurisdiction_authority — explicit deferral

**Date:** 2026-08-20  
**Decision:** **Do not seed** capability matrix rows in this pass.

## Why deferred

Table `public.clinical_jurisdiction_authority` gates professional capabilities (`may_recommend`, `may_prescribe`, `may_dispense`, `may_claim_appropriateness`) per jurisdiction + clinical role.

Seeding requires:

1. Verified clinician-role taxonomy aligned with live `clinical_role` values  
2. Jurisdiction-specific legal research  
3. Effective dating and evidence version provenance  
4. Owner + clinical-governance sign-off (false positives are higher risk than `unknown`)

Runtime already **fails closed**: `resolveClinicalProfessionalAuthority` returns `state: 'unknown'` when no row exists.

## When to seed

Only after named reviewer/governance approval of a per-row matrix for tier-1 markets (CA, DE, AU, GB), with source citations.
