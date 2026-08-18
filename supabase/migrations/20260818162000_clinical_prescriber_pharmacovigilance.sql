-- Clinical Prescriber OS: patient adverse-event / pharmacovigilance workflow.
-- Additive/forward only. This migration records clinician-authored events and
-- reporting status; it does not infer regulatory reporting obligations or
-- submit reports to an external authority.

create table if not exists public.clinical_adverse_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  patient_id uuid not null references public.clinical_patients(id) on delete cascade,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  reporter_user_id uuid not null,
  professional_id uuid references public.hv_professionals(id) on delete set null,
  jurisdiction text not null,
  formulary_product_id uuid references public.clinical_formulary_products(id) on delete set null,
  formulary_sku_id uuid references public.clinical_formulary_skus(id) on delete set null,
  suspected_product_name text not null,
  lot_number text,
  event_summary text not null,
  seriousness text not null default 'unknown'
    check (seriousness in ('serious', 'non-serious', 'unknown')),
  onset_at timestamptz,
  concomitant_products text[] not null default '{}',
  action_taken text,
  outcome text,
  authority_report_required boolean,
  authority_report_status text not null default 'not-assessed'
    check (authority_report_status in ('not-assessed', 'not-required', 'pending', 'submitted', 'failed')),
  authority_report_reference text,
  authority_reported_at timestamptz,
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'closed', 'void')),
  metadata jsonb not null default '{}'::jsonb,
  constraint clinical_adverse_event_product_reference
    check (formulary_product_id is not null or formulary_sku_id is not null or length(trim(suspected_product_name)) > 0)
);

create index if not exists clinical_adverse_events_patient_idx
  on public.clinical_adverse_events (patient_id, created_at desc);
create index if not exists clinical_adverse_events_reporter_idx
  on public.clinical_adverse_events (reporter_user_id, created_at desc);
create index if not exists clinical_adverse_events_status_idx
  on public.clinical_adverse_events (status, authority_report_status, created_at desc);

alter table public.clinical_adverse_events enable row level security;

revoke all on public.clinical_adverse_events from anon;
grant select, insert, update on public.clinical_adverse_events to authenticated;
grant all on public.clinical_adverse_events to service_role;

drop policy if exists clinical_adverse_events_clinician_select on public.clinical_adverse_events;
create policy clinical_adverse_events_clinician_select
  on public.clinical_adverse_events for select to authenticated
  using (
    public.is_verified_clinician()
    and (
      reporter_user_id = (select auth.uid())
      or exists (
        select 1
        from public.clinical_patients p
        where p.id = clinical_adverse_events.patient_id
          and (
            p.created_by = (select auth.uid())
            or exists (
              select 1
              from public.clinical_care_team ct
              where ct.patient_id = p.id
                and ct.user_id = (select auth.uid())
                and ct.membership_status = 'active'
            )
          )
      )
    )
  );

drop policy if exists clinical_adverse_events_clinician_insert on public.clinical_adverse_events;
create policy clinical_adverse_events_clinician_insert
  on public.clinical_adverse_events for insert to authenticated
  with check (
    public.is_verified_clinician()
    and reporter_user_id = (select auth.uid())
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
    and exists (
      select 1
      from public.clinical_patients p
      where p.id = clinical_adverse_events.patient_id
        and (
          p.created_by = (select auth.uid())
          or exists (
            select 1
            from public.clinical_care_team ct
            where ct.patient_id = p.id
              and ct.user_id = (select auth.uid())
              and ct.membership_status = 'active'
          )
        )
    )
  );

drop policy if exists clinical_adverse_events_clinician_update on public.clinical_adverse_events;
create policy clinical_adverse_events_clinician_update
  on public.clinical_adverse_events for update to authenticated
  using (
    public.is_verified_clinician()
    and (
      reporter_user_id = (select auth.uid())
      or exists (
        select 1 from public.clinical_care_team ct
        where ct.patient_id = clinical_adverse_events.patient_id
          and ct.user_id = (select auth.uid())
          and ct.membership_status = 'active'
          and ct.role in ('treating_clinician', 'pharmacist', 'care_coordinator')
      )
    )
  )
  with check (
    public.is_verified_clinician()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
  );

drop policy if exists clinical_adverse_events_service on public.clinical_adverse_events;
create policy clinical_adverse_events_service
  on public.clinical_adverse_events for all to public
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create or replace function public.clinical_adverse_event_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.clinical_require_core_consent(new.patient_id);

  if new.encounter_id is not null and not exists (
    select 1 from public.clinical_encounters e
    where e.id = new.encounter_id and e.patient_id = new.patient_id
  ) then
    raise exception 'clinical_adverse_event_encounter_patient_mismatch'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    new.updated_at = now();
  end if;

  return new;
end;
$$;

revoke all on function public.clinical_adverse_event_before_write() from public;

drop trigger if exists trg_clinical_adverse_event_before_write on public.clinical_adverse_events;
create trigger trg_clinical_adverse_event_before_write
  before insert or update on public.clinical_adverse_events
  for each row execute function public.clinical_adverse_event_before_write();

create or replace function public.clinical_adverse_event_after_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.clinical_audit_write(
    case when tg_op = 'INSERT' then 'adverse_event.record' else 'adverse_event.update' end,
    'clinical_adverse_events',
    new.id::text,
    new.jurisdiction,
    jsonb_build_object(
      'patient_id', new.patient_id,
      'seriousness', new.seriousness,
      'status', new.status,
      'authority_report_status', new.authority_report_status,
      'has_formulary_product', new.formulary_product_id is not null,
      'has_formulary_sku', new.formulary_sku_id is not null
    ),
    new.reporter_user_id
  );
  return new;
end;
$$;

revoke all on function public.clinical_adverse_event_after_write() from public;

drop trigger if exists trg_clinical_adverse_event_after_write on public.clinical_adverse_events;
create trigger trg_clinical_adverse_event_after_write
  after insert or update on public.clinical_adverse_events
  for each row execute function public.clinical_adverse_event_after_write();

-- Shared-decision documentation remains explicitly linked to existing consent
-- records rather than replacing the consent model.
alter table public.clinical_decision_records
  add column if not exists shared_decision_recorded_at timestamptz,
  add column if not exists consent_record_ids uuid[] not null default '{}'::uuid[];

comment on table public.clinical_adverse_events is
  'Restricted clinician-authored adverse-event/pharmacovigilance records. Harbourview does not infer or automatically submit regulator reports from this table.';
comment on column public.clinical_adverse_events.authority_report_required is
  'Clinician-recorded assessment only; null means not assessed. No regulatory obligation is inferred by the platform.';
comment on column public.clinical_decision_records.consent_record_ids is
  'References the consent records the clinician relied on when documenting shared decision-making; existing consent tables remain authoritative.';
