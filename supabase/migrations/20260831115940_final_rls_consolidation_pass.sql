-- Reconstructed from production. Verbatim statements for version 20260831115940.
begin;

-- signals: admin_all is a strict subset of every other role-based policy on this table (dead weight).
-- signals_select_admin_operator_only reappeared (concurrent session) and is a subset of analyst_select -- redundant again.
drop policy if exists admin_all on public.signals;
drop policy if exists signals_select_admin_operator_only on public.signals;
drop policy if exists signals_admin_operator_analyst_select on public.signals;
drop policy if exists signals_public_select on public.signals;
create policy signals_select on public.signals for select to anon, authenticated
  using (
    score >= 60
    or reviewed = true
    or exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = any (array['admin','operator','analyst']))
  );

-- clinical_evidence_claims
drop policy if exists clinical_evidence_claims_review_access on public.clinical_evidence_claims;
drop policy if exists clinical_evidence_claims_verified_read on public.clinical_evidence_claims;
create policy clinical_evidence_claims_select on public.clinical_evidence_claims for select to authenticated
  using (
    clinical_evidence_has_review_role()
    or (
      is_verified_clinician() and status = 'current'
      and clinical_source_is_prescriber_inspectable(primary_source_url)
      and exists (select 1 from clinical_evidence_records e where e.id = clinical_evidence_claims.evidence_record_id and e.review_status = 'published')
    )
  );
create policy clinical_evidence_claims_insert on public.clinical_evidence_claims for insert to authenticated
  with check (clinical_evidence_has_review_role());
create policy clinical_evidence_claims_update on public.clinical_evidence_claims for update to authenticated
  using (clinical_evidence_has_review_role()) with check (clinical_evidence_has_review_role());
create policy clinical_evidence_claims_delete on public.clinical_evidence_claims for delete to authenticated
  using (clinical_evidence_has_review_role());

-- clinical_evidence_outcome_links
drop policy if exists clinical_outcome_links_review_access on public.clinical_evidence_outcome_links;
drop policy if exists clinical_outcome_links_public_read on public.clinical_evidence_outcome_links;
create policy clinical_outcome_links_select on public.clinical_evidence_outcome_links for select to anon, authenticated
  using (
    clinical_evidence_has_review_role()
    or (
      review_status = 'published'
      and exists (select 1 from clinical_condition_terms c where c.id = clinical_evidence_outcome_links.condition_term_id and c.review_status = 'published')
      and exists (select 1 from clinical_evidence_records e where e.id = clinical_evidence_outcome_links.evidence_record_id and e.review_status = 'published')
    )
  );
create policy clinical_outcome_links_insert on public.clinical_evidence_outcome_links for insert to authenticated
  with check (clinical_evidence_has_review_role());
create policy clinical_outcome_links_update on public.clinical_evidence_outcome_links for update to authenticated
  using (clinical_evidence_has_review_role()) with check (clinical_evidence_has_review_role());
create policy clinical_outcome_links_delete on public.clinical_evidence_outcome_links for delete to authenticated
  using (clinical_evidence_has_review_role());

-- clinical_guideline_recommendations
drop policy if exists clinical_guideline_recommendations_review_access on public.clinical_guideline_recommendations;
drop policy if exists clinical_guideline_recommendations_verified_read on public.clinical_guideline_recommendations;
create policy clinical_guideline_recommendations_select on public.clinical_guideline_recommendations for select to authenticated
  using (clinical_evidence_has_review_role() or (is_verified_clinician() and status = 'current'));
create policy clinical_guideline_recommendations_insert on public.clinical_guideline_recommendations for insert to authenticated
  with check (clinical_evidence_has_review_role());
create policy clinical_guideline_recommendations_update on public.clinical_guideline_recommendations for update to authenticated
  using (clinical_evidence_has_review_role()) with check (clinical_evidence_has_review_role());
create policy clinical_guideline_recommendations_delete on public.clinical_guideline_recommendations for delete to authenticated
  using (clinical_evidence_has_review_role());

-- clinical_regimen_protocols
drop policy if exists clinical_regimen_protocols_review_access on public.clinical_regimen_protocols;
drop policy if exists clinical_regimen_protocols_verified_read on public.clinical_regimen_protocols;
create policy clinical_regimen_protocols_select on public.clinical_regimen_protocols for select to authenticated
  using (clinical_evidence_has_review_role() or (is_verified_clinician() and review_status = 'published'));
create policy clinical_regimen_protocols_insert on public.clinical_regimen_protocols for insert to authenticated
  with check (clinical_evidence_has_review_role());
create policy clinical_regimen_protocols_update on public.clinical_regimen_protocols for update to authenticated
  using (clinical_evidence_has_review_role()) with check (clinical_evidence_has_review_role());
create policy clinical_regimen_protocols_delete on public.clinical_regimen_protocols for delete to authenticated
  using (clinical_evidence_has_review_role());

-- clinical_safety_rules
drop policy if exists clinical_safety_rules_review_access on public.clinical_safety_rules;
drop policy if exists clinical_safety_rules_verified_read on public.clinical_safety_rules;
create policy clinical_safety_rules_select on public.clinical_safety_rules for select to authenticated
  using (clinical_evidence_has_review_role() or (is_verified_clinician() and review_status = 'published'));
create policy clinical_safety_rules_insert on public.clinical_safety_rules for insert to authenticated
  with check (clinical_evidence_has_review_role());
create policy clinical_safety_rules_update on public.clinical_safety_rules for update to authenticated
  using (clinical_evidence_has_review_role()) with check (clinical_evidence_has_review_role());
create policy clinical_safety_rules_delete on public.clinical_safety_rules for delete to authenticated
  using (clinical_evidence_has_review_role());

-- clinical_reviewer_credentials: subset case (review_access's admin/operator is fully covered by
-- review_read's default admin/operator/analyst for SELECT). Split write out, leave review_read as sole SELECT.
drop policy if exists clinical_reviewer_credentials_review_access on public.clinical_reviewer_credentials;
create policy clinical_reviewer_credentials_insert on public.clinical_reviewer_credentials for insert to authenticated
  with check (clinical_evidence_has_review_role(array['admin','operator']));
create policy clinical_reviewer_credentials_update on public.clinical_reviewer_credentials for update to authenticated
  using (clinical_evidence_has_review_role(array['admin','operator']))
  with check (clinical_evidence_has_review_role(array['admin','operator']));
create policy clinical_reviewer_credentials_delete on public.clinical_reviewer_credentials for delete to authenticated
  using (clinical_evidence_has_review_role(array['admin','operator']));

-- genetics_claims
drop policy if exists genetics_claims_owner_admin_all on public.genetics_claims;
drop policy if exists genetics_claims_public_read on public.genetics_claims;
create policy genetics_claims_select on public.genetics_claims for select to public
  using (
    (public_display_allowed = true and review_status = 'approved_public'::claim_review_status)
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_claims.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );
create policy genetics_claims_insert on public.genetics_claims for insert to authenticated
  with check (is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = genetics_claims.cultivar_id and cp.owner_user_id = (select auth.uid())));
create policy genetics_claims_update on public.genetics_claims for update to authenticated
  using (is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = genetics_claims.cultivar_id and cp.owner_user_id = (select auth.uid())))
  with check (is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = genetics_claims.cultivar_id and cp.owner_user_id = (select auth.uid())));
create policy genetics_claims_delete on public.genetics_claims for delete to authenticated
  using (is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = genetics_claims.cultivar_id and cp.owner_user_id = (select auth.uid())));

-- talent_jobs: fold manage's select contribution into public_read_open
drop policy if exists talent_jobs_manage on public.talent_jobs;
drop policy if exists talent_jobs_public_read_open on public.talent_jobs;
create policy talent_jobs_select on public.talent_jobs for select to anon, authenticated
  using (
    status = 'open'
    or exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or workspace_id in (select workspace_members.workspace_id from workspace_members where workspace_members.user_id = (select auth.uid()))
  );
create policy talent_jobs_insert on public.talent_jobs for insert to authenticated
  with check (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or workspace_id in (select workspace_members.workspace_id from workspace_members where workspace_members.user_id = (select auth.uid()))
  );
create policy talent_jobs_update on public.talent_jobs for update to authenticated
  using (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or workspace_id in (select workspace_members.workspace_id from workspace_members where workspace_members.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or workspace_id in (select workspace_members.workspace_id from workspace_members where workspace_members.user_id = (select auth.uid()))
  );
create policy talent_jobs_delete on public.talent_jobs for delete to authenticated
  using (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or workspace_id in (select workspace_members.workspace_id from workspace_members where workspace_members.user_id = (select auth.uid()))
  );

commit;
