-- Production's public.hv_relations relation existed before the July 8 RLS
-- initplan advisory snapshot, but its creating DDL was absent from repository
-- zero-state history. Restore the production contract without replacing rows
-- or modifying an existing relation.

do $restore_hv_relation_type$
begin
  create type public.hv_relation_type as enum (
    'references',
    'derived_from',
    'contradicts',
    'supports',
    'part_of',
    'follow_up',
    'supersedes',
    'related_to'
  );
exception
  when duplicate_object then null;
end
$restore_hv_relation_type$;

create table if not exists public.hv_relations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  from_artifact uuid not null references public.hv_artifacts(id) on delete cascade,
  to_artifact uuid not null references public.hv_artifacts(id) on delete cascade,
  relation_type public.hv_relation_type not null,
  confidence double precision,
  is_ai_suggested boolean not null default false,
  reviewed boolean not null default false,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint hv_relations_no_self check (from_artifact <> to_artifact),
  constraint hv_relations_unique unique (from_artifact, to_artifact, relation_type)
);

create index if not exists idx_hv_relations_ai
  on public.hv_relations (is_ai_suggested)
  where is_ai_suggested = true and reviewed = false;
create index if not exists idx_hv_relations_created_by
  on public.hv_relations (created_by);
create index if not exists idx_hv_relations_from
  on public.hv_relations (from_artifact);
create index if not exists idx_hv_relations_reviewed_by
  on public.hv_relations (reviewed_by);
create index if not exists idx_hv_relations_to
  on public.hv_relations (to_artifact);
create index if not exists idx_hv_relations_type
  on public.hv_relations (relation_type);
create index if not exists idx_hv_relations_workspace_id
  on public.hv_relations (workspace_id);

alter table public.hv_relations enable row level security;

-- Preserve the live ACL boundary. The July 8 migration installs the exact
-- reviewed workspace-isolation policy captured from production.
grant select, insert, update, delete on table public.hv_relations
  to anon, authenticated;
grant all privileges on table public.hv_relations to service_role;
