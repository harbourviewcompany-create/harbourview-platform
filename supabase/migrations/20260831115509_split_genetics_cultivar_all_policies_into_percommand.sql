-- Reconstructed from production. Verbatim statements for version 20260831115509.
begin;

-- === Pure duplicate: owner_read is byte-identical to owner_all's condition ===
drop policy if exists genetics_profile_roles_owner_read on public.genetics_profile_roles;

-- === Subset cases (same shape as Family 1: narrower ALL role-set fully covered by broader SELECT) ===
drop policy if exists genetics_routing_events_admin_operator_all on public.genetics_routing_events;
create policy genetics_routing_events_insert on public.genetics_routing_events for insert to authenticated
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy genetics_routing_events_update on public.genetics_routing_events for update to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])))
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy genetics_routing_events_delete on public.genetics_routing_events for delete to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));

drop policy if exists genetics_routing_records_admin_operator_all on public.genetics_routing_records;
create policy genetics_routing_records_insert on public.genetics_routing_records for insert to authenticated
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy genetics_routing_records_update on public.genetics_routing_records for update to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])))
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy genetics_routing_records_delete on public.genetics_routing_records for delete to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));

drop policy if exists genetics_project_members_admin_all on public.genetics_project_members;
create policy genetics_project_members_insert on public.genetics_project_members for insert to public
  with check (is_genetics_admin_or_reviewer());
create policy genetics_project_members_update on public.genetics_project_members for update to public
  using (is_genetics_admin_or_reviewer())
  with check (is_genetics_admin_or_reviewer());
create policy genetics_project_members_delete on public.genetics_project_members for delete to public
  using (is_genetics_admin_or_reviewer());

-- === Simple SELECT+SELECT merge (no ALL policy involved) ===
drop policy if exists country_intel_admin_select on public.country_intel;
drop policy if exists country_intel_intel_tier_read on public.country_intel;
create policy country_intel_select on public.country_intel for select to authenticated
  using (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = any (array['admin','operator','analyst']))
    or (review_status = 'active' and exists (select 1 from user_profiles up where up.id = (select auth.uid()) and up.tier = any (array['intel','operator'])))
  );

commit;
