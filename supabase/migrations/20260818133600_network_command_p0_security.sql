begin;

create or replace function public.hv_network_active_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    join public.workspaces w on w.id = wm.workspace_id
    where wm.workspace_id = target_workspace
      and wm.user_id = auth.uid()
      and wm.status = 'active'
      and w.status = 'active'
  );
$$;

revoke all on function public.hv_network_active_workspace_member(uuid) from public, anon;
grant execute on function public.hv_network_active_workspace_member(uuid) to authenticated, service_role;

-- Foreign references between private Network objects must never cross workspace
-- boundaries, even if a caller guesses another object's UUID.
create or replace function public.hv_network_validate_introduction_links()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.mission_id is not null and not exists (
    select 1 from public.network_missions m
    where m.id = new.mission_id and m.workspace_id = new.workspace_id
  ) then
    raise exception 'NETWORK_MISSION_WORKSPACE_MISMATCH';
  end if;
  return new;
end;
$$;

create trigger network_introductions_validate_links
before insert or update on public.network_introductions
for each row execute function public.hv_network_validate_introduction_links();

create or replace function public.hv_network_validate_introduction_event_links()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.network_introductions i
    where i.id = new.introduction_id and i.workspace_id = new.workspace_id
  ) then
    raise exception 'NETWORK_INTRODUCTION_WORKSPACE_MISMATCH';
  end if;
  return new;
end;
$$;

create trigger network_introduction_events_validate_links
before insert or update on public.network_introduction_events
for each row execute function public.hv_network_validate_introduction_event_links();

create or replace function public.hv_network_validate_interaction_links()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.mission_id is not null and not exists (
    select 1 from public.network_missions m
    where m.id = new.mission_id and m.workspace_id = new.workspace_id
  ) then
    raise exception 'NETWORK_MISSION_WORKSPACE_MISMATCH';
  end if;
  if new.introduction_id is not null and not exists (
    select 1 from public.network_introductions i
    where i.id = new.introduction_id and i.workspace_id = new.workspace_id
  ) then
    raise exception 'NETWORK_INTRODUCTION_WORKSPACE_MISMATCH';
  end if;
  return new;
end;
$$;

create trigger network_interactions_validate_links
before insert or update on public.network_interactions
for each row execute function public.hv_network_validate_interaction_links();

alter table public.network_missions enable row level security;
alter table public.network_mission_requirements enable row level security;
alter table public.network_source_entity_links enable row level security;
alter table public.network_introductions enable row level security;
alter table public.network_introduction_events enable row level security;
alter table public.network_interactions enable row level security;

revoke all on table
  public.network_missions,
  public.network_mission_requirements,
  public.network_source_entity_links,
  public.network_introductions,
  public.network_introduction_events,
  public.network_interactions
from public, anon, authenticated;

-- Missions are workspace-private and editable by any active workspace member in P0.
-- This is the explicit P0 write policy; role-specific authoring can be layered later.
grant select, insert, update on table public.network_missions to authenticated;
grant select, insert, update on table public.network_mission_requirements to authenticated;

create policy network_missions_member_read
  on public.network_missions for select to authenticated
  using ((select public.hv_network_active_workspace_member(workspace_id)));
create policy network_missions_member_insert
  on public.network_missions for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select public.hv_network_active_workspace_member(workspace_id))
  );
create policy network_missions_member_update
  on public.network_missions for update to authenticated
  using ((select public.hv_network_active_workspace_member(workspace_id)))
  with check ((select public.hv_network_active_workspace_member(workspace_id)));

create policy network_mission_requirements_member_read
  on public.network_mission_requirements for select to authenticated
  using (exists (
    select 1 from public.network_missions m
    where m.id = mission_id
      and public.hv_network_active_workspace_member(m.workspace_id)
  ));
create policy network_mission_requirements_member_insert
  on public.network_mission_requirements for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.network_missions m
      where m.id = mission_id
        and public.hv_network_active_workspace_member(m.workspace_id)
    )
  );
create policy network_mission_requirements_member_update
  on public.network_mission_requirements for update to authenticated
  using (exists (
    select 1 from public.network_missions m
    where m.id = mission_id
      and public.hv_network_active_workspace_member(m.workspace_id)
  ))
  with check (exists (
    select 1 from public.network_missions m
    where m.id = mission_id
      and public.hv_network_active_workspace_member(m.workspace_id)
  ));

-- The source/entity resolution queue is staff-only. Customer Network DTOs receive
-- only an allowlisted resolved entity id when the server can safely expose one.
grant select, insert, update on table public.network_source_entity_links to authenticated;
create policy network_source_entity_links_staff_read
  on public.network_source_entity_links for select to authenticated
  using ((select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])));
create policy network_source_entity_links_staff_write
  on public.network_source_entity_links for all to authenticated
  using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
  with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

-- Introduction requests are append/control-plane objects in P0. Workspace users can
-- create/read requests; status advancement is deliberately not directly updateable
-- by the authenticated role and remains a controlled staff/system follow-up.
grant select, insert on table public.network_introductions to authenticated;
grant select, insert on table public.network_introduction_events to authenticated;

create policy network_introductions_member_read
  on public.network_introductions for select to authenticated
  using ((select public.hv_network_active_workspace_member(workspace_id)));
create policy network_introductions_member_insert
  on public.network_introductions for insert to authenticated
  with check (
    requester_user_id = (select auth.uid())
    and status in ('draft','review')
    and (select public.hv_network_active_workspace_member(workspace_id))
  );

create policy network_introduction_events_member_read
  on public.network_introduction_events for select to authenticated
  using ((select public.hv_network_active_workspace_member(workspace_id)));
create policy network_introduction_events_member_insert
  on public.network_introduction_events for insert to authenticated
  with check (
    actor_user_id = (select auth.uid())
    and event_type = 'requested'
    and (select public.hv_network_active_workspace_member(workspace_id))
  );

-- Interaction memory is append-oriented. Corrections are separate rows through
-- supersedes_interaction_id rather than mutable/deletable history.
grant select, insert on table public.network_interactions to authenticated;
create policy network_interactions_member_read
  on public.network_interactions for select to authenticated
  using ((select public.hv_network_active_workspace_member(workspace_id)));
create policy network_interactions_member_insert
  on public.network_interactions for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select public.hv_network_active_workspace_member(workspace_id))
  );

-- Service-role remains available to controlled server/admin jobs only.
grant all on table
  public.network_missions,
  public.network_mission_requirements,
  public.network_source_entity_links,
  public.network_introductions,
  public.network_introduction_events,
  public.network_interactions
to service_role;

-- api schema is the only PostgREST-exposed schema in production.
revoke all on
  api.network_missions,
  api.network_mission_requirements,
  api.network_introductions,
  api.network_introduction_events,
  api.network_interactions
from public, anon;

grant select, insert, update on api.network_missions to authenticated;
grant select, insert, update on api.network_mission_requirements to authenticated;
grant select, insert on api.network_introductions to authenticated;
grant select, insert on api.network_introduction_events to authenticated;
grant select, insert on api.network_interactions to authenticated;

grant select, insert, update, delete on
  api.network_missions,
  api.network_mission_requirements,
  api.network_introductions,
  api.network_introduction_events,
  api.network_interactions
to service_role;

-- Harden the existing watchlist contract: inactive memberships must no longer
-- retain read/write/delete access to workspace watches or rules.
drop policy if exists cc_watchlist_items_member_read on public.cc_watchlist_items;
drop policy if exists cc_watchlist_items_member_insert on public.cc_watchlist_items;
drop policy if exists cc_watchlist_items_member_update on public.cc_watchlist_items;
drop policy if exists cc_watchlist_items_member_delete on public.cc_watchlist_items;

drop policy if exists cc_watch_rules_member_read on public.cc_watch_rules;
drop policy if exists cc_watch_rules_member_insert on public.cc_watch_rules;
drop policy if exists cc_watch_rules_member_update on public.cc_watch_rules;
drop policy if exists cc_watch_rules_member_delete on public.cc_watch_rules;

create policy cc_watchlist_items_member_read
  on public.cc_watchlist_items for select to authenticated
  using ((select public.hv_network_active_workspace_member(org_id)));
create policy cc_watchlist_items_member_insert
  on public.cc_watchlist_items for insert to authenticated
  with check (
    added_by = (select auth.uid())
    and (select public.hv_network_active_workspace_member(org_id))
  );
create policy cc_watchlist_items_member_update
  on public.cc_watchlist_items for update to authenticated
  using ((select public.hv_network_active_workspace_member(org_id)))
  with check ((select public.hv_network_active_workspace_member(org_id)));
create policy cc_watchlist_items_member_delete
  on public.cc_watchlist_items for delete to authenticated
  using ((select public.hv_network_active_workspace_member(org_id)));

create policy cc_watch_rules_member_read
  on public.cc_watch_rules for select to authenticated
  using ((select public.hv_network_active_workspace_member(org_id)));
create policy cc_watch_rules_member_insert
  on public.cc_watch_rules for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select public.hv_network_active_workspace_member(org_id))
  );
create policy cc_watch_rules_member_update
  on public.cc_watch_rules for update to authenticated
  using ((select public.hv_network_active_workspace_member(org_id)))
  with check ((select public.hv_network_active_workspace_member(org_id)));
create policy cc_watch_rules_member_delete
  on public.cc_watch_rules for delete to authenticated
  using ((select public.hv_network_active_workspace_member(org_id)));

commit;
