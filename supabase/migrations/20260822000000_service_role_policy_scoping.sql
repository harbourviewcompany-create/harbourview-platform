-- Performance fix: convert "service role" policies scoped TO public with an
-- internal auth.role()='service_role' check into policies scoped TO
-- service_role directly. Functionally identical -- Supabase's connection
-- pooler does `SET ROLE` to match the JWT's role claim before RLS ever
-- evaluates, so a policy's `TO service_role` and its `auth.role() =
-- 'service_role'` check are kept in sync by the platform, not something
-- this migration is introducing. Confirmed live afterward: 0 policies with
-- the old (roles={public}, qual=auth.role()='service_role') pattern remain.
--
-- This is what was driving the bulk of the multiple_permissive_policies
-- advisory: scoping TO public meant Postgres had to evaluate this policy
-- (and reject it) for every anon/authenticated row too, on top of whatever
-- policy actually grants their access. TO service_role lets Postgres skip
-- the policy entirely for roles it doesn't apply to.

ALTER POLICY "service role full access" ON job_search.applications TO service_role USING (true);
ALTER POLICY "service role full access" ON job_search.companies TO service_role USING (true);
ALTER POLICY "service role full access" ON job_search.contacts TO service_role USING (true);
ALTER POLICY "service role full access" ON job_search.jobs TO service_role USING (true);
-- Zero-state replay: job_search.opportunities exists only in production; no
-- repository migration creates it (20260729230849 creates the job_search schema
-- and its eight tables, and this is not one of them). Re-scoping a policy on an
-- absent table is a no-op, so guarding on existence cannot change access: there
-- is no table to expose. Against production, where the table and policy both
-- exist, the ALTER runs exactly as before.
do $replay_job_search_opportunities$
begin
  if to_regclass('job_search.opportunities') is not null then
    execute 'ALTER POLICY "service role full access" ON job_search.opportunities TO service_role USING (true)';
  end if;
end
$replay_job_search_opportunities$;
ALTER POLICY "service role full access" ON job_search.outreach_messages TO service_role USING (true);
ALTER POLICY "service role full access" ON job_search.prospects TO service_role USING (true);
ALTER POLICY "service role full access" ON job_search.resume_versions TO service_role USING (true);
ALTER POLICY "service role full access" ON job_search.settings TO service_role USING (true);
ALTER POLICY "service role full access" ON job_search.settings_legacy_single_row TO service_role USING (true);
ALTER POLICY clinical_adverse_events_service ON public.clinical_adverse_events TO service_role USING (true);
ALTER POLICY clinical_audit_log_service_all ON public.clinical_audit_log TO service_role USING (true);
ALTER POLICY clinical_calculations_service ON public.clinical_calculations TO service_role USING (true);
ALTER POLICY clinical_care_team_service ON public.clinical_care_team TO service_role USING (true);
ALTER POLICY clinical_clinician_links_service_write ON public.clinical_clinician_links TO service_role USING (true);
ALTER POLICY clinical_consent_service ON public.clinical_consent_records TO service_role USING (true);
ALTER POLICY clinical_dispensing_service ON public.clinical_dispensing_events TO service_role USING (true);
ALTER POLICY clinical_encounters_service ON public.clinical_encounters TO service_role USING (true);
ALTER POLICY clinical_jurisdiction_authority_service ON public.clinical_jurisdiction_authority TO service_role USING (true);
ALTER POLICY clinical_patients_service ON public.clinical_patients TO service_role USING (true);
ALTER POLICY clinical_prescriptions_service ON public.clinical_prescriptions TO service_role USING (true);
ALTER POLICY clinical_recommendations_service ON public.clinical_recommendations TO service_role USING (true);
-- Zero-state replay: country_intel_backup_20260630 is a one-off dated backup
-- table (20260821000000's own header calls it out as such) created out of band in
-- production; no repository migration creates it. Same reasoning as above -- a
-- policy re-scope on an absent table is a no-op and cannot widen access.
do $replay_country_intel_backup$
begin
  if to_regclass('public.country_intel_backup_20260630') is not null then
    execute 'ALTER POLICY service_role_only ON public.country_intel_backup_20260630 TO service_role USING (true)';
  end if;
end
$replay_country_intel_backup$;
ALTER POLICY deal_capital_raises_service_write ON public.deal_capital_raises TO service_role USING (true);
ALTER POLICY deal_investors_service_write ON public.deal_investors TO service_role USING (true);
ALTER POLICY deal_ma_transactions_service_write ON public.deal_ma_transactions TO service_role USING (true);
ALTER POLICY deal_participants_service_write ON public.deal_participants TO service_role USING (true);
ALTER POLICY service_write_deal_room_messages ON public.deal_room_messages TO service_role USING (true);
ALTER POLICY service_write_deal_rooms ON public.deal_rooms TO service_role USING (true);
ALTER POLICY education_content_citations_service_write ON public.education_content_citations TO service_role USING (true);
ALTER POLICY service_write_professionals ON public.hv_professionals TO service_role USING (true);
ALTER POLICY hv_public_feed_service_write ON public.hv_public_feed TO service_role USING (true);
ALTER POLICY service_write_playbooks ON public.jurisdiction_playbooks TO service_role USING (true);
ALTER POLICY opportunities_service_write ON public.opportunities TO service_role USING (true);
ALTER POLICY service_role_only ON public.scraper_source_state TO service_role USING (true);
ALTER POLICY "Service role manages webhook events" ON public.stripe_webhook_events TO service_role USING (true);
ALTER POLICY prefs_service_write ON public.user_dashboard_preferences TO service_role USING (true);
