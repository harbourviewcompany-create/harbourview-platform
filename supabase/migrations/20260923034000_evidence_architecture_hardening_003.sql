-- Evidence architecture hardening 003.
-- Canonical hierarchy resolution and publication gating.
-- No parent/subnational inheritance is inferred from prose or regular expressions.

create table if not exists public.jurisdiction_hierarchy (
  jurisdiction_key text primary key references public.countries(iso_alpha2) on update cascade on delete cascade,
  jurisdiction_level text not null check (jurisdiction_level in ('national','subnational','unknown')),
  parent_jurisdiction_key text references public.countries(iso_alpha2) on update cascade on delete restrict,
  resolution_method text not null check (resolution_method in ('canonical_iso2','explicit_parent_mapping','unresolved')),
  verified_at timestamptz,
  notes text,
  updated_at timestamptz not null default now(),
  check (
    (jurisdiction_level='national' and parent_jurisdiction_key is null)
    or (jurisdiction_level='subnational' and parent_jurisdiction_key is not null)
    or jurisdiction_level='unknown'
  )
);

-- Two-character ISO-3166-1 alpha-2 keys are canonical national identities.
-- Non-national keys are only promoted to subnational when an explicit parent
-- mapping already exists in the evidence coverage registry; otherwise they
-- remain unknown and fail closed.
insert into public.jurisdiction_hierarchy
  (jurisdiction_key,jurisdiction_level,parent_jurisdiction_key,resolution_method,notes)
select
  c.iso_alpha2,
  case when length(c.iso_alpha2)=2 and c.iso_alpha2=upper(c.iso_alpha2)
       then 'national' else 'unknown' end,
  null,
  case when length(c.iso_alpha2)=2 and c.iso_alpha2=upper(c.iso_alpha2)
       then 'canonical_iso2' else 'unresolved' end,
  case when length(c.iso_alpha2)=2 and c.iso_alpha2=upper(c.iso_alpha2)
       then 'Canonical ISO alpha-2 national jurisdiction key.'
       else 'Subnational hierarchy requires an explicit parent mapping; no key-pattern inference is accepted.' end
from public.countries c
where c.iso_alpha2 is not null
on conflict (jurisdiction_key) do nothing;

with explicit_parent as (
  select distinct on (jurisdiction_key)
    jurisdiction_key,
    parent_jurisdiction_key
  from public.jurisdiction_data_depth_dimension_state
  where parent_jurisdiction_key is not null
    and contract_version='2026-09-22.v1'
  order by jurisdiction_key, updated_at desc
)
update public.jurisdiction_hierarchy h
set jurisdiction_level='subnational',
    parent_jurisdiction_key=e.parent_jurisdiction_key,
    resolution_method='explicit_parent_mapping',
    verified_at=now(),
    notes='Explicit parent jurisdiction supplied by the jurisdiction-depth state registry.',
    updated_at=now()
from explicit_parent e
where h.jurisdiction_key=e.jurisdiction_key
  and h.jurisdiction_level='unknown'
  and exists (
    select 1 from public.countries parent
    where parent.iso_alpha2=e.parent_jurisdiction_key
  );

create index if not exists jurisdiction_hierarchy_parent_idx
  on public.jurisdiction_hierarchy(parent_jurisdiction_key);

alter table public.jurisdiction_hierarchy enable row level security;
drop policy if exists jurisdiction_hierarchy_public_read on public.jurisdiction_hierarchy;
create policy jurisdiction_hierarchy_public_read on public.jurisdiction_hierarchy
  for select to anon, authenticated using (true);
grant select on public.jurisdiction_hierarchy to anon, authenticated;

create or replace view public.v_jurisdiction_hierarchy_failures
with (security_invoker=on) as
select jurisdiction_key,jurisdiction_level,parent_jurisdiction_key,resolution_method,notes
from public.jurisdiction_hierarchy
where jurisdiction_level='unknown'
   or (jurisdiction_level='subnational' and parent_jurisdiction_key is null)
   or (jurisdiction_level='national' and parent_jurisdiction_key is not null);
grant select on public.v_jurisdiction_hierarchy_failures to authenticated, service_role;

-- Preserve the original evaluator as an auditable pre-publication calculation.
do $$
begin
  if exists (select 1 from pg_views where schemaname='public' and viewname='v_jurisdiction_data_depth_evaluator')
     and not exists (select 1 from pg_views where schemaname='public' and viewname='v_jurisdiction_data_depth_evaluator_ungated') then
    alter view public.v_jurisdiction_data_depth_evaluator rename to v_jurisdiction_data_depth_evaluator_ungated;
  end if;
end $$;

-- A structured evidence row is publication-qualifying only when its referenced
-- snapshot passes the cryptographic/fetch/payload/source-registry gate.
create or replace view public.v_jurisdiction_data_depth_evaluator
with (security_invoker=on) as
with structured as (
  select jurisdiction_key,dimension_key,
         bool_or(verification_status='verified' and coalesce(qualifying_snapshot,false)) qualifying,
         bool_or(verification_status='verified' and not coalesce(qualifying_snapshot,false)) unqualified,
         count(*) filter (where verification_status='conflict') conflicts
  from public.v_jurisdiction_structured_evidence_provenance
  group by jurisdiction_key,dimension_key
),
legacy_regulatory as (
  select e.jurisdiction_iso2 jurisdiction_key,
         count(*) filter (where e.active and e.verified_at is not null and e.expires_at>=now()
           and e.source_snapshot_sha256 is not null
           and exists (
             select 1
             from public.source_snapshots ss
             join public.source_registry sr on sr.id=ss.source_id
             where lower(ss.raw_html_hash)=lower(e.source_snapshot_sha256)
               and ss.fetch_status='success'
               and ss.captured_at is not null
               and ss.captured_text is not null and length(ss.captured_text)>0
               and sr.source_url=e.authority_url
           )) qualifying_current,
         count(*) filter (where e.active and e.verified_at is not null and e.expires_at>=now()) current_rows
  from public.regulatory_market_access_evidence e
  group by e.jurisdiction_iso2
),
base as (select * from public.v_jurisdiction_data_depth_evaluator_ungated)
select
  b.jurisdiction_key,b.country_name,b.dimension_key,b.display_name,b.layer,
  b.required_for_regulatory_publication,b.requires_primary_source,b.applicability,
  case
    when b.applicability='unknown' then 'unmeasured'
    when b.applicability='not_applicable' then 'complete'
    when b.dimension_key='regulatory_status' then
      case when coalesce(lr.qualifying_current,0)>0 then b.evaluated_status
           when coalesce(lr.current_rows,0)>0 then 'blocked'
           else b.evaluated_status end
    when b.dimension_key='regulatory_tier' then
      case when coalesce(lr.qualifying_current,0)>0 then b.evaluated_status
           when coalesce(lr.current_rows,0)>0 then 'blocked'
           else b.evaluated_status end
    when b.dimension_key in ('access_rules','commercial_activity','import','export','distribution','testing','packaging_labeling','tax_fees','regulator','change_history','participants','buyers','sellers','counterparties','relationships','opportunities') then
      case when coalesce(s.qualifying,false) and coalesce(s.conflicts,0)=0 then b.evaluated_status
           when coalesce(s.conflicts,0)>0 then 'conflict'
           when coalesce(s.unqualified,false) then 'blocked'
           when b.evaluated_status='complete' then 'blocked'
           else b.evaluated_status end
    else b.evaluated_status
  end evaluated_status,
  case
    when b.dimension_key in ('regulatory_status','regulatory_tier') and coalesce(lr.current_rows,0)>0 and coalesce(lr.qualifying_current,0)=0
      then 'Current regulatory evidence exists but no qualifying source snapshot matches its authority URL and hash.'
    when b.dimension_key in ('access_rules','commercial_activity','import','export','distribution','testing','packaging_labeling','tax_fees','regulator','change_history','participants','buyers','sellers','counterparties','relationships','opportunities')
      and coalesce(s.unqualified,false)
      then 'Verified structured evidence exists without a qualifying source snapshot.'
    else b.evaluated_blocker_reason
  end evaluated_blocker_reason,
  b.evaluated_evidence_count,b.primary_source_count,b.latest_verified_at,b.freshness_deadline,
  b.confidence,b.evidence_basis,
  h.parent_jurisdiction_key,
  b.last_evaluated_at,b.contract_version
from base b
left join structured s on s.jurisdiction_key=b.jurisdiction_key and s.dimension_key=b.dimension_key
left join legacy_regulatory lr on lr.jurisdiction_key=b.jurisdiction_key
left join public.jurisdiction_hierarchy h on h.jurisdiction_key=b.jurisdiction_key;

-- Rebuild aggregates so they depend on the gated evaluator rather than the
-- preserved pre-publication calculation.
create or replace view public.v_jurisdiction_data_depth_summary
with (security_invoker=on) as
select jurisdiction_key,max(country_name) country_name,count(*) total_contract_dimensions,
 count(*) filter(where evaluated_status='complete') complete_dimensions,
 count(*) filter(where evaluated_status='missing') missing_dimensions,
 count(*) filter(where evaluated_status in ('blocked','stale','conflict')) blocked_dimensions,
 count(*) filter(where evaluated_status='unmeasured') unmeasured_dimensions,
 count(*) filter(where applicability='unknown') unknown_applicability_dimensions,
 count(*) filter(where applicability='not_applicable') not_applicable_dimensions,
 round(100.0*count(*) filter(where evaluated_status='complete')/nullif(count(*) filter(where applicability<>'unknown'),0),2) contract_depth_pct,
 bool_and(not required_for_regulatory_publication or evaluated_status='complete') regulatory_publication_ready
from public.v_jurisdiction_data_depth_evaluator group by jurisdiction_key;

create or replace view public.v_jurisdiction_data_depth_integrity
with (security_invoker=on) as
select count(distinct jurisdiction_key) jurisdiction_count,count(*) matrix_rows,count(distinct dimension_key) dimension_count,
 count(*) filter(where applicability='unknown') unknown_applicability_rows,
 count(*) filter(where evaluated_status='unmeasured') unmeasured_rows,
 count(*) filter(where evaluated_status in ('blocked','stale','conflict')) blocked_or_exception_rows,
 count(*) filter(where applicability='applicable' and evaluated_status='complete') applicable_complete_rows,
 count(*) filter(where applicability='not_applicable' and evaluated_status='complete') not_applicable_complete_rows,
 count(*) filter(where applicability='applicable' and evaluated_status<>'complete') applicable_incomplete_rows,
 (count(distinct jurisdiction_key)=291) expected_jurisdiction_count,
 (count(distinct dimension_key)=32) expected_dimension_count,
 (count(*)=291*32) expected_matrix_size,
 (count(distinct jurisdiction_key)=291 and count(distinct dimension_key)=32 and count(*)=291*32
  and count(*) filter(where applicability='unknown')=0
  and count(*) filter(where evaluated_status in ('missing','blocked','stale','conflict','unmeasured'))=0) full_depth_ready
from public.v_jurisdiction_data_depth_evaluator;

grant select on public.v_jurisdiction_data_depth_evaluator to anon,authenticated;
grant select on public.v_jurisdiction_data_depth_summary to anon,authenticated;
grant select on public.v_jurisdiction_data_depth_integrity to anon,authenticated;

comment on table public.jurisdiction_hierarchy is
'Canonical jurisdiction hierarchy registry. Unknown hierarchy is fail-closed; subnational parentage must be explicit, never inferred from a key pattern alone.';
comment on view public.v_jurisdiction_data_depth_evaluator_ungated is
'Pre-publication evaluator retained for audit. Its complete statuses are not sufficient for publication without the gated evaluator.';
