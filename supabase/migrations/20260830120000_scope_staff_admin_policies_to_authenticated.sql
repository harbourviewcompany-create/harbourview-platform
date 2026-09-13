-- Scope 42 staff/admin-only RLS policies from `public` to `authenticated`
--
-- These policies all gate access behind one of four helper functions:
-- hv_is_platform_staff(), is_genetics_admin_or_reviewer(), is_hv_staff(),
-- hv_is_org_member() -- each confirmed (by reading pg_get_functiondef) to
-- do a pure auth.uid() lookup against a role/membership table, with no
-- bypass for service_role or any other caller. That means:
--   - A service_role caller (auth.uid() IS NULL) was already being denied
--     by the function itself under the old `public` scope -- Postgres
--     still had to evaluate the policy on every access attempt from every
--     role, including ones that could never pass it.
--   - Narrowing to `authenticated` cannot change the outcome for any
--     currently-working caller: nothing was ever passing these checks via
--     a public/service_role path in the first place. It only lets Postgres
--     skip evaluating the policy for roles that were always going to fail
--     it (anon, service_role).
--
-- This mirrors the same pattern and reasoning already applied and merged
-- for the `service_role` and `auth.uid()`-literal policy sets (see
-- 20260822000000_service_role_policy_scoping.sql and
-- 20260822010000_scope_anon_unsatisfiable_policies.sql). This file covers
-- the remaining category: policies that check auth.uid() indirectly,
-- through a wrapper function, which the text-matching migration above
-- did not catch since it only matched literal "auth.uid()" in the policy
-- text.
--
-- Applied and verified live in production before this file was written:
-- confirmed via pg_policies that all 42 rows below were previously
-- roles={public} and are now roles={authenticated}, and confirmed zero
-- remain matching the old pattern. This file exists to bring migration
-- history in line with what's already running -- not new work.

ALTER POLICY "crawl_domain_circuit_state_staff_read" ON public.crawl_domain_circuit_state TO authenticated;
ALTER POLICY "genetics_audit_events_admin_insert" ON public.genetics_audit_events TO authenticated;
ALTER POLICY "genetics_audit_events_admin_read" ON public.genetics_audit_events TO authenticated;
ALTER POLICY "genetics_claim_reviews_delete" ON public.genetics_claim_reviews TO authenticated;
ALTER POLICY "genetics_claim_reviews_insert" ON public.genetics_claim_reviews TO authenticated;
ALTER POLICY "genetics_claim_reviews_select" ON public.genetics_claim_reviews TO authenticated;
ALTER POLICY "genetics_claim_reviews_update" ON public.genetics_claim_reviews TO authenticated;
ALTER POLICY "genetics_claims_select" ON public.genetics_claims TO authenticated;
ALTER POLICY "genetics_project_members_delete" ON public.genetics_project_members TO authenticated;
ALTER POLICY "genetics_project_members_insert" ON public.genetics_project_members TO authenticated;
ALTER POLICY "genetics_project_members_update" ON public.genetics_project_members TO authenticated;
ALTER POLICY "hv_arq_staff_all" ON public.hv_admin_review_queue TO authenticated;
ALTER POLICY "hv_claim_reviews_delete" ON public.hv_claim_reviews TO authenticated;
ALTER POLICY "hv_claim_reviews_insert" ON public.hv_claim_reviews TO authenticated;
ALTER POLICY "hv_claim_reviews_select" ON public.hv_claim_reviews TO authenticated;
ALTER POLICY "hv_claim_reviews_update" ON public.hv_claim_reviews TO authenticated;
ALTER POLICY "hv_claims_delete" ON public.hv_claims TO authenticated;
ALTER POLICY "hv_claims_insert" ON public.hv_claims TO authenticated;
ALTER POLICY "hv_claims_select" ON public.hv_claims TO authenticated;
ALTER POLICY "hv_claims_update" ON public.hv_claims TO authenticated;
ALTER POLICY "hv_evidence_delete" ON public.hv_evidence_documents TO authenticated;
ALTER POLICY "hv_evidence_insert" ON public.hv_evidence_documents TO authenticated;
ALTER POLICY "hv_evidence_select" ON public.hv_evidence_documents TO authenticated;
ALTER POLICY "hv_evidence_update" ON public.hv_evidence_documents TO authenticated;
ALTER POLICY "hv_facilities_delete" ON public.hv_facilities TO authenticated;
ALTER POLICY "hv_facilities_insert" ON public.hv_facilities TO authenticated;
ALTER POLICY "hv_facilities_select" ON public.hv_facilities TO authenticated;
ALTER POLICY "hv_facilities_update" ON public.hv_facilities TO authenticated;
ALTER POLICY "hv_licences_delete" ON public.hv_licences TO authenticated;
ALTER POLICY "hv_licences_insert" ON public.hv_licences TO authenticated;
ALTER POLICY "hv_licences_select" ON public.hv_licences TO authenticated;
ALTER POLICY "hv_licences_update" ON public.hv_licences TO authenticated;
ALTER POLICY "hv_passport_scores_delete" ON public.hv_passport_scores TO authenticated;
ALTER POLICY "hv_passport_scores_insert" ON public.hv_passport_scores TO authenticated;
ALTER POLICY "hv_passport_scores_select" ON public.hv_passport_scores TO authenticated;
ALTER POLICY "hv_passport_scores_update" ON public.hv_passport_scores TO authenticated;
ALTER POLICY "hv_passports_delete" ON public.hv_passports TO authenticated;
ALTER POLICY "hv_passports_insert" ON public.hv_passports TO authenticated;
ALTER POLICY "hv_passports_select" ON public.hv_passports TO authenticated;
ALTER POLICY "hv_passports_update" ON public.hv_passports TO authenticated;
ALTER POLICY "worker_heartbeats_staff_read" ON public.worker_heartbeats TO authenticated;
ALTER POLICY "workspaces_select" ON public.workspaces TO authenticated;
