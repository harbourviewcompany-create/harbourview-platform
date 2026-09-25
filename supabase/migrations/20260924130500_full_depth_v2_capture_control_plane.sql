-- V2 authoritative full-depth capture control plane.
-- Binds the 9,312-cell capture queue to the production 2026-09-23.v2 contract.
-- No row is considered complete without verified evidence and source lineage.

create table if not exists public.jurisdiction_data_depth_capture_jobs (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-23.v2',
  status text not null default 'queued'
    check (status in ('queued','capturing','captured','needs_review','complete','blocked')),
  source_registry_id uuid references public.source_registry(id) on delete set null,
  source_snapshot_id uuid references public.source_snapshots(id) on delete set null,
  attempts integer not null default 0,
  last_error text,
  extracted_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(jurisdiction_key,dimension_key,contract_version)
);

create index if not exists jurisdiction_data_depth_capture_jobs_status_idx
  on public.jurisdiction_data_depth_capture_jobs(contract_version,status,updated_at);

insert into public.jurisdiction_data_depth_capture_jobs(jurisdiction_key,dimension_key,contract_version)
select c.iso_alpha2,d.dimension_key,d.contract_version
from public.countries c
cross join public.jurisdiction_data_depth_dimensions d
where c.iso_alpha2 is not null
  and d.contract_version='2026-09-23.v2'
on conflict (jurisdiction_key,dimension_key,contract_version) do nothing;

create table if not exists public.jurisdiction_data_depth_evidence (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-23.v2',
  evidence_kind text not null check (evidence_kind in ('authority_rule','authority_statement','structural_fact','verified_research')),
  applicability text not null check (applicability in ('applicable','not_applicable')),
  evidence_payload jsonb not null,
  evidence_quote text not null,
  source_registry_id uuid not null references public.source_registry(id) on delete restrict,
  source_snapshot_id uuid not null references public.source_snapshots(id) on delete restrict,
  source_url text not null check (source_url ~ '^https://'),
  effective_from date,
  effective_to date,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','superseded','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists jurisdiction_data_depth_evidence_current_unique_v2
  on public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key,contract_version)
  where verification_status='verified';

create index if not exists jurisdiction_data_depth_evidence_snapshot_idx_v2
  on public.jurisdiction_data_depth_evidence(source_snapshot_id);

create table if not exists public.jurisdiction_data_depth_applicability_evidence (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-23.v2',
  applicability text not null check (applicability in ('applicable','not_applicable')),
  basis_type text not null check (basis_type in ('authoritative_rule','authority_statement','structural_fact','verified_research')),
  basis_text text not null,
  source_url text not null check (source_url ~ '^https://'),
  source_snapshot_id uuid not null references public.source_snapshots(id) on delete restrict,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(jurisdiction_key,dimension_key,contract_version)
);

create or replace function public.enforce_full_depth_v2_provenance()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  snapshot_source uuid;
  registered_url text;
begin
  if new.verification_status='verified' then
    if new.source_snapshot_id is null or new.verified_at is null then
      raise exception 'verified full-depth evidence requires snapshot lineage and verified_at';
    end if;
    select ss.source_id,sr.source_url
      into snapshot_source,registered_url
    from public.source_snapshots ss
    left join public.source_registry sr on sr.id=ss.source_id
    where ss.id=new.source_snapshot_id;
    if snapshot_source is null or registered_url is null then
      raise exception 'verified full-depth evidence requires valid snapshot/source lineage';
    end if;
    if tg_table_name='jurisdiction_data_depth_evidence'
       and new.source_registry_id is distinct from snapshot_source then
      raise exception 'verified full-depth evidence source_registry_id must match snapshot source_id';
    end if;
    if new.source_url is distinct from registered_url then
      raise exception 'verified full-depth evidence source_url must match registered source_url';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_full_depth_v2_provenance() from public,anon,authenticated;
grant execute on function public.enforce_full_depth_v2_provenance() to service_role;

drop trigger if exists jurisdiction_data_depth_evidence_v2_provenance_trg on public.jurisdiction_data_depth_evidence;
create trigger jurisdiction_data_depth_evidence_v2_provenance_trg
before insert or update on public.jurisdiction_data_depth_evidence
for each row execute function public.enforce_full_depth_v2_provenance();

drop trigger if exists jurisdiction_data_depth_applicability_v2_provenance_trg on public.jurisdiction_data_depth_applicability_evidence;
create trigger jurisdiction_data_depth_applicability_v2_provenance_trg
before insert or update on public.jurisdiction_data_depth_applicability_evidence
for each row execute function public.enforce_full_depth_v2_provenance();

create or replace view public.v_jurisdiction_data_depth_v2_evidence_gate
with (security_invoker=on) as
select
  e.jurisdiction_key,e.dimension_key,e.contract_version,e.verification_status,
  e.applicability,e.source_registry_id,e.source_snapshot_id,e.source_url,
  coalesce(
    lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
    and ss.captured_at is not null
    and ss.fetch_status='success'
    and ss.captured_text is not null
    and length(ss.captured_text)>0
    and sr.id is not null
    and sr.source_url=e.source_url,
    false
  ) qualifying_provenance,
  case
    when e.verification_status='conflict' then 'CONFLICT'
    when e.verification_status<>'verified' then 'UNVERIFIED'
    when not coalesce(
      lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
      and ss.captured_at is not null
      and ss.fetch_status='success'
      and ss.captured_text is not null
      and length(ss.captured_text)>0
      and sr.id is not null
      and sr.source_url=e.source_url,
      false
    ) then 'PROVENANCE_NOT_QUALIFIED'
    else 'OK'
  end gate_code
from public.jurisdiction_data_depth_evidence e
left join public.source_snapshots ss on ss.id=e.source_snapshot_id
left join public.source_registry sr on sr.id=ss.source_id
where e.contract_version='2026-09-23.v2';

create or replace view public.v_jurisdiction_data_depth_v2_capture_status
with (security_invoker=on) as
select
  count(*) total_jobs,
  count(*) filter(where status='queued') queued,
  count(*) filter(where status='capturing') capturing,
  count(*) filter(where status='captured') captured,
  count(*) filter(where status='needs_review') needs_review,
  count(*) filter(where status='complete') complete,
  count(*) filter(where status='blocked') blocked,
  count(*) filter(where status in ('queued','capturing','captured','needs_review','blocked')) unresolved
from public.jurisdiction_data_depth_capture_jobs
where contract_version='2026-09-23.v2';

alter table public.jurisdiction_data_depth_capture_jobs enable row level security;
drop policy if exists jurisdiction_data_depth_capture_jobs_read on public.jurisdiction_data_depth_capture_jobs;
create policy jurisdiction_data_depth_capture_jobs_read
on public.jurisdiction_data_depth_capture_jobs for select to authenticated using (true);
grant select on public.jurisdiction_data_depth_capture_jobs,public.v_jurisdiction_data_depth_v2_capture_status to authenticated,service_role;
revoke insert,update,delete on public.jurisdiction_data_depth_capture_jobs from anon,authenticated;

alter table public.jurisdiction_data_depth_evidence enable row level security;
drop policy if exists jurisdiction_data_depth_evidence_read on public.jurisdiction_data_depth_evidence;
create policy jurisdiction_data_depth_evidence_read
on public.jurisdiction_data_depth_evidence for select to anon,authenticated using (true);
grant select on public.jurisdiction_data_depth_evidence,public.v_jurisdiction_data_depth_v2_evidence_gate to anon,authenticated,service_role;

alter table public.jurisdiction_data_depth_applicability_evidence enable row level security;
drop policy if exists jurisdiction_data_depth_applicability_read on public.jurisdiction_data_depth_applicability_evidence;
create policy jurisdiction_data_depth_applicability_read
on public.jurisdiction_data_depth_applicability_evidence for select to anon,authenticated using (true);
grant select on public.jurisdiction_data_depth_applicability_evidence to anon,authenticated,service_role;

do $$
declare v_jobs bigint; v_dims bigint; v_jur bigint;
begin
 select count(*) into v_jobs from public.jurisdiction_data_depth_capture_jobs where contract_version='2026-09-23.v2';
 select count(*) into v_dims from public.jurisdiction_data_depth_dimensions where contract_version='2026-09-23.v2';
 select count(*) into v_jur from public.countries;
 if v_dims<>32 or v_jur<>291 or v_jobs<>9312 then
   raise exception 'V2 capture contract gate failed: dimensions %, jurisdictions %, jobs %; expected 32/291/9312',v_dims,v_jur,v_jobs;
 end if;
end $$;
