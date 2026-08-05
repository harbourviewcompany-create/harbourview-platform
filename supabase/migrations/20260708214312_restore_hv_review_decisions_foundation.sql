-- Production's public.hv_review_decisions relation and audit trigger existed
-- before the July 8 RLS initplan advisory snapshot, but their creating DDL was
-- absent from repository zero-state history. Restore the exact production
-- contract without replacing rows or changing an existing relation.

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

-- Preserve the live ACL boundary. The following July 8 migration installs the
-- exact reviewed workspace-isolation policy captured from production.
grant select, insert, update, delete on table public.hv_review_decisions
  to anon, authenticated;
grant all privileges on table public.hv_review_decisions to service_role;

create or replace function public.hv_audit_review_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into public.audit_events (
    user_id,
    action,
    event_type,
    resource_type,
    resource_id,
    resource_name,
    workspace_id,
    before_state,
    after_state,
    metadata
  )
  values (
    new.decided_by,
    'review_decision',
    'UPDATE',
    'artifact',
    new.artifact_id,
    null,
    new.workspace_id,
    jsonb_build_object(
      'review_status', new.previous_status,
      'lifecycle_stage', new.previous_lifecycle
    ),
    jsonb_build_object(
      'review_status', new.new_status,
      'lifecycle_stage', new.new_lifecycle,
      'public_eligible', new.public_eligible_set
    ),
    jsonb_build_object(
      'decision', new.decision,
      'note', new.decision_note,
      'evidence_ids', new.evidence_ids,
      'linked_sources', new.linked_sources
    )
  );
  return new;
end;
$function$;

drop trigger if exists trg_hv_review_decision_audit
  on public.hv_review_decisions;
create trigger trg_hv_review_decision_audit
  after insert on public.hv_review_decisions
  for each row execute function public.hv_audit_review_decision();
