-- Evidence architecture hardening 006.
-- Adds dimension-aware authority requirements, applicability evidence,
-- snapshot/source binding, freshness/effective-date checks, conflict
-- resolution signals, immutable lineage diagnostics, and explicit gate codes.
-- This migration is diagnostic/fail-closed and does not fabricate evidence.

create table if not exists public.jurisdiction_data_depth_dimension_authority_requirements (
  dimension_key text primary key references public.jurisdiction_data_depth_dimensions(dimension_key) on update cascade on delete cascade,
  required_source_class text,
  requires_dimension_specific_source boolean not null default true,
  requires_current_snapshot boolean not null default true,
  requires_effective_date_for_current boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

insert into public.jurisdiction_data_depth_dimension_authority_requirements
(dimension_key,required_source_class,requires_dimension_specific_source,requires_current_snapshot,requires_effective_date_for_current,notes)
select dimension_key,
       case
         when dimension_key in ('regulatory_status','regulatory_tier','access_rules','commercial_activity','import','export','distribution','testing','packaging_labeling','tax_fees','regulator','calendar') then 'official_regulator'
         when dimension_key in ('change_history','claims','pathways','format_rules') then 'official_or_primary'
         else null
       end,
       required_for_regulatory_publication,
       required_for_regulatory_publication,
       required_for_regulatory_publication,
       'Default authority policy; jurisdiction-specific source authorization may be tightened without weakening the publication gate.'
from public.jurisdiction_data_depth_dimensions
on conflict (dimension_key) do nothing;

alter table public.jurisdiction_data_depth_dimension_authority_requirements enable row level security;
drop policy if exists jurisdiction_depth_authority_requirements_read on public.jurisdiction_data_depth_dimension_authority_requirements;
create policy jurisdiction_depth_authority_requirements_read on public.jurisdiction_data_depth_dimension_authority_requirements
for select to anon,authenticated using (true);
grant select on public.jurisdiction_data_depth_dimension_authority_requirements to anon,authenticated;

create table if not exists public.jurisdiction_data_depth_applicability_evidence (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on update cascade on delete cascade,
  applicability text not null check (applicability in ('applicable','not_applicable')),
  basis_type text not null check (basis_type in ('authoritative_rule','authority_statement','structural_fact','verified_research')),
  basis_text text not null,
  source_url text not null,
  source_snapshot_id uuid references public.source_snapshots(id) on delete restrict,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(jurisdiction_key,dimension_key)
);

alter table public.jurisdiction_data_depth_applicability_evidence enable row level security;
drop policy if exists jurisdiction_depth_applicability_read on public.jurisdiction_data_depth_applicability_evidence;
create policy jurisdiction_depth_applicability_read on public.jurisdiction_data_depth_applicability_evidence
for select to anon,authenticated using (true);
grant select on public.jurisdiction_data_depth_applicability_evidence to anon,authenticated;

create or replace view public.v_jurisdiction_data_depth_source_binding_failures
with (security_invoker=on) as
select r.id evidence_id,r.jurisdiction_key,r.rule_dimension dimension_key,r.source_url,r.source_snapshot_id,
       'SNAPSHOT_SOURCE_MISMATCH' failure_code
from public.jurisdiction_regulatory_rules r
join public.source_snapshots ss on ss.id=r.source_snapshot_id
join public.source_registry sr on sr.id=ss.source_id
where r.verification_status='verified'
  and (r.source_snapshot_id is null or r.source_url<>coalesce(sr.source_url,'') or r.source_url<>coalesce(ss.captured_url,''))

union all
select r.id,r.jurisdiction_key,'regulator',r.source_url,r.source_snapshot_id,'SNAPSHOT_SOURCE_MISMATCH'
from public.jurisdiction_regulators r
join public.source_snapshots ss on ss.id=r.source_snapshot_id
join public.source_registry sr on sr.id=ss.source_id
where r.verification_status='verified'
  and (r.source_snapshot_id is null or r.source_url<>coalesce(sr.source_url,'') or r.source_url<>coalesce(ss.captured_url,''))

union all
select r.id,r.jurisdiction_key,r.dimension_key,r.source_url,r.source_snapshot_id,'SNAPSHOT_SOURCE_MISMATCH'
from public.jurisdiction_regulatory_changes r
join public.source_snapshots ss on ss.id=r.source_snapshot_id
join public.source_registry sr on sr.id=ss.source_id
where r.verification_status='verified'
  and (r.source_snapshot_id is null or r.source_url<>coalesce(sr.source_url,'') or r.source_url<>coalesce(ss.captured_url,''))

union all
select r.id,r.jurisdiction_key,r.participant_type,r.source_url,r.source_snapshot_id,'SNAPSHOT_SOURCE_MISMATCH'
from public.jurisdiction_market_participants r
join public.source_snapshots ss on ss.id=r.source_snapshot_id
join public.source_registry sr on sr.id=ss.source_id
where r.verification_status='verified'
  and (r.source_snapshot_id is null or r.source_url<>coalesce(sr.source_url,'') or r.source_url<>coalesce(ss.captured_url,''))

union all
select r.id,r.jurisdiction_key,'relationships',r.source_url,r.source_snapshot_id,'SNAPSHOT_SOURCE_MISMATCH'
from public.jurisdiction_relationships r
join public.source_snapshots ss on ss.id=r.source_snapshot_id
join public.source_registry sr on sr.id=ss.source_id
where r.verification_status='verified'
  and (r.source_snapshot_id is null or r.source_url<>coalesce(sr.source_url,'') or r.source_url<>coalesce(ss.captured_url,''))

union all
select r.id,r.jurisdiction_key,'opportunities',r.source_url,r.source_snapshot_id,'SNAPSHOT_SOURCE_MISMATCH'
from public.jurisdiction_opportunities r
join public.source_snapshots ss on ss.id=r.source_snapshot_id
join public.source_registry sr on sr.id=ss.source_id
where r.verification_status='verified'
  and (r.source_snapshot_id is null or r.source_url<>coalesce(sr.source_url,'') or r.source_url<>coalesce(ss.captured_url,'')); 

create or replace view public.v_jurisdiction_data_depth_applicability_gate
with (security_invoker=on) as
select s.jurisdiction_key,s.dimension_key,s.applicability,
       coalesce(a.verification_status,'missing') evidence_verification_status,
       coalesce(g.qualifying_snapshot,false) qualifying_snapshot,
       case
         when s.applicability='unknown' then 'UNKNOWN_APPLICABILITY'
         when a.id is null then 'MISSING_APPLICABILITY_EVIDENCE'
         when a.verification_status<>'verified' then 'UNVERIFIED_APPLICABILITY'
         when not coalesce(g.qualifying_snapshot,false) then 'APPLICABILITY_SNAPSHOT_INVALID'
         else 'OK'
       end gate_code
from public.jurisdiction_data_depth_dimension_state s
left join public.jurisdiction_data_depth_applicability_evidence a
 on a.jurisdiction_key=s.jurisdiction_key and a.dimension_key=s.dimension_key
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=a.source_snapshot_id;

create or replace view public.v_jurisdiction_data_depth_lineage_gate
with (security_invoker=on) as
select p.jurisdiction_key,p.dimension_key,
       count(*) filter(where p.verification_status='verified') verified_rows,
       count(*) filter(where p.verification_status='verified' and coalesce(p.qualifying_snapshot,false)) qualified_rows,
       count(*) filter(where p.verification_status='conflict') conflict_rows,
       count(*) filter(where p.verification_status='verified' and coalesce(p.qualifying_snapshot,false) and p.source_snapshot_id is not null and p.source_registry_id is not null) lineage_complete_rows,
       case
         when count(*) filter(where p.verification_status='conflict')>0 then 'CONFLICT'
         when count(*) filter(where p.verification_status='verified' and not coalesce(p.qualifying_snapshot,false))>0 then 'SNAPSHOT_NOT_QUALIFIED'
         when count(*) filter(where p.verification_status='verified' and (p.source_snapshot_id is null or p.source_registry_id is null))>0 then 'INCOMPLETE_LINEAGE'
         else 'OK'
       end gate_code
from public.v_jurisdiction_structured_evidence_provenance p
group by p.jurisdiction_key,p.dimension_key;

create or replace view public.v_jurisdiction_data_depth_effective_date_gate
with (security_invoker=on) as
select r.jurisdiction_key,r.rule_dimension dimension_key,r.id,
       r.effective_from,r.effective_to,r.verification_status,
       case
         when r.effective_from is not null and r.effective_from>current_date then 'FUTURE_EFFECTIVE'
         when r.effective_to is not null and r.effective_to<current_date then 'EXPIRED'
         when r.effective_from is null then 'MISSING_EFFECTIVE_DATE'
         else 'CURRENT'
       end gate_code
from public.jurisdiction_regulatory_rules r
where r.verification_status='verified';

create or replace view public.v_jurisdiction_data_depth_conflict_gate
with (security_invoker=on) as
select jurisdiction_key,rule_dimension dimension_key,
       count(*) filter(where verification_status='conflict') conflict_rows,
       count(*) filter(where verification_status='verified' and effective_from<=current_date and (effective_to is null or effective_to>=current_date)) current_verified_rows,
       case
         when count(*) filter(where verification_status='conflict')>0 then 'CONFLICT'
         when count(*) filter(where verification_status='verified' and effective_from<=current_date and (effective_to is null or effective_to>=current_date))>1 then 'MULTIPLE_CURRENT_VERIFIED'
         else 'OK'
       end gate_code
from public.jurisdiction_regulatory_rules
group by jurisdiction_key,rule_dimension;

create or replace view public.v_jurisdiction_full_depth_gate_reasons
with (security_invoker=on) as
select e.jurisdiction_key,e.dimension_key,e.applicability,e.evaluated_status,
       case
         when h.jurisdiction_level='unknown' then 'UNKNOWN_HIERARCHY'
         when e.applicability='unknown' then 'UNKNOWN_APPLICABILITY'
         when e.applicability='not_applicable' and coalesce(a.gate_code,'MISSING_APPLICABILITY_EVIDENCE')<>'OK' then coalesce(a.gate_code,'MISSING_APPLICABILITY_EVIDENCE')
         when e.evaluated_status in ('missing','blocked','stale','conflict','unmeasured') then coalesce(e.evaluated_blocker_reason,'CELL_UNRESOLVED')
         else 'OK'
       end gate_code
from public.v_jurisdiction_data_depth_evaluator e
left join public.jurisdiction_hierarchy h on h.jurisdiction_key=e.jurisdiction_key
left join public.v_jurisdiction_data_depth_applicability_gate a
 on a.jurisdiction_key=e.jurisdiction_key and a.dimension_key=e.dimension_key;

comment on table public.jurisdiction_data_depth_dimension_authority_requirements is
  'Dimension-aware authority policy. A jurisdiction-level primary source is not sufficient to qualify an unrelated dimension.';
comment on table public.jurisdiction_data_depth_applicability_evidence is
  'Evidence-backed applicability decisions. Not-applicable is not a completeness escape hatch.';
