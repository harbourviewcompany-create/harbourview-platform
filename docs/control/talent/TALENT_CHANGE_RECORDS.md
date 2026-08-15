# Talent Change Records

## TCHG-001 — Current-main organization operating-context reconciliation

- Date: 2026-08-15
- Approval state: PROPOSED
- Proposed exact change: reconcile the frozen Talent employer/organization dependency with the current-main canonical `workspaces` + `workspace_members` model and nullable `user_dashboard_preferences.active_workspace_id` operating context exposed through `/api/org/me`. Talent retains separate hiring-team, recruiter, agency and entitlement authority; organization membership or verification alone does not confer Talent authority.
- Affected TAL IDs: TAL-006, TAL-007, TAL-008, TAL-016, TAL-019, TAL-020, TAL-021, TAL-022, TAL-023, TAL-060, TAL-076, TAL-077, TAL-078, TAL-083, TAL-097, TAL-098, TAL-099, TAL-100.
- Affected TAC IDs: TAC-006, TAC-007, TAC-017, TAC-018, TAC-022, TAC-023, TAC-029, TAC-040, TAC-049, TAC-050.
- Affected controls: CTL-002, CTL-004, CTL-005.
- Reason/evidence: audited base `04e306d520d69d746a5099bf778dc253296710a3` predates the now-canonical multi-organization operating context. Current main at reconciliation is `25a12d221c2b9d137bc8444e8b75d1dd2d41ebf1`. Reusing that model avoids a competing Talent organization identity.
- Alternatives considered: a Talent-specific organization table was rejected because it would create competing canonical organization/membership state; reverting current-main multi-org state was rejected as unrelated and destructive.
- Data/migration/backfill impact: Talent-only employer/source/link extensions reference canonical workspaces. Existing workspace/member data is not rewritten. Talent legacy backfills remain reversible and source-preserving.
- API/DTO/RLS/privacy impact: Find Talent resolves the active workspace using `/api/org/me`, then requires separate Talent authority before retrieval. No RLS relaxation is authorized. Candidate visibility, employer blocks, consent and disclosure remain query-time controls.
- Tests/evidence requiring update: Talent schema contracts, privacy cutover, search-quality, employer-authority and Command context evidence.
- Reversibility/rollback: remove/disable Talent extensions and canonical read switch while leaving canonical workspace/member/active-context data untouched.
- Scope effect: no TAL-001..100 capability is removed, merged, narrowed, deferred or weakened.
- Implementation SHA: pending final reconciliation SHA.

This PROPOSED record does not self-approve any material scope relaxation. None is requested.