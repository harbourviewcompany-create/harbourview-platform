# Talent Current State

Audited repository base: `04e306d520d69d746a5099bf778dc253296710a3`. Controls: TAL-079–TAL-084, TAL-001, TAL-025, TAL-039, TAL-071, TAL-082.

Verified current paths/contracts include:
- `components/dashboard/mobile-command/sections/OperationsSections.tsx` — imports `JOB_LISTINGS` and renders Talent cards.
- `components/dashboard/mobile-command/useMobileCommandModel.base.ts` — derives `talentRecords` from `JOB_LISTINGS` using country/role context and fallback.
- `components/dashboard/data/jobsBoard.ts` — fixture job universe used by Command Talent.
- `app/talent/page.tsx` — database-backed public job board.
- `app/talent/[jobId]/page.tsx` — public job detail.
- `app/talent/[jobId]/TalentApplyForm.tsx` — existing public application UI (must be reverified at implementation head).
- `app/api/talent/apply/route.ts` — rate limits/honeypot/validation/open-job lookup and direct insert into `talent_candidates`.
- `app/professionals/page.tsx` — verified public professional directory using `hv_professionals`.
- `app/professionals/[slug]/page.tsx`, `/professionals/apply`, `/api/experts` — compatibility consumers requiring re-verification at runtime gate before edit.
- `supabase/migrations/20260722005615_talent_workspace_scoped_rls.sql` — workspace-scoped Talent ATS RLS and public apply.
- `supabase/migrations/20260722010623_talent_jobs_public_redacted_view.sql` — redacted public job view.
- `supabase/migrations/20260729230849_create_job_search_schema.sql` and subsequent `job_search` migrations — separate job-search subsystem.
- `supabase/migrations/20260802011926_job_search_operator_boundary_rls.sql` — current broad client SELECT boundary that must not become generalized Talent security.
- `supabase/functions/job-refresh/index.ts` — current provider refresh with fixed Ottawa/search/fit assumptions; ingestion machinery only, not canonical matching.
- `public.workspaces` / `workspace_members` — canonical organization/member foundation; global roles remain `admin/operator/analyst/viewer`.

Current contradictions to close:
1. Command Talent fixture universe differs from DB-backed `/talent`.
2. `talent_candidates` is application/pipeline participation, not durable person identity.
3. `hv_professionals` is a verified public directory, not a full Talent Passport or job-seeker state.
4. `job_search.*` has useful ingestion/application primitives but operator-specific ownership/security/fit assumptions.
5. public redaction semantics must survive canonical convergence.

No current-state claim may be promoted from 'reverify at implementation head' to verified without repository evidence.