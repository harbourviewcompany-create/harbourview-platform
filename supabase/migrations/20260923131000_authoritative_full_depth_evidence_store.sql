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
         when e.source_url<>coalesce(g.captured_url,'') then 'SOURCE_MISMATCH'
         else 'OK'
       end gate_code
from public.jurisdiction_data_depth_evidence e
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=e.source_snapshot_id;

grant select on public.v_jurisdiction_data_depth_generic_evidence_gate to authenticated,service_role;
