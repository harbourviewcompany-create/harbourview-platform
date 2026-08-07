-- Production's immutable public.audit_events relation existed out of band before
-- repository migrations began indexing, exposing, and hardening it. Restore the
-- exact table contract during zero-state replay without replacing or updating data.

create table if not exists public.audit_events (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor text not null default 'system',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id),
  actor_org_id uuid references public.workspaces(id),
  deal_room_id uuid,
  ip_address text,
  user_agent text
);

create index if not exists idx_audit_events_actor
  on public.audit_events(actor);
create index if not exists idx_audit_events_actor_org
  on public.audit_events(actor_org_id, created_at desc);
create index if not exists idx_audit_events_actor_user
  on public.audit_events(actor_user_id, created_at desc);
create index if not exists idx_audit_events_created_at
  on public.audit_events(created_at desc);
create index if not exists idx_audit_events_entity
  on public.audit_events(entity_type, entity_id);

alter table public.audit_events enable row level security;

do $restore_audit_events_policy$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.audit_events'::regclass
      and polname = 'admin_operator_select'
  ) then
    create policy admin_operator_select
      on public.audit_events
      for select
      to public
      using (
        exists (
          select 1
          from public.user_roles
          where user_roles.user_id = (select auth.uid())
            and user_roles.role = any (array['admin'::text, 'operator'::text])
        )
      );
  end if;
end
$restore_audit_events_policy$;

comment on table public.audit_events is
  'Immutable event log. Service role INSERT only. No user writes.';

-- Preserve production ACLs. RLS permits only the explicit admin/operator read
-- policy; application-role writes remain denied while service_role can append.
grant select, insert, update, delete on table public.audit_events
  to anon, authenticated;
grant all privileges on table public.audit_events to service_role;
