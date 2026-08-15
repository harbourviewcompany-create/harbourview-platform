# Talent P0 Runtime Baseline

Runtime branch base: `8b55d891ac14cf744bd23aca52581082896b436f`.
Frozen Talent control-pack head: `5b7990b3c3f7c9e79c72450cddd93473ada8aa73`.
Original audited architecture base: `04e306d520d69d746a5099bf778dc253296710a3`.

Status: implementation pass. No capability may be marked `VERIFIED`; `TALENT_TRACEABILITY_MATRIX.md` is the mandatory evidence contract.

## Drift discovered before runtime edits

Current main is 95 commits ahead of the original architecture base. The material Talent-adjacent drift is additive rather than a scope contradiction:

- `supabase/migrations/20260814122000_p0_identity_org_context.sql` and the current `/api/org/*` routes establish multi-organization membership plus nullable `active_workspace_id`; `workspaces` and `workspace_members` remain canonical organization identity/membership. Talent employer/recruiter authority must therefore extend this model rather than create a competing organization system.
- `app/api/org/me/route.ts`, `components/dashboard/OrganizationContextControl.tsx`, and Command context changes mean Talent search must preserve the selected organization, jurisdiction, role and active Command section.
- Command Talent still reaches `components/dashboard/data/jobsBoard.ts` through `useMobileCommandModel.base.ts` and the legacy `OperationsSections.tsx` Talent renderer. `JOB_LISTINGS` therefore remains an active production dependency to eliminate under TAL-084.
- Public `/talent`, `/talent/[jobId]`, and `/api/talent/apply` still use the legacy `talent_jobs` / `talent_candidates` contracts. They remain compatibility paths under TAL-079/TAL-081.
- `job_search.*` still carries the broad client-read operator boundary from `20260802011926_job_search_operator_boundary_rls.sql`; this is the first runtime security gate under TAL-082.
- `hv_professionals` remains a verified public-professional directory consumed by `/professionals*`, `/api/experts`, professional application/admin flows, dashboard live data and Clinical. TAL-080 must preserve those public semantics while Passport becomes canonical Talent identity.

These discoveries expand implementation dependencies already represented by TAL-006, TAL-019, TAL-022, TAL-039, TAL-079–084. They do not remove, narrow, re-phase or relax any frozen TAL/TAC/CTL control, so no material scope-relaxation amendment is required.

## Gate 1 evidence target

TAL-082 / TAC-032: retain all `job_search` data but remove anonymous/authenticated direct schema access before generalized Talent APIs are introduced. Service-role access remains for controlled compatibility and ingestion work.
