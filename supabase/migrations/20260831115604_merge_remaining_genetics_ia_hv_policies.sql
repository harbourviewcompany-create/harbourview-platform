-- Reconstructed from production. Verbatim statements for version 20260831115604.
begin;

-- genetics_evidence_items (3-way: owner_all + grant_read + public_summary_read)
drop policy if exists genetics_evidence_items_owner_all on public.genetics_evidence_items;
drop policy if exists genetics_evidence_items_grant_read on public.genetics_evidence_items;
drop policy if exists genetics_evidence_items_public_summary_read on public.genetics_evidence_items;
create policy genetics_evidence_items_select on public.genetics_evidence_items for select to anon, authenticated
  using (
    visibility = 'public_summary'::evidence_visibility
    or created_by = (select auth.uid())
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_evidence_items.cultivar_id and cp.owner_user_id = (select auth.uid()))
    or exists (
      select 1 from genetics_access_grants gag join genetics_profiles gp on gp.id = gag.grantee_profile_id
      where gag.cultivar_id = genetics_evidence_items.cultivar_id
        and gp.owner_user_id = (select auth.uid())
        and gag.status = 'active'::access_grant_status
        and gag.starts_at <= now()
        and (gag.expires_at is null or gag.expires_at > now())
        and gag.revoked_at is null
        and (genetics_evidence_items.id = any (gag.allowed_evidence_item_ids) or genetics_evidence_items.evidence_type = any (gag.allowed_evidence_types))
    )
  );
create policy genetics_evidence_items_insert on public.genetics_evidence_items for insert to authenticated
  with check (
    created_by = (select auth.uid())
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_evidence_items.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );
create policy genetics_evidence_items_update on public.genetics_evidence_items for update to authenticated
  using (
    created_by = (select auth.uid())
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_evidence_items.cultivar_id and cp.owner_user_id = (select auth.uid()))
  )
  with check (
    created_by = (select auth.uid())
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_evidence_items.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );
create policy genetics_evidence_items_delete on public.genetics_evidence_items for delete to authenticated
  using (
    created_by = (select auth.uid())
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_evidence_items.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );

-- genetics_service_providers
drop policy if exists genetics_service_providers_owner_all on public.genetics_service_providers;
drop policy if exists genetics_service_providers_public_read on public.genetics_service_providers;
create policy genetics_service_providers_select on public.genetics_service_providers for select to anon, authenticated
  using (
    is_public = true
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from genetics_profiles gp where gp.id = genetics_service_providers.profile_id and gp.owner_user_id = (select auth.uid()))
  );
create policy genetics_service_providers_insert on public.genetics_service_providers for insert to authenticated
  with check (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_service_providers.profile_id and gp.owner_user_id = (select auth.uid())));
create policy genetics_service_providers_update on public.genetics_service_providers for update to authenticated
  using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_service_providers.profile_id and gp.owner_user_id = (select auth.uid())))
  with check (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_service_providers.profile_id and gp.owner_user_id = (select auth.uid())));
create policy genetics_service_providers_delete on public.genetics_service_providers for delete to authenticated
  using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_service_providers.profile_id and gp.owner_user_id = (select auth.uid())));

-- ia_signal_embeddings
drop policy if exists ia_signal_embeddings_admin_operator_all on public.ia_signal_embeddings;
drop policy if exists ia_signal_embeddings_intel_tier_read on public.ia_signal_embeddings;
create policy ia_signal_embeddings_select on public.ia_signal_embeddings for select to authenticated
  using (
    exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator']))
    or exists (select 1 from user_profiles up where up.id = (select auth.uid()) and up.tier = any (array['intel','operator']))
  );
create policy ia_signal_embeddings_insert on public.ia_signal_embeddings for insert to authenticated
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy ia_signal_embeddings_update on public.ia_signal_embeddings for update to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])))
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy ia_signal_embeddings_delete on public.ia_signal_embeddings for delete to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));

-- ia_signals
drop policy if exists ia_signals_admin_operator_all on public.ia_signals;
drop policy if exists ia_signals_intel_tier_read on public.ia_signals;
create policy ia_signals_select on public.ia_signals for select to authenticated
  using (
    exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator']))
    or exists (select 1 from user_profiles up where up.id = (select auth.uid()) and up.tier = any (array['intel','operator']))
  );
create policy ia_signals_insert on public.ia_signals for insert to authenticated
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy ia_signals_update on public.ia_signals for update to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])))
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy ia_signals_delete on public.ia_signals for delete to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));

-- hv_public_feed (service_write for service_role untouched)
drop policy if exists hv_public_feed_admin_write on public.hv_public_feed;
drop policy if exists hv_public_feed_public_read on public.hv_public_feed;
create policy hv_public_feed_select on public.hv_public_feed for select to public
  using (
    status = 'published'
    or exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator']))
  );
create policy hv_public_feed_insert on public.hv_public_feed for insert to authenticated
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy hv_public_feed_update on public.hv_public_feed for update to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])))
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy hv_public_feed_delete on public.hv_public_feed for delete to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));

commit;
