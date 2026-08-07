-- Production's Harbourview relation and review-decision controls existed before
-- the July 8 RLS initplan advisory snapshot, but their creating DDL was absent
-- from repository zero-state history. Restore the exact contracts without
-- replacing rows or modifying existing relations.

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

create or replace function public.hv_audit_review_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into public.audit_events (entity_type, entity_id, action, actor, metadata)
  values (
    'hv_review_decision',
    new.id,
    'review_decision.' || new.decision,
    new.decided_by::text,
    jsonb_build_object(
      'artifact_id', new.artifact_id,
      'previous_status', new.previous_status,
      'new_status', new.new_status,
      'previous_lifecycle', new.previous_lifecycle,
      'new_lifecycle', new.new_lifecycle,
      'public_eligible_set', new.public_eligible_set
    )
  );
  return new;
end;
$function$;

create table if not exists public.hv_review_decisions (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.hv_artifacts(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id),
  decision text not null,
  decision_note text,
  previous_status public.hv_review_status,
  new_status public.hv_review_status not null,
  previous_lifecycle public.hv_lifecycle_stage,
  new_lifecycle public.hv_lifecycle_stage not null,
  public_eligible_set boolean,
  public_eligible_reason text,
  decided_by uuid not null references auth.users(id),
  decided_at timestamptz not null default now(),
  evidence_ids uuid[],
  linked_sources text[],
  created_at timestamptz not null default now()
);

create index if not exists idx_hv_review_decisions_artifact
  on public.hv_review_decisions (artifact_id);
create index if not exists idx_hv_review_decisions_decided_at
  on public.hv_review_decisions (decided_at desc);
create index if not exists idx_hv_review_decisions_decided_by
  on public.hv_review_decisions (decided_by);
create index if not exists idx_hv_review_decisions_workspace
  on public.hv_review_decisions (workspace_id);

alter table public.hv_review_decisions enable row level security;

drop trigger if exists trg_hv_review_decision_audit on public.hv_review_decisions;
create trigger trg_hv_review_decision_audit
  after insert on public.hv_review_decisions
  for each row execute function public.hv_audit_review_decision();

-- Preserve the live ACL boundary. The July 8 migration installs the exact
-- reviewed workspace-isolation policies captured from production.
grant select, insert, update, delete on table public.hv_relations
  to anon, authenticated;
grant all privileges on table public.hv_relations to service_role;

grant select, insert, update, delete on table public.hv_review_decisions
  to anon, authenticated;
grant all privileges on table public.hv_review_decisions to service_role;
