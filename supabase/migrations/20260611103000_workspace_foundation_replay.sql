-- Replay-safe workspace foundation recovered from the production schema.
-- The canonical Harbourview workspace is a structural seed referenced by
-- existing search-function defaults and does not grant membership by itself.

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz default now(),
  slug text unique,
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','suspended','archived')),
  updated_at timestamptz not null default now(),
  legal_name text,
  trade_name text,
  org_type text check (
    org_type is null or org_type in (
      'supplier','buyer','broker','lab','pharmacy','clinic','equipment','service',
      'financial','distributor','exporter','importer'
    )
  ),
  jurisdiction_country text,
  jurisdiction_region text,
  verification_status text not null default 'unverified' check (
    verification_status in ('unverified','pending_review','verified','suspended','revoked')
  ),
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  is_public boolean not null default false
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','operator','analyst','viewer')),
  invited_by uuid references auth.users(id),
  joined_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','invited','suspended','removed')),
  invited_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

insert into public.workspaces (id, name, slug, status, settings, verification_status, is_public)
values (
  'a85840b4-c522-4cb8-9097-2f6c30a78417'::uuid,
  'Harbourview',
  'harbourview',
  'active',
  '{}'::jsonb,
  'unverified',
  false
)
on conflict (id) do update set
  name = excluded.name,
  slug = coalesce(public.workspaces.slug, excluded.slug),
  updated_at = now();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
revoke all on table public.workspaces from public, anon;
revoke all on table public.workspace_members from public, anon;
grant select on table public.workspaces to authenticated;
grant select on table public.workspace_members to authenticated;
grant all on table public.workspaces to service_role;
grant all on table public.workspace_members to service_role;

drop policy if exists workspace_members_read on public.workspace_members;
create policy workspace_members_read
  on public.workspace_members for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists workspaces_member_select on public.workspaces;
create policy workspaces_member_select
  on public.workspaces for select to authenticated
  using (
    exists (
      select 1 from public.workspace_members member
      where member.workspace_id = workspaces.id
        and member.user_id = (select auth.uid())
        and member.status = 'active'
    )
  );

-- Restore production-equivalent foreign keys when the artifact tables already exist.
do $workspace_artifact_fks$
begin
  if to_regclass('public.hv_artifacts') is not null
    and not exists (select 1 from pg_constraint where conname = 'hv_artifacts_workspace_id_fkey')
  then
    alter table public.hv_artifacts
      add constraint hv_artifacts_workspace_id_fkey
      foreign key (workspace_id) references public.workspaces(id);
  end if;
  if to_regclass('public.hv_embeddings') is not null
    and not exists (select 1 from pg_constraint where conname = 'hv_embeddings_workspace_id_fkey')
  then
    alter table public.hv_embeddings
      add constraint hv_embeddings_workspace_id_fkey
      foreign key (workspace_id) references public.workspaces(id);
  end if;
end
$workspace_artifact_fks$;
