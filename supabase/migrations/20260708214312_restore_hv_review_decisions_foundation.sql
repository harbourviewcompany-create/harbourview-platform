-- Production's public.hv_review_decisions relation and audit trigger existed
-- before the July 8 RLS initplan advisory snapshot, but their creating DDL was
-- absent from repository zero-state history. Restore the production table and
-- the table-compatible audit behavior without replacing existing rows.

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

-- The production trigger function currently references columns that are not
-- present on production's legacy audit_events table. Retain the same review
-- decision evidence in the live entity/actor/metadata audit contract so the
-- restored trigger is executable rather than reproducing that latent failure.
create or replace function public.hv_audit_review_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into public.audit_events (
    entity_type,
    entity_id,
    action,
    actor,
    actor_user_id,
    actor_org_id,
    metadata
  )
  values (
    'hv_review_decision',
    new.id,
    'review_decision.' || new.decision,
    new.decided_by::text,
    new.decided_by,
    new.workspace_id,
    jsonb_build_object(
      'artifact_id', new.artifact_id,
      'decision_note', new.decision_note,
      'previous_status', new.previous_status,
      'new_status', new.new_status,
      'previous_lifecycle', new.previous_lifecycle,
      'new_lifecycle', new.new_lifecycle,
      'public_eligible_set', new.public_eligible_set,
      'public_eligible_reason', new.public_eligible_reason,
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
