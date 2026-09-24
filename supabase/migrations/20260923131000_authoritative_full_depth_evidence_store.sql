create table if not exists public.jurisdiction_data_depth_evidence (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on update cascade on delete cascade,
  evidence_kind text not null check (evidence_kind in ('authority_rule','authority_statement','structural_fact','verified_research')),
  applicability text not null check (applicability in ('applicable','not_applicable')),
  evidence_payload jsonb not null,
  evidence_quote text not null,
  source_registry_id uuid not null references public.source_registry(id) on delete restrict,
  source_snapshot_id uuid not null references public.source_snapshots(id) on delete restrict,
  source_url text not null,
  effective_from date,
  effective_to date,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','superseded','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists jurisdiction_data_depth_evidence_current_unique
  on public.jurisdiction_data_depth_evidence(jurisdiction_key,dimension_key)
  where verification_status='verified';

create index if not exists jurisdiction_data_depth_evidence_snapshot_idx
  on public.jurisdiction_data_depth_evidence(source_snapshot_id);

alter table public.jurisdiction_data_depth_evidence enable row level security;
drop policy if exists jurisdiction_data_depth_evidence_read on public.jurisdiction_data_depth_evidence;
create policy jurisdiction_data_depth_evidence_read
on public.jurisdiction_data_depth_evidence for select to anon,authenticated using (true);
grant select on public.jurisdiction_data_depth_evidence to anon,authenticated,service_role;

create or replace view public.v_jurisdiction_data_depth_generic_evidence_gate
with (security_invoker=on) as
select e.jurisdiction_key,e.dimension_key,e.applicability,e.verification_status,
       e.source_url,e.source_snapshot_id,
       coalesce(g.qualifying_snapshot,false) qualifying_snapshot,
       case
         when e.verification_status='conflict' then 'CONFLICT'
         when e.verification_status<>'verified' then 'UNVERIFIED'
         when not coalesce(g.qualifying_snapshot,false) then 'SNAPSHOT_NOT_QUALIFIED'
         when e.source_url<>coalesce(g.registered_source_url,'') then 'SOURCE_MISMATCH'
         else 'OK'
       end gate_code
from public.jurisdiction_data_depth_evidence e
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=e.source_snapshot_id;

grant select on public.v_jurisdiction_data_depth_generic_evidence_gate to authenticated,service_role;


-- The generic evidence store is a publication-facing verified-fact surface.
-- Apply the same fail-closed provenance contract used by the structured models.
create or replace function public.enforce_full_depth_evidence_provenance()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  snapshot_source uuid;
  registered_url text;
begin
  if new.verification_status = 'verified' then
    if new.source_url is null or new.source_url !~ '^https://' then
      raise exception 'verified full-depth evidence requires an HTTPS source_url';
    end if;
    if new.source_registry_id is null or new.source_snapshot_id is null then
      raise exception 'verified full-depth evidence requires source_registry_id and source_snapshot_id';
    end if;
    if new.verified_at is null then
      raise exception 'verified full-depth evidence requires verified_at';
    end if;

    select ss.source_id, sr.source_url
      into snapshot_source, registered_url
    from public.source_snapshots ss
    left join public.source_registry sr on sr.id=ss.source_id
    where ss.id=new.source_snapshot_id;

    if snapshot_source is null then
      raise exception 'verified full-depth evidence requires a valid source snapshot lineage';
    end if;
    if snapshot_source is distinct from new.source_registry_id then
      raise exception 'verified full-depth evidence source_registry_id does not match snapshot source_id';
    end if;
    if registered_url is null or registered_url is distinct from new.source_url then
      raise exception 'verified full-depth evidence source_url does not match registered source URL';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_full_depth_evidence_provenance() from public, anon, authenticated;
grant execute on function public.enforce_full_depth_evidence_provenance() to service_role;

drop trigger if exists jurisdiction_data_depth_evidence_provenance_trg on public.jurisdiction_data_depth_evidence;
create trigger jurisdiction_data_depth_evidence_provenance_trg
before insert or update on public.jurisdiction_data_depth_evidence
for each row execute function public.enforce_full_depth_evidence_provenance();

-- Applicability is itself evidence and cannot become a completeness escape hatch
-- without the same source/snapshot lineage requirements.
create or replace function public.enforce_full_depth_applicability_provenance()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  snapshot_source uuid;
  registered_url text;
begin
  if new.verification_status = 'verified' then
    if new.source_url is null or new.source_url !~ '^https://' then
      raise exception 'verified applicability evidence requires an HTTPS source_url';
    end if;
    if new.source_snapshot_id is null then
      raise exception 'verified applicability evidence requires source_snapshot_id';
    end if;
    if new.verified_at is null then
      raise exception 'verified applicability evidence requires verified_at';
    end if;

    select ss.source_id, sr.source_url
      into snapshot_source, registered_url
    from public.source_snapshots ss
    left join public.source_registry sr on sr.id=ss.source_id
    where ss.id=new.source_snapshot_id;

    if snapshot_source is null then
      raise exception 'verified applicability evidence requires a valid source snapshot lineage';
    end if;
    if registered_url is null or registered_url is distinct from new.source_url then
      raise exception 'verified applicability evidence source_url does not match registered source URL';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_full_depth_applicability_provenance() from public, anon, authenticated;
grant execute on function public.enforce_full_depth_applicability_provenance() to service_role;

drop trigger if exists jurisdiction_data_depth_applicability_provenance_trg on public.jurisdiction_data_depth_applicability_evidence;
create trigger jurisdiction_data_depth_applicability_provenance_trg
before insert or update on public.jurisdiction_data_depth_applicability_evidence
for each row execute function public.enforce_full_depth_applicability_provenance();
