-- Reconstructed from production. Verbatim statements for version 20260831115538.
begin;

-- cultivar_aliases
drop policy if exists cultivar_aliases_owner_all on public.cultivar_aliases;
drop policy if exists cultivar_aliases_public_read on public.cultivar_aliases;
create policy cultivar_aliases_select on public.cultivar_aliases for select to anon, authenticated
  using (
    is_public = true
    or exists (select 1 from cultivar_passports cp where cp.id = cultivar_aliases.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer()))
  );
create policy cultivar_aliases_insert on public.cultivar_aliases for insert to authenticated
  with check (exists (select 1 from cultivar_passports cp where cp.id = cultivar_aliases.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())));
create policy cultivar_aliases_update on public.cultivar_aliases for update to authenticated
  using (exists (select 1 from cultivar_passports cp where cp.id = cultivar_aliases.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())))
  with check (exists (select 1 from cultivar_passports cp where cp.id = cultivar_aliases.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())));
create policy cultivar_aliases_delete on public.cultivar_aliases for delete to authenticated
  using (exists (select 1 from cultivar_passports cp where cp.id = cultivar_aliases.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())));

-- cultivar_country_opportunities
drop policy if exists cultivar_country_opportunities_owner_all on public.cultivar_country_opportunities;
drop policy if exists cultivar_country_opportunities_public_read on public.cultivar_country_opportunities;
create policy cultivar_country_opportunities_select on public.cultivar_country_opportunities for select to anon, authenticated
  using (
    exists (select 1 from cultivar_passports cp where cp.id = cultivar_country_opportunities.cultivar_id and cp.is_public = true)
    or exists (select 1 from cultivar_passports cp where cp.id = cultivar_country_opportunities.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer()))
  );
create policy cultivar_country_opportunities_insert on public.cultivar_country_opportunities for insert to authenticated
  with check (exists (select 1 from cultivar_passports cp where cp.id = cultivar_country_opportunities.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())));
create policy cultivar_country_opportunities_update on public.cultivar_country_opportunities for update to authenticated
  using (exists (select 1 from cultivar_passports cp where cp.id = cultivar_country_opportunities.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())))
  with check (exists (select 1 from cultivar_passports cp where cp.id = cultivar_country_opportunities.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())));
create policy cultivar_country_opportunities_delete on public.cultivar_country_opportunities for delete to authenticated
  using (exists (select 1 from cultivar_passports cp where cp.id = cultivar_country_opportunities.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())));

-- cultivar_passports
drop policy if exists cultivar_passports_owner_all on public.cultivar_passports;
drop policy if exists cultivar_passports_public_read on public.cultivar_passports;
create policy cultivar_passports_select on public.cultivar_passports for select to anon, authenticated
  using (is_public = true or owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer());
create policy cultivar_passports_insert on public.cultivar_passports for insert to authenticated
  with check (owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer());
create policy cultivar_passports_update on public.cultivar_passports for update to authenticated
  using (owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())
  with check (owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer());
create policy cultivar_passports_delete on public.cultivar_passports for delete to authenticated
  using (owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer());

-- genetics_access_grants
drop policy if exists genetics_access_grants_admin_owner_all on public.genetics_access_grants;
drop policy if exists genetics_access_grants_grantee_read on public.genetics_access_grants;
create policy genetics_access_grants_select on public.genetics_access_grants for select to authenticated
  using (
    is_genetics_admin_or_reviewer()
    or grantor_user_id = (select auth.uid())
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_access_grants.cultivar_id and cp.owner_user_id = (select auth.uid()))
    or exists (select 1 from genetics_profiles gp where gp.id = genetics_access_grants.grantee_profile_id and gp.owner_user_id = (select auth.uid()))
  );
create policy genetics_access_grants_insert on public.genetics_access_grants for insert to authenticated
  with check (
    is_genetics_admin_or_reviewer()
    or grantor_user_id = (select auth.uid())
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_access_grants.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );
create policy genetics_access_grants_update on public.genetics_access_grants for update to authenticated
  using (
    is_genetics_admin_or_reviewer()
    or grantor_user_id = (select auth.uid())
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_access_grants.cultivar_id and cp.owner_user_id = (select auth.uid()))
  )
  with check (
    is_genetics_admin_or_reviewer()
    or grantor_user_id = (select auth.uid())
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_access_grants.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );
create policy genetics_access_grants_delete on public.genetics_access_grants for delete to authenticated
  using (
    is_genetics_admin_or_reviewer()
    or grantor_user_id = (select auth.uid())
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_access_grants.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );

-- genetics_claim_reviews
drop policy if exists genetics_claim_reviews_admin_all on public.genetics_claim_reviews;
drop policy if exists genetics_claim_reviews_owner_read on public.genetics_claim_reviews;
create policy genetics_claim_reviews_select on public.genetics_claim_reviews for select to public
  using (
    is_genetics_admin_or_reviewer()
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_claim_reviews.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );
create policy genetics_claim_reviews_insert on public.genetics_claim_reviews for insert to public
  with check (is_genetics_admin_or_reviewer());
create policy genetics_claim_reviews_update on public.genetics_claim_reviews for update to public
  using (is_genetics_admin_or_reviewer())
  with check (is_genetics_admin_or_reviewer());
create policy genetics_claim_reviews_delete on public.genetics_claim_reviews for delete to public
  using (is_genetics_admin_or_reviewer());

-- genetics_collaboration_projects
drop policy if exists genetics_collaboration_projects_owner_all on public.genetics_collaboration_projects;
drop policy if exists genetics_collaboration_projects_public_read on public.genetics_collaboration_projects;
create policy genetics_collaboration_projects_select on public.genetics_collaboration_projects for select to anon, authenticated
  using (
    visibility = 'public_summary'::project_visibility
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from genetics_profiles gp where gp.id = genetics_collaboration_projects.owner_profile_id and gp.owner_user_id = (select auth.uid()))
  );
create policy genetics_collaboration_projects_insert on public.genetics_collaboration_projects for insert to authenticated
  with check (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_collaboration_projects.owner_profile_id and gp.owner_user_id = (select auth.uid())));
create policy genetics_collaboration_projects_update on public.genetics_collaboration_projects for update to authenticated
  using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_collaboration_projects.owner_profile_id and gp.owner_user_id = (select auth.uid())))
  with check (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_collaboration_projects.owner_profile_id and gp.owner_user_id = (select auth.uid())));
create policy genetics_collaboration_projects_delete on public.genetics_collaboration_projects for delete to authenticated
  using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_collaboration_projects.owner_profile_id and gp.owner_user_id = (select auth.uid())));

commit;
