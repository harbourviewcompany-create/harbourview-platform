-- Record reconciliation counts in a private, append-only Clinical operations audit trail.
-- Production received the production-shaped Evidence Spine reconciliation without the
-- historical V1.1 operations migration, so this migration safely provisions the audit
-- table when absent. It does not publish or delete clinical content.

create table if not exists public.clinical_evidence_operation_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'source','intake','snapshot','extraction','credential','review','grade','conflict','evidence-record','publication','corpus'
  )),
  entity_id uuid,
  event_type text not null,
  actor_user_id uuid,
  event_payload jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create or replace function public.clinical_operation_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  raise exception 'Clinical operation events are append-only';
end;
$function$;

revoke all on function public.clinical_operation_event_immutable() from public;
drop trigger if exists trg_clinical_operation_event_immutable on public.clinical_evidence_operation_events;
create trigger trg_clinical_operation_event_immutable
before update or delete on public.clinical_evidence_operation_events
for each row execute function public.clinical_operation_event_immutable();

alter table public.clinical_evidence_operation_events enable row level security;

drop policy if exists clinical_operation_events_review_access on public.clinical_evidence_operation_events;
drop policy if exists clinical_operation_events_review_insert on public.clinical_evidence_operation_events;
create policy clinical_operation_events_review_access on public.clinical_evidence_operation_events
  for select to authenticated using (public.clinical_evidence_has_review_role());
create policy clinical_operation_events_review_insert on public.clinical_evidence_operation_events
  for insert to authenticated with check (public.clinical_evidence_has_review_role());

revoke all on public.clinical_evidence_operation_events from public, anon;
grant select, insert on public.clinical_evidence_operation_events to authenticated;
grant all on public.clinical_evidence_operation_events to service_role;

create index if not exists idx_clinical_operation_events_entity
  on public.clinical_evidence_operation_events(entity_type, entity_id, recorded_at desc);

insert into public.clinical_evidence_operation_events (
  entity_type,
  entity_id,
  event_type,
  event_payload,
  recorded_at
)
values (
  'corpus',
  null,
  'prescriber-provenance-remediation',
  jsonb_build_object(
    'evidence_records_withheld', (
      select count(*)
      from public.clinical_evidence_records
      where review_status = 'under-review'
        and coalesce(freshness_reason, '') ilike '%Prescriber provenance remediation%'
    ),
    'interaction_records_withheld', (
      select count(*)
      from public.clinical_medication_interactions
      where review_status = 'under-review'
        and provenance_status = 'review-required'
    ),
    'monitoring_records_withheld', (
      select count(*)
      from public.clinical_monitoring_protocols
      where review_status = 'under-review'
        and provenance_status = 'review-required'
    ),
    'remaining_published_noninspectable_evidence', (
      select count(*)
      from public.clinical_evidence_records
      where review_status = 'published'
        and not public.clinical_source_is_prescriber_inspectable(primary_source_url)
    ),
    'remaining_published_noninspectable_interactions', (
      select count(*)
      from public.clinical_medication_interactions
      where review_status = 'published'
        and (
          not public.clinical_source_is_prescriber_inspectable(primary_source_url)
          or btrim(coalesce(source_locator, '')) = ''
        )
    ),
    'recorded_by_migration', '20260818213100_clinical_provenance_remediation_audit.sql'
  ),
  now()
);

comment on table public.clinical_evidence_operation_events is
  'Private append-only operations audit trail. Provisioned by the Prescriber OS reconciliation when the historical V1.1 operations table is absent.';
