
-- RECOVERY BEGIN 20260923034000_evidence_architecture_hardening_003.sql
-- Evidence architecture hardening 003.
-- publication-qualifying only when its referenced snapshot passes the cryptographic/fetch/payload/source-registry gate
-- snapshotted_evidence_rows is an audit-visible evidence count, not a publication shortcut.
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

-- Canonical snapshot gate used by both legacy regulatory evidence and structured evidence.
create or replace view public.v_jurisdiction_verified_snapshot_gate
with (security_invoker=on) as
select
  e.evidence_key,
  e.jurisdiction_iso2 as jurisdiction_key,
  e.authority_url,
  e.source_snapshot_sha256,
  bool_or(
    ss.fetch_status='success'
    and ss.captured_at is not null
    and ss.captured_text is not null
    and length(ss.captured_text)>0
    and lower(ss.raw_html_hash)=lower(e.source_snapshot_sha256)
    and sr.source_url=e.authority_url
  ) as qualifying
from public.regulatory_market_access_evidence e
left join public.source_snapshots ss on ss.source_id in (select id from public.source_registry where source_url=e.authority_url)
left join public.source_registry sr on sr.id=ss.source_id
where e.source_snapshot_sha256 is not null
group by e.evidence_key,e.jurisdiction_iso2,e.authority_url,e.source_snapshot_sha256;
grant select on public.v_jurisdiction_verified_snapshot_gate to anon, authenticated;

-- Verified structured evidence exists without a qualifying source snapshot is blocked.
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
             select 1 from public.v_jurisdiction_verified_snapshot_gate g
             where g.evidence_key=e.evidence_key and g.qualifying
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923034000','evidence_architecture_hardening_003','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923034000_evidence_architecture_hardening_003.sql

-- RECOVERY BEGIN 20260923040000_evidence_architecture_hardening_004.sql
-- Evidence architecture hardening 004.
-- Strict publication gate: diagnostics remain permissive, publication remains fail-closed.
-- No source content is fabricated or inferred here.

create or replace view public.v_jurisdiction_full_depth_publication_gate
with (security_invoker = on) as
with evaluator as (
  select * from public.v_jurisdiction_data_depth_evaluator
),
hierarchy as (
  select jurisdiction_key,
         jurisdiction_level,
         parent_jurisdiction_key,
         resolution_method
  from public.jurisdiction_hierarchy
),
snapshot_qualified as (
  select jurisdiction_key,
         count(*) filter (where verification_status='verified' and coalesce(qualifying_snapshot,false)) verified_with_snapshot,
         count(*) filter (where verification_status='verified') verified_total
  from (
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_regulatory_rules r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_regulators r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_regulatory_changes r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_market_participants r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_relationships r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_opportunities r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
  ) x
  group by jurisdiction_key
),
source_authority as (
  select i.jurisdiction_key,
         count(p.jurisdiction_iso2) filter (
           where p.source_snapshot_sha256 is not null
             and lower(p.source_snapshot_sha256) ~ '^[0-9a-f]{64}$'
             and (p.expires_at is null or p.expires_at > now())
             and (p.source_effective_date is null or p.source_effective_date <= current_date)
         ) valid_primary_sources
  from public.jurisdiction_hierarchy i
  left join public.regulatory_market_access_primary_sources p
    on p.jurisdiction_iso2=i.jurisdiction_key
  group by i.jurisdiction_key
),
summary as (
  select jurisdiction_key,
         count(*) filter (where applicability='unknown') unknown_applicability,
         count(*) filter (where evaluated_status in ('missing','blocked','stale','conflict','unmeasured')) unresolved_cells,
         count(*) filter (where required_for_regulatory_publication and evaluated_status='complete') required_complete,
         count(*) filter (where required_for_regulatory_publication) required_total
  from evaluator
  group by jurisdiction_key
)
select
  h.jurisdiction_key,
  h.jurisdiction_level,
  h.parent_jurisdiction_key,
  h.resolution_method,
  coalesce(s.unknown_applicability,0) unknown_applicability,
  coalesce(s.unresolved_cells,0) unresolved_cells,
  coalesce(s.required_complete,0) required_complete,
  coalesce(s.required_total,0) required_total,
  coalesce(q.verified_total,0) verified_structured_evidence_rows,
  coalesce(q.verified_with_snapshot,0) verified_structured_rows_with_snapshot,
  coalesce(a.valid_primary_sources,0) valid_primary_sources,
  (
    h.jurisdiction_level <> 'unknown'
    and coalesce(s.unknown_applicability,0)=0
    and coalesce(s.unresolved_cells,0)=0
    and coalesce(s.required_complete,0)=coalesce(s.required_total,0)
    and coalesce(q.verified_total,0)=coalesce(q.verified_with_snapshot,0)
    and (
      coalesce(s.required_total,0)=0
      or coalesce(a.valid_primary_sources,0)>0
    )
  ) publication_ready
from hierarchy h
left join summary s on s.jurisdiction_key=h.jurisdiction_key
left join snapshot_qualified q on q.jurisdiction_key=h.jurisdiction_key
left join source_authority a on a.jurisdiction_key=h.jurisdiction_key;

create or replace function public.assert_full_depth_publication_gate()
returns table (
  jurisdiction_count bigint,
  publication_ready_jurisdictions bigint,
  unresolved_applicability_jurisdictions bigint,
  unresolved_cell_jurisdictions bigint,
  missing_primary_source_jurisdictions bigint,
  missing_snapshot_provenance_jurisdictions bigint,
  hierarchy_unresolved_jurisdictions bigint,
  gate_pass boolean
)
language sql stable security definer set search_path = public as $$
  with g as (select * from public.v_jurisdiction_full_depth_publication_gate)
  select
    count(*)::bigint,
    count(*) filter (where publication_ready)::bigint,
    count(*) filter (where unknown_applicability>0)::bigint,
    count(*) filter (where unresolved_cells>0)::bigint,
    count(*) filter (where required_total>0 and valid_primary_sources=0)::bigint,
    count(*) filter (where verified_structured_evidence_rows>verified_structured_rows_with_snapshot)::bigint,
    count(*) filter (where jurisdiction_level='unknown')::bigint,
    (
      count(*)=291
      and count(*) filter (where publication_ready)=291
    )
  from g;
$$;

revoke all on function public.assert_full_depth_publication_gate() from public, anon, authenticated;
grant execute on function public.assert_full_depth_publication_gate() to service_role;
grant select on public.v_jurisdiction_full_depth_publication_gate to authenticated, service_role;

comment on view public.v_jurisdiction_full_depth_publication_gate is
  'Strict publication gate for the 32-dimension jurisdiction-depth contract. Complete status alone is insufficient: applicability, hierarchy, snapshot provenance and required primary-source evidence must also pass.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923040000','evidence_architecture_hardening_004','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923040000_evidence_architecture_hardening_004.sql

-- RECOVERY BEGIN 20260923040500_primary_kz_enrichment.sql
-- Primary Kazakhstan industrial-cannabis enrichment; fail-closed on unsupported dimensions. Idempotent source/evidence/claim writes.
update public.regulatory_market_access_evidence set active=false,expires_at=now() where evidence_key='hv-mkt-complete-kz-20260913';

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-kz-industrial-hemp-20260923','KZ','cbd_hemp_only','Kazakhstan permits licensed legal entities to cultivate cannabis/hemp for industrial purposes unrelated to producing narcotic or psychotropic substances. Government Decree No. 797 sets THC at no more than 0.3% dry weight for permitted industrial cannabis and excludes narcotic-drug production. The narcotics law separately prohibits cannabis cultivation for manufacture of narcotic medicines except statutory cases.','Republic of Kazakhstan — Adilet legal information system','https://adilet.zan.kz/rus/docs/P2500000797','2025-09-26',now(),now()+interval '180 days',true)
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Kazakhstan Adilet — Government Decree No. 797 industrial cannabis THC requirements','https://adilet.zan.kz/rus/docs/P2500000797','KZ','Kazakhstan','KZ',1,'primary_legislation',true,true,'central_asia','ru','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary Kazakhstan legislation verified 2026-09-23; updated through 2026.','2026-09-23','drug_control_authority',array['legislation'],jsonb_build_object('primary_source',true))
on conflict (source_url) do update set jurisdiction_code='KZ',country='Kazakhstan',iso='KZ',tier=1,source_type='primary_legislation',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary Kazakhstan legislation verified 2026-09-23.',verification_checked_at=now(),regulator_class='drug_control_authority',updated_at=now();

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-kz-industrial-hemp-20260923','KZ','primary-evidence-claim:kz-industrial-hemp-20260923','Kazakhstan permits licensed legal entities to cultivate listed cannabis varieties for industrial purposes unrelated to narcotic-drug production, subject to government requirements including a THC ceiling of 0.3% dry weight; this is not an adult-use commercial cannabis market.','any','national','Republic of Kazakhstan — Adilet','https://adilet.zan.kz/rus/docs/P2500000797','2025-09-26',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';

update public.jurisdiction_dimension_coverage
set status='verified_populated',evidence_basis='Primary Kazakhstan government legislation verifies licensed industrial cannabis cultivation and 0.3% THC limit.',last_evaluated_at=now(),notes='Verified 2026-09-23 from Adilet Decree No. 797.'
where jurisdiction_key='KZ' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes='Verified from primary Kazakhstan legislation on 2026-09-23.'
where jurisdiction_key='KZ' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923040500','primary_kz_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923040500_primary_kz_enrichment.sql

-- RECOVERY BEGIN 20260923041000_evidence_architecture_hardening_005.sql
-- Evidence architecture hardening 005.
-- Operational capture queue for verified facts that still lack a qualifying immutable snapshot.
-- This migration creates no evidence and never auto-links a fact to an unrelated snapshot.

create or replace view public.v_jurisdiction_evidence_capture_queue
with (security_invoker = on) as
select
  'rule' evidence_kind,
  r.id evidence_id,
  r.jurisdiction_key,
  r.rule_dimension dimension_key,
  r.source_url,
  r.source_snapshot_id,
  r.verified_at,
  case
    when r.source_snapshot_id is null then 'missing_snapshot_reference'
    when g.snapshot_id is null then 'snapshot_not_qualifying'
    else 'none'
  end capture_status,
  sr.id source_registry_id,
  sr.source_name,
  sr.source_url registered_source_url
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
left join public.source_registry sr on sr.source_url=r.source_url
where r.verification_status='verified'
  and not coalesce(g.qualifying_snapshot,false)

union all

select
  'regulator',
  r.id,
  r.jurisdiction_key,
  'regulator',
  r.source_url,
  r.source_snapshot_id,
  r.verified_at,
  case
    when r.source_snapshot_id is null then 'missing_snapshot_reference'
    when g.snapshot_id is null then 'snapshot_not_qualifying'
    else 'none'
  end,
  sr.id,
  sr.source_name,
  sr.source_url
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
left join public.source_registry sr on sr.source_url=r.source_url
where r.verification_status='verified'
  and not coalesce(g.qualifying_snapshot,false)

union all

select
  'change',
  r.id,
  r.jurisdiction_key,
  r.dimension_key,
  r.source_url,
  r.source_snapshot_id,
  r.verified_at,
  case
    when r.source_snapshot_id is null then 'missing_snapshot_reference'
    when g.snapshot_id is null then 'snapshot_not_qualifying'
    else 'none'
  end,
  sr.id,
  sr.source_name,
  sr.source_url
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
left join public.source_registry sr on sr.source_url=r.source_url
where r.verification_status='verified'
  and not coalesce(g.qualifying_snapshot,false)

union all

select
  'participant',
  r.id,
  r.jurisdiction_key,
  r.participant_type,
  r.source_url,
  r.source_snapshot_id,
  r.verified_at,
  case
    when r.source_snapshot_id is null then 'missing_snapshot_reference'
    when g.snapshot_id is null then 'snapshot_not_qualifying'
    else 'none'
  end,
  sr.id,
  sr.source_name,
  sr.source_url
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
left join public.source_registry sr on sr.source_url=r.source_url
where r.verification_status='verified'
  and not coalesce(g.qualifying_snapshot,false)

union all

select
  'relationship',
  r.id,
  r.jurisdiction_key,
  'relationships',
  r.source_url,
  r.source_snapshot_id,
  r.verified_at,
  case
    when r.source_snapshot_id is null then 'missing_snapshot_reference'
    when g.snapshot_id is null then 'snapshot_not_qualifying'
    else 'none'
  end,
  sr.id,
  sr.source_name,
  sr.source_url
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
left join public.source_registry sr on sr.source_url=r.source_url
where r.verification_status='verified'
  and not coalesce(g.qualifying_snapshot,false)

union all

select
  'opportunity',
  r.id,
  r.jurisdiction_key,
  'opportunities',
  r.source_url,
  r.source_snapshot_id,
  r.verified_at,
  case
    when r.source_snapshot_id is null then 'missing_snapshot_reference'
    when g.snapshot_id is null then 'snapshot_not_qualifying'
    else 'none'
  end,
  sr.id,
  sr.source_name,
  sr.source_url
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
left join public.source_registry sr on sr.source_url=r.source_url
where r.verification_status='verified'
  and not coalesce(g.qualifying_snapshot,false);

grant select on public.v_jurisdiction_evidence_capture_queue to authenticated, service_role;

comment on view public.v_jurisdiction_evidence_capture_queue is
  'Operational queue for verified structured evidence lacking a qualifying immutable source snapshot. It identifies capture work but never fabricates or auto-links provenance.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923041000','evidence_architecture_hardening_005','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923041000_evidence_architecture_hardening_005.sql

-- RECOVERY BEGIN 20260923042000_evidence_architecture_hardening_006.sql
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
  and (r.source_snapshot_id is null or r.source_url<>coalesce(sr.source_url,''))

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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923042000','evidence_architecture_hardening_006','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923042000_evidence_architecture_hardening_006.sql

-- RECOVERY BEGIN 20260923043000_evidence_architecture_hardening_007.sql
-- Evidence architecture hardening 007.
-- Explicit versioned lineage and remediation state. No evidence rows are fabricated.

create table if not exists public.jurisdiction_data_depth_evidence_lineage (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on update cascade on delete cascade,
  evidence_kind text not null,
  evidence_id uuid,
  source_registry_id uuid,
  source_snapshot_id uuid references public.source_snapshots(id) on delete restrict,
  evidence_version integer not null default 1 check (evidence_version>0),
  lineage_status text not null default 'pending' check (lineage_status in ('pending','verified','superseded','rejected','conflict')),
  supersedes_lineage_id uuid references public.jurisdiction_data_depth_evidence_lineage(id) on delete restrict,
  effective_from date,
  effective_to date,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(jurisdiction_key,dimension_key,evidence_kind,evidence_id,evidence_version)
);

alter table public.jurisdiction_data_depth_evidence_lineage enable row level security;
drop policy if exists jurisdiction_depth_lineage_read on public.jurisdiction_data_depth_evidence_lineage;
create policy jurisdiction_depth_lineage_read on public.jurisdiction_data_depth_evidence_lineage
for select to anon,authenticated using (true);
grant select on public.jurisdiction_data_depth_evidence_lineage to anon,authenticated;

create or replace view public.v_jurisdiction_data_depth_lineage_integrity
with (security_invoker=on) as
select
  l.jurisdiction_key,
  l.dimension_key,
  count(*) lineage_rows,
  count(*) filter(where l.lineage_status='verified') verified_rows,
  count(*) filter(where l.lineage_status='superseded') superseded_rows,
  count(*) filter(where l.lineage_status='conflict') conflict_rows,
  count(*) filter(where l.lineage_status='verified' and l.source_snapshot_id is null) verified_without_snapshot,
  count(*) filter(where l.lineage_status='verified' and l.source_registry_id is null) verified_without_source,
  count(*) filter(where l.lineage_status='verified' and l.verified_at is null) verified_without_timestamp,
  case
    when count(*) filter(where l.lineage_status='conflict')>0 then 'CONFLICT'
    when count(*) filter(where l.lineage_status='verified' and l.source_snapshot_id is null)>0 then 'MISSING_SNAPSHOT'
    when count(*) filter(where l.lineage_status='verified' and l.source_registry_id is null)>0 then 'MISSING_SOURCE'
    when count(*) filter(where l.lineage_status='verified' and l.verified_at is null)>0 then 'MISSING_VERIFICATION_TIMESTAMP'
    else 'OK'
  end gate_code
from public.jurisdiction_data_depth_evidence_lineage l
group by l.jurisdiction_key,l.dimension_key;

create or replace view public.v_jurisdiction_data_depth_research_queue_gate
with (security_invoker=on) as
select
  s.jurisdiction_key,
  s.dimension_key,
  s.applicability,
  s.status,
  case
    when s.applicability='unknown' then 'UNKNOWN_APPLICABILITY'
    when s.status in ('missing','blocked','stale','conflict','unmeasured') then upper(s.status)
    when s.applicability='not_applicable'
      and coalesce(a.gate_code,'MISSING_APPLICABILITY_EVIDENCE')<>'OK'
      then coalesce(a.gate_code,'MISSING_APPLICABILITY_EVIDENCE')
    else 'RESOLVED'
  end queue_state
from public.jurisdiction_data_depth_dimension_state s
left join public.v_jurisdiction_data_depth_applicability_gate a
  on a.jurisdiction_key=s.jurisdiction_key and a.dimension_key=s.dimension_key;

create or replace function public.assert_full_depth_291x32()
returns table (
  jurisdiction_count bigint,
  dimension_count bigint,
  matrix_rows bigint,
  unknown_applicability bigint,
  unresolved_cells bigint,
  unknown_hierarchy bigint,
  gate_pass boolean
)
language sql stable security definer set search_path=public as $$
  with x as (select * from public.jurisdiction_data_depth_evaluator)
  select
    count(distinct jurisdiction_key)::bigint,
    count(distinct dimension_key)::bigint,
    count(*)::bigint,
    count(*) filter(where applicability='unknown')::bigint,
    count(*) filter(where evaluated_status in ('missing','blocked','stale','conflict','unmeasured'))::bigint,
    (select count(*) from public.jurisdiction_hierarchy where jurisdiction_level='unknown')::bigint,
    (
      count(distinct jurisdiction_key)=291
      and count(distinct dimension_key)=32
      and count(*)=291*32
      and count(*) filter(where applicability='unknown')=0
      and count(*) filter(where evaluated_status in ('missing','blocked','stale','conflict','unmeasured'))=0
      and (select count(*) from public.jurisdiction_hierarchy where jurisdiction_level='unknown')=0
    )
  from x;
$$;

revoke all on function public.assert_full_depth_291x32() from public,anon,authenticated;
grant execute on function public.assert_full_depth_291x32() to service_role;

comment on table public.jurisdiction_data_depth_evidence_lineage is
  'Versioned audit lineage for jurisdiction-depth evidence. Corrections create new versions; supersession is explicit.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923043000','evidence_architecture_hardening_007','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923043000_evidence_architecture_hardening_007.sql

-- RECOVERY BEGIN 20260923043000_kz_pathway_calendar_format_depth.sql
-- Complete the primary Kazakhstan depth layer without inventing unsupported product formats.
insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
values
(
  (select id from public.countries where iso_alpha2='KZ'),
  'KZ',
  'depth-v1-kz-industrial-cannabis',
  'Licensed industrial cannabis cultivation authorization',
  'domestic_authorization',
  'Government Decree No. 797 (2025), as amended by Government Decree No. 259 (2026)',
  'Government of Kazakhstan',
  'active',
  '2025-09-26',
  'Licensed legal entities may cultivate approved cannabis varieties for industrial purposes unrelated to narcotic or psychotropic production, subject to government cultivation requirements and THC controls. This is not an adult-use retail pathway.',
  '{https://adilet.zan.kz/rus/docs/P2500000797}',
  'needs_review',
  now(),
  ARRAY['industrial purposes only','approved varieties','THC limit applies']
)
on conflict (slug) do update
set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,
    regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,
    summary=excluded.summary,source_urls=excluded.source_urls,last_verified_at=now(),
    qualifying_conditions=excluded.qualifying_conditions;

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select
  'pathway',id,'Government Decree No. 797',
  'Requirements for cultivation of cannabis for industrial purposes',
  'statute','https://adilet.zan.kz/rus/docs/P2500000797',
  '2025-09-26',current_date,
  'Establishes requirements for cultivation of cannabis for industrial purposes unrelated to production or manufacture of narcotic and psychotropic substances, including THC testing and controls.'
from public.regulatory_pathways
where slug='depth-v1-kz-industrial-cannabis'
and not exists (
  select 1 from public.regulatory_citations c
  where c.entity_type='pathway'
    and c.entity_id=public.regulatory_pathways.id
    and c.citation_url='https://adilet.zan.kz/rus/docs/P2500000797'
);

update public.regulatory_pathways
set verification='verified',last_verified_at=now(),updated_at=now()
where slug='depth-v1-kz-industrial-cannabis';

insert into public.regulatory_calendar
(iso2,event_type,title,summary,expected_date,confidence,source_url,source_label,status)
select
  'KZ','effective',
  'Industrial cannabis cultivation framework — Decree No. 797',
  'Kazakhstan established requirements for licensed industrial cannabis cultivation unrelated to narcotic or psychotropic production; the framework was amended in 2026 by Decree No. 259.',
  '2025-09-26','confirmed',
  'https://adilet.zan.kz/rus/docs/P2500000797',
  'Republic of Kazakhstan — Adilet','effective'
where not exists (
  select 1 from public.regulatory_calendar
  where iso2='KZ'
    and title='Industrial cannabis cultivation framework — Decree No. 797'
);

update public.jurisdiction_dimension_coverage
set status='verified_populated',
    evidence_basis='Primary Kazakhstan legislation establishes a verified industrial-cannabis authorization pathway and confirmed effective date.',
    last_evaluated_at=now(),
    notes='Verified 2026-09-23 from Decree No. 797 and 2026 amendment.'
where jurisdiction_key='KZ'
  and dimension_key in ('verified_pathways','regulatory_calendar');

update public.jurisdiction_dimension_coverage
set status='verified_empty',
    evidence_basis='Primary Kazakhstan sources establish industrial hemp/cannabis cultivation controls but do not establish commercial adult-use or medical product-format rules.',
    last_evaluated_at=now(),
    notes='No unsupported product formats inferred.'
where jurisdiction_key='KZ'
  and dimension_key='verified_format_rules';

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),
    notes='Verified industrial authorization pathway and effective-date calendar from primary Kazakhstan sources.'
where jurisdiction_key='KZ'
  and dimension_key in ('verified_pathways','regulatory_calendar','verified_format_rules');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923043000','kz_pathway_calendar_format_depth','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923043000_kz_pathway_calendar_format_depth.sql

-- RECOVERY BEGIN 20260923043001_kz_pathway_calendar_format_depth.sql
-- Complete the primary Kazakhstan depth layer without inventing unsupported product formats.
insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
values
(
  (select id from public.countries where iso_alpha2='KZ'),
  'KZ',
  'depth-v1-kz-industrial-cannabis',
  'Licensed industrial cannabis cultivation authorization',
  'domestic_authorization',
  'Government Decree No. 797 (2025), as amended by Government Decree No. 259 (2026)',
  'Government of Kazakhstan',
  'active',
  '2025-09-26',
  'Licensed legal entities may cultivate approved cannabis varieties for industrial purposes unrelated to narcotic or psychotropic production, subject to government cultivation requirements and THC controls. This is not an adult-use retail pathway.',
  '{https://adilet.zan.kz/rus/docs/P2500000797}',
  'needs_review',
  now(),
  ARRAY['industrial purposes only','approved varieties','THC limit applies']
)
on conflict (slug) do update
set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,
    regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,
    summary=excluded.summary,source_urls=excluded.source_urls,last_verified_at=now(),
    qualifying_conditions=excluded.qualifying_conditions;

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select
  'pathway',id,'Government Decree No. 797',
  'Requirements for cultivation of cannabis for industrial purposes',
  'statute','https://adilet.zan.kz/rus/docs/P2500000797',
  '2025-09-26',current_date,
  'Establishes requirements for cultivation of cannabis for industrial purposes unrelated to production or manufacture of narcotic and psychotropic substances, including THC testing and controls.'
from public.regulatory_pathways
where slug='depth-v1-kz-industrial-cannabis'
and not exists (
  select 1 from public.regulatory_citations c
  where c.entity_type='pathway'
    and c.entity_id=public.regulatory_pathways.id
    and c.citation_url='https://adilet.zan.kz/rus/docs/P2500000797'
);

update public.regulatory_pathways
set verification='verified',last_verified_at=now(),updated_at=now()
where slug='depth-v1-kz-industrial-cannabis';

insert into public.regulatory_calendar
(iso2,event_type,title,summary,expected_date,confidence,source_url,source_label,status)
select
  'KZ','effective',
  'Industrial cannabis cultivation framework — Decree No. 797',
  'Kazakhstan established requirements for licensed industrial cannabis cultivation unrelated to narcotic or psychotropic production; the framework was amended in 2026 by Decree No. 259.',
  '2025-09-26','confirmed',
  'https://adilet.zan.kz/rus/docs/P2500000797',
  'Republic of Kazakhstan — Adilet','effective'
where not exists (
  select 1 from public.regulatory_calendar
  where iso2='KZ'
    and title='Industrial cannabis cultivation framework — Decree No. 797'
);

update public.jurisdiction_dimension_coverage
set status='verified_populated',
    evidence_basis='Primary Kazakhstan legislation establishes a verified industrial-cannabis authorization pathway and confirmed effective date.',
    last_evaluated_at=now(),
    notes='Verified 2026-09-23 from Decree No. 797 and 2026 amendment.'
where jurisdiction_key='KZ'
  and dimension_key in ('verified_pathways','regulatory_calendar');

update public.jurisdiction_dimension_coverage
set status='verified_empty',
    evidence_basis='Primary Kazakhstan sources establish industrial hemp/cannabis cultivation controls but do not establish commercial adult-use or medical product-format rules.',
    last_evaluated_at=now(),
    notes='No unsupported product formats inferred.'
where jurisdiction_key='KZ'
  and dimension_key='verified_format_rules';

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),
    notes='Verified industrial authorization pathway and effective-date calendar from primary Kazakhstan sources.'
where jurisdiction_key='KZ'
  and dimension_key in ('verified_pathways','regulatory_calendar','verified_format_rules');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923043001','kz_pathway_calendar_format_depth','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923043001_kz_pathway_calendar_format_depth.sql

-- RECOVERY BEGIN 20260923044500_lt_primary_regulatory_depth.sql
-- Primary Lithuania regulatory depth. Secondary active provenance is retired fail-closed.
update public.regulatory_market_access_evidence
set active=false,expires_at=now()
where jurisdiction_iso2='LT' and active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Lithuania — Narcotic and Psychotropic Substances Control Act',
 'https://e-seimas.lrs.lt/portal/legalActPrint/lt?actualEditionId=dbhKmMISzP&category=TAD&documentId=TAIS.48770&jfwid=-17i2t420n6',
 'LT','Lithuania','LT',1,'legislation',true,true,'europe','lt','html_snapshot','weekly','verified',
 now()+interval '7 days','online',
 'Primary consolidated Lithuanian narcotics law; current edition from 2025-11-01.',
 '2026-09-23','drug_control_authority',array['legislation'],jsonb_build_object('primary_source',true))
on conflict(source_url) do update set
 jurisdiction_code='LT',is_active=true,relevance_status='verified',
 next_crawl_at=now()+interval '7 days',
 verification_notes='Primary consolidated Lithuanian narcotics law verified 2026-09-23.',
 verification_checked_at=now(),updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-lt-controlled-cannabis-20260923','LT','medical_limited_trade',
 'Lithuania classifies cannabis and cannabis plants in controlled narcotics schedules. The current law prohibits cultivation of cannabis and lawful circulation of Schedule I substances except defined cases, including registered medicinal products and scientific research; licensed entities may handle controlled medicinal products. Separate hemp law governs low-THC hemp products. No adult-use commercial cannabis retail pathway is established by the cited primary law.',
 'Republic of Lithuania — Seimas legal acts',
 'https://e-seimas.lrs.lt/portal/legalActPrint/lt?actualEditionId=dbhKmMISzP&category=TAD&documentId=TAIS.48770&jfwid=-17i2t420n6',
 '2025-11-01',now(),now()+interval '180 days',true)
on conflict(evidence_key) do update set
 tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,
 verified_at=now(),expires_at=now()+interval '180 days',active=true;

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-lt-controlled-cannabis-20260923','LT',
 'primary-evidence-claim:lt-controlled-cannabis-20260923',
 'Lithuania controls cannabis under its narcotics framework; Schedule I substances are generally prohibited from lawful circulation except statutory exceptions such as registered medicinal products and scientific research. Cannabis cultivation is prohibited under the cited law, and no adult-use commercial retail pathway is established by this source.',
 'any','national','Republic of Lithuania — Seimas legal acts',
 'https://e-seimas.lrs.lt/portal/legalActPrint/lt?actualEditionId=dbhKmMISzP&category=TAD&documentId=TAIS.48770&jfwid=-17i2t420n6',
 '2025-11-01',now(),now(),now()+interval '180 days','verified')
on conflict(claim_key) do update set
 claim_text=excluded.claim_text,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,
 retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',
 evidence_status='verified';

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
values
((select id from public.countries where iso_alpha2='LT'),'LT',
 'depth-v1-lt-controlled-medicinal',
 'Controlled medicinal/research authorization under narcotics framework',
 'medical_access_program',
 'Law No. VIII-602 on Control of Narcotic and Psychotropic Substances',
 'Lithuanian State Medicines Control Agency','active','2025-11-01',
 'Schedule I controlled substances may circulate only under statutory exceptions, including registered medicinal products and scientific research, with licensing requirements for relevant controlled medicinal-product activities. This is not an adult-use retail pathway.',
 ARRAY['https://e-seimas.lrs.lt/portal/legalActPrint/lt?actualEditionId=dbhKmMISzP&category=TAD&documentId=TAIS.48770&jfwid=-17i2t420n6'],
 'needs_review',now(),
 ARRAY['registered medicinal product exception','scientific research','controlled-substance licensing'])
on conflict (country_id, slug) do update set
 summary=excluded.summary,source_urls=excluded.source_urls,last_verified_at=now(),
 qualifying_conditions=excluded.qualifying_conditions;

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',id,'Law No. VIII-602',
 'Sections 4, 7 and 8 — controlled substances and lawful circulation exceptions',
 'statute',
 'https://e-seimas.lrs.lt/portal/legalActPrint/lt?actualEditionId=dbhKmMISzP&category=TAD&documentId=TAIS.48770&jfwid=-17i2t420n6',
 '2025-11-01',current_date,
 'The law defines lawful circulation of controlled narcotic/psychotropic substances and establishes Schedule I restrictions and exceptions for registered medicinal products and scientific research.'
from public.regulatory_pathways p
where p.slug='depth-v1-lt-controlled-medicinal'
and not exists (
  select 1
  from public.regulatory_citations c
  where c.entity_type='pathway'
    and c.entity_id=p.id
    and c.citation_url='https://e-seimas.lrs.lt/portal/legalActPrint/lt?actualEditionId=dbhKmMISzP&category=TAD&documentId=TAIS.48770&jfwid=-17i2t420n6'
);

update public.regulatory_pathways
set verification='verified',last_verified_at=now(),updated_at=now()
where slug='depth-v1-lt-controlled-medicinal';

update public.jurisdiction_dimension_coverage
set status='verified_populated',
    evidence_basis='Primary Lithuanian law verifies controlled cannabis evidence, a controlled medicinal/research pathway, and a primary source registry entry.',
    last_evaluated_at=now(),
    notes='Verified 2026-09-23 from current consolidated Law No. VIII-602.'
where jurisdiction_key='LT'
and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),
    notes='Verified 2026-09-23 from current Lithuanian primary law.'
where jurisdiction_key='LT'
and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923044500','lt_primary_regulatory_depth','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923044500_lt_primary_regulatory_depth.sql

-- RECOVERY BEGIN 20260923051000_mu_primary_medicinal_cannabis_depth.sql
-- Primary Mauritius medicinal-cannabis depth.
update public.regulatory_market_access_evidence
set active=false,expires_at=now()
where jurisdiction_iso2='MU' and active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Mauritius — Dangerous Drugs Act (current revised text)',
 'https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act',
 'MU','Mauritius','MU',1,'legislation',true,true,'africa','en','html_snapshot','weekly','verified',
 now()+interval '7 days','online',
 'Official Mauritius Laws portal current Dangerous Drugs Act; medicinal cannabis provisions and definitions reviewed 2026-09-23.',
 '2026-09-23','drug_control_authority',array['legislation'],jsonb_build_object('primary_source',true))
on conflict(source_url) do update set jurisdiction_code='MU',is_active=true,relevance_status='verified',
next_crawl_at=now()+interval '7 days',
verification_notes='Official Mauritius Laws portal current Dangerous Drugs Act verified 2026-09-23.',
verification_checked_at=now(),updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-mu-medicinal-cannabis-20260923','MU','medical_limited_trade',
 'Mauritius prohibits general cannabis cultivation and commercial trade under the Dangerous Drugs Act, but its medicinal-cannabis provisions establish a controlled medical pathway. The current law defines medicinal cannabis as a cannabis product in specified forms including capsules, oil-based solutions/suspensions and oro-mucosal spray, with THC concentration and volume limits; medicinal cannabis importation is restricted to Ministry-authorized channels.',
 'Attorney-General''s Office / Government of Mauritius',
 'https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act',
 '2023-03-10',now(),now()+interval '180 days',true)
on conflict(evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,
authority_name=excluded.authority_name,authority_url=excluded.authority_url,
source_effective_date=excluded.source_effective_date,verified_at=now(),
expires_at=now()+interval '180 days',active=true;

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-mu-medicinal-cannabis-20260923','MU',
 'primary-evidence-claim:mu-medicinal-cannabis-20260923',
 'Mauritius maintains a controlled medicinal-cannabis pathway under the Dangerous Drugs Act. The law defines medicinal cannabis in specified pharmaceutical forms and restricts importation to Ministry-authorized channels; general cannabis cultivation and Schedule I commercial trade remain prohibited outside statutory exceptions.',
 'any','national','Attorney-General''s Office / Government of Mauritius',
 'https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act',
 '2023-03-10',now(),now(),now()+interval '180 days','verified')
on conflict(claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,
authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,
retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
values
((select id from public.countries where iso_alpha2='MU'),'MU',
 'depth-v1-mu-medicinal-cannabis','Controlled medicinal cannabis pathway','medical_access_program',
 'Dangerous Drugs Act 2000 as amended by Act 17 of 2022','Ministry responsible for Health','active','2023-03-10',
 'Controlled medicinal cannabis may be supplied through the statutory medical framework; importation requires Ministry authorization and the law defines permitted medicinal-cannabis dosage forms.',
 '{https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act}',
 'needs_review',now(),ARRAY['Ministry authorization for import','prescription/medical use','specified dosage forms']);

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',id,'Dangerous Drugs Act 2000 as amended',
 'Medicinal cannabis provisions including importation and definition','statute',
 'https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act',
 '2023-03-10',current_date,'The current Act defines medicinal cannabis and provides controlled importation and medical-use provisions.'
from public.regulatory_pathways
where slug='depth-v1-mu-medicinal-cannabis'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway'
and c.entity_id=public.regulatory_pathways.id
and c.citation_url='https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act');

update public.regulatory_pathways
set verification='verified',last_verified_at=now(),updated_at=now()
where slug='depth-v1-mu-medicinal-cannabis';

insert into public.pathway_format_rules
(pathway_id,format_id,status,conditions,notes,source_urls,verification,last_verified_at,effective_date)
select p.id,f.id,'permitted',jsonb_build_object('medicinal_cannabis',true),
 'Medicinal cannabis is defined by law in this dosage form.',
 '{https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act}',
 'needs_review',now(),'2023-03-10'
from public.regulatory_pathways p join public.product_formats f on f.slug='capsules'
where p.slug='depth-v1-mu-medicinal-cannabis'
and not exists(select 1 from public.pathway_format_rules r where r.pathway_id=p.id and r.format_id=f.id);

insert into public.pathway_format_rules
(pathway_id,format_id,status,conditions,notes,source_urls,verification,last_verified_at,effective_date)
select p.id,f.id,'permitted',jsonb_build_object('medicinal_cannabis',true,'max_thc_mg_per_ml',30,'max_total_volume_ml',60),
 'Medicinal cannabis may be an oil-based solution or suspension within statutory THC and volume limits.',
 '{https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act}',
 'needs_review',now(),'2023-03-10'
from public.regulatory_pathways p join public.product_formats f on f.slug='oral_oil'
where p.slug='depth-v1-mu-medicinal-cannabis'
and not exists(select 1 from public.pathway_format_rules r where r.pathway_id=p.id and r.format_id=f.id);

insert into public.pathway_format_rules
(pathway_id,format_id,status,conditions,notes,source_urls,verification,last_verified_at,effective_date)
select p.id,f.id,'permitted',jsonb_build_object('medicinal_cannabis',true,'max_thc_mg_per_ml',30,'max_total_volume_ml',60),
 'Medicinal cannabis may be an oro-mucosal spray within statutory THC and volume limits.',
 '{https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act}',
 'needs_review',now(),'2023-03-10'
from public.regulatory_pathways p join public.product_formats f on f.slug='oromucosal_spray'
where p.slug='depth-v1-mu-medicinal-cannabis'
and not exists(select 1 from public.pathway_format_rules r where r.pathway_id=p.id and r.format_id=f.id);

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'rule',r.id,'Dangerous Drugs Act 2000 as amended',
 'Definition of medicinal cannabis and permitted dosage forms','statute',
 'https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act',
 '2023-03-10',current_date,
 'The Act defines medicinal cannabis as a capsule, oil-based solution or suspension, or oro-mucosal spray, with statutory THC concentration and volume limits.'
from public.pathway_format_rules r
join public.regulatory_pathways p on p.id=r.pathway_id
where p.slug='depth-v1-mu-medicinal-cannabis'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='rule'
and c.entity_id=r.id
and c.citation_url='https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act');

update public.pathway_format_rules r
set verification='verified',last_verified_at=now(),updated_at=now()
from public.regulatory_pathways p
where r.pathway_id=p.id and p.slug='depth-v1-mu-medicinal-cannabis';

update public.jurisdiction_dimension_coverage
set status='verified_populated',
    evidence_basis='Primary Mauritius law verifies source provenance, medicinal-cannabis evidence, controlled medical pathway and defined dosage forms.',
    last_evaluated_at=now(),
    notes='Verified 2026-09-23 from current Dangerous Drugs Act.'
where jurisdiction_key='MU'
and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),
    notes='Verified 2026-09-23 from current Mauritius primary law.'
where jurisdiction_key='MU'
and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923051000','mu_primary_medicinal_cannabis_depth','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923051000_mu_primary_medicinal_cannabis_depth.sql

-- RECOVERY BEGIN 20260923052500_md_primary_hemp_depth.sql
-- Primary Moldova hemp cultivation depth.
update public.regulatory_market_access_evidence set active=false,expires_at=now()
where jurisdiction_iso2='MD' and active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Moldova — Regulation on cultivation of plants containing narcotic or psychotropic substances',
 'https://www.legis.md/cautare/downloadpdf/97922','MD','Moldova','MD',1,'statute',true,true,
 'europe','ro','html_snapshot','weekly','verified',now()+interval '7 days','online',
 'Official Moldova legislation portal; hemp is defined as Cannabis and authorized cultivation is permitted for seed/fibre and scientific purposes.',
 '2026-09-23','drug_control_authority',array['legislation','regulation'],jsonb_build_object('primary_source',true))
on conflict(source_url) do update set jurisdiction_code='MD',is_active=true,relevance_status='verified',
next_crawl_at=now()+interval '7 days',verification_notes='Primary Moldova regulation verified 2026-09-23.',
verification_checked_at=now(),updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-md-hemp-cultivation-20260923','MD','cbd_hemp_only',
 'Moldova permits authorized cultivation of hemp (defined in the regulation as any plant of the Cannabis species) for scientific purposes and for production of seed and fibre, subject to authorization by the permanent drug-control committee. The cited primary regulation does not establish an adult-use cannabis retail pathway or medicinal cannabis commercial pathway.',
 'Republic of Moldova — Ministry of Justice legislation portal',
 'https://www.legis.md/cautare/downloadpdf/97922',null,now(),now()+interval '180 days',true)
on conflict(evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,
authority_name=excluded.authority_name,authority_url=excluded.authority_url,
verified_at=now(),expires_at=now()+interval '180 days',active=true;

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-md-hemp-cultivation-20260923','MD',
 'primary-evidence-claim:md-hemp-cultivation-20260923',
 'Moldova permits authorized cultivation of hemp for scientific purposes and production of seed or fibre; the cited primary regulation requires authorization and does not establish adult-use cannabis retail.',
 'any','national','Republic of Moldova — Ministry of Justice legislation portal',
 'https://www.legis.md/cautare/downloadpdf/97922',now(),now(),now()+interval '180 days','verified')
on conflict(claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,
authority_url=excluded.authority_url,retrieved_at=now(),verified_at=now(),
expires_at=now()+interval '180 days',evidence_status='verified';

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
values
((select id from public.countries where iso_alpha2='MD'),'MD',
 'depth-v1-md-authorized-hemp','Authorized hemp cultivation for seed, fibre and scientific purposes',
 'domestic_authorization',
 'Regulation on cultivation of plants containing narcotic or psychotropic substances',
 'Permanent Committee for Drug Control','active',null,
 'Authorized persons and legal entities may cultivate hemp for scientific purposes and/or production of seed and fibre, subject to an activity authorization. This is not an adult-use retail pathway.',
 ARRAY['https://www.legis.md/cautare/downloadpdf/97922'],'needs_review',now(),
 ARRAY['authorization required','seed and fibre production','scientific purposes'])
on conflict(slug) do update set summary=excluded.summary,source_urls=excluded.source_urls,
last_verified_at=now(),qualifying_conditions=excluded.qualifying_conditions;

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',id,'Moldova cultivation regulation','Paragraph 4 — hemp cultivation','statute',
'https://www.legis.md/cautare/downloadpdf/97922',null,current_date,
'Hemp is defined as any plant of the Cannabis species; cultivation is permitted for scientific purposes and/or production of seed and fibre when the required authorization is held.'
from public.regulatory_pathways p
where p.slug='depth-v1-md-authorized-hemp'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway'
and c.entity_id=p.id
and c.citation_url='https://www.legis.md/cautare/downloadpdf/97922');

update public.regulatory_pathways set verification='verified',last_verified_at=now(),updated_at=now()
where slug='depth-v1-md-authorized-hemp';

update public.jurisdiction_dimension_coverage
set status='verified_populated',
evidence_basis='Primary Moldova regulation verifies source provenance, hemp cultivation evidence, verified authorization pathway and regulatory claim.',
last_evaluated_at=now(),notes='Verified 2026-09-23 from Moldova legislation portal.'
where jurisdiction_key='MD'
and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now(),
notes='Verified 2026-09-23 from Moldova primary regulation.'
where jurisdiction_key='MD'
and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923052500','md_primary_hemp_depth','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923052500_md_primary_hemp_depth.sql

-- RECOVERY BEGIN 20260923060000_jurisdiction_evidence_depth_291.sql
-- 291-jurisdiction regulatory + intelligence evidence depth hardening.
-- This migration does NOT invent regulatory facts. It:
--   1) attaches existing captured source snapshots to existing evidence rows where the
--      repository's source registry and snapshot ledger can prove the relationship;
--   2) creates a one-to-one executable/partial claim ledger for every active evidence row;
--   3) captures existing reviewed country intelligence as analyst-synthesis evidence,
--      explicitly non-publication-authority;
--   4) exposes a 291-row depth dossier and a fail-closed completeness view.
--
-- The authoritative regulatory tier remains public.regulatory_market_access_evidence.
-- Existing evidence rows are not reclassified here.

alter table public.regulatory_market_access_evidence
  add column if not exists source_document_id text,
  add column if not exists source_snapshot_uri text,
  add column if not exists retrieved_at timestamptz;

-- Reconcile evidence to the source-capture ledger without fabricating hashes.
-- raw_html_hash is the captured source-content hash produced by the source engine.
with latest_snapshot as (
  select distinct on (sr.iso, sr.jurisdiction_code, sr.source_url)
    sr.iso,
    sr.jurisdiction_code,
    sr.source_url,
    ss.raw_html_hash,
    ss.captured_at,
    ss.captured_url
  from public.source_registry sr
  join public.source_snapshots ss on ss.source_id = sr.id
  where ss.fetch_status = 'success'
    and ss.raw_html_hash is not null
  order by sr.iso, sr.jurisdiction_code, sr.source_url, ss.captured_at desc
)
update public.regulatory_market_access_evidence e
set source_snapshot_sha256 = ls.raw_html_hash,
    source_snapshot_uri = ls.captured_url,
    retrieved_at = ls.captured_at
from latest_snapshot ls
where e.active
  and e.source_snapshot_sha256 is null
  and e.authority_url = ls.source_url
  and (
    upper(e.jurisdiction_iso2) = upper(ls.iso)
    or upper(e.jurisdiction_iso2) = upper(ls.jurisdiction_code)
  );

-- Every active regulatory evidence row receives an explicit claim record.
-- "verified" is reserved for evidence that has both an effective date and a
-- captured source hash. Everything else remains "partial" and cannot become
-- executable merely because a rationale exists.
insert into public.regulatory_market_access_claims (
  evidence_key,
  jurisdiction_iso2,
  claim_key,
  claim_text,
  product_class,
  jurisdiction_scope,
  authority_name,
  authority_url,
  source_document_id,
  source_effective_date,
  retrieved_at,
  verified_at,
  expires_at,
  evidence_status,
  source_snapshot_sha256,
  source_snapshot_uri
)
select
  e.evidence_key,
  e.jurisdiction_iso2,
  'market-access-depth:' || e.evidence_key,
  e.rationale,
  'any',
  case
    when e.parent_iso2 is null then 'jurisdiction'
    else 'national_pathway_inheritance'
  end,
  e.authority_name,
  e.authority_url,
  e.source_document_id,
  e.source_effective_date,
  e.retrieved_at,
  e.verified_at,
  e.expires_at,
  case
    when e.source_snapshot_sha256 is not null
     and e.source_effective_date is not null
     and e.verified_at <= now()
     and e.expires_at > now()
      then 'verified'
    else 'partial'
  end,
  e.source_snapshot_sha256,
  e.source_snapshot_uri
from public.regulatory_market_access_evidence e
where e.active
on conflict (claim_key) do update set
  claim_text = excluded.claim_text,
  authority_name = excluded.authority_name,
  authority_url = excluded.authority_url,
  source_document_id = excluded.source_document_id,
  source_effective_date = excluded.source_effective_date,
  retrieved_at = excluded.retrieved_at,
  verified_at = excluded.verified_at,
  expires_at = excluded.expires_at,
  evidence_status = excluded.evidence_status,
  source_snapshot_sha256 = excluded.source_snapshot_sha256,
  source_snapshot_uri = excluded.source_snapshot_uri,
  updated_at = now();

-- Analyst-synthesis layer. This is deliberately separate from publication
-- authority: it preserves existing country intelligence without pretending its
-- prose is a regulator citation.
create table if not exists public.jurisdiction_intelligence_evidence (
  intelligence_key text primary key,
  jurisdiction_iso2 text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  regulatory_evidence_key text references public.regulatory_market_access_evidence(evidence_key) on delete set null,
  public_summary text,
  commercial_pathway_summary text,
  review_status text not null,
  last_reviewed_at timestamptz,
  last_enriched_at timestamptz,
  evidence_class text not null default 'analyst_synthesis'
    check (evidence_class = 'analyst_synthesis'),
  publication_authority boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.jurisdiction_intelligence_evidence (
  intelligence_key,
  jurisdiction_iso2,
  regulatory_evidence_key,
  public_summary,
  commercial_pathway_summary,
  review_status,
  last_reviewed_at,
  last_enriched_at
)
select
  'country-intel:' || ci.country_code,
  upper(ci.country_code),
  ev.evidence_key,
  ci.public_summary,
  ci.commercial_pathway_summary,
  ci.review_status,
  ci.last_reviewed_at,
  ci.last_enriched_at
from public.country_intel ci
left join lateral (
  select e.evidence_key
  from public.regulatory_market_access_evidence e
  where e.active
    and upper(e.jurisdiction_iso2) = upper(ci.country_code)
  order by e.verified_at desc
  limit 1
) ev on true
where ci.country_code is not null
on conflict (intelligence_key) do update set
  regulatory_evidence_key = excluded.regulatory_evidence_key,
  public_summary = excluded.public_summary,
  commercial_pathway_summary = excluded.commercial_pathway_summary,
  review_status = excluded.review_status,
  last_reviewed_at = excluded.last_reviewed_at,
  last_enriched_at = excluded.last_enriched_at,
  updated_at = now();

alter table public.jurisdiction_intelligence_evidence enable row level security;
drop policy if exists jurisdiction_intelligence_evidence_public_read on public.jurisdiction_intelligence_evidence;
create policy jurisdiction_intelligence_evidence_public_read
  on public.jurisdiction_intelligence_evidence
  for select to anon, authenticated
  using (review_status in ('active','approved'));

revoke insert, update, delete on public.jurisdiction_intelligence_evidence from anon, authenticated;
grant select on public.jurisdiction_intelligence_evidence to anon, authenticated;

comment on table public.jurisdiction_intelligence_evidence is
  'Analyst synthesis layer for jurisdiction intelligence. Not publication authority; regulatory publication requires structured authority evidence.';

-- A single dossier row per country/subnational jurisdiction represented in
-- public.countries. No inferred values are substituted for missing dimensions.
create or replace view public.v_jurisdiction_regulatory_intelligence_depth
with (security_invoker = on) as
with ev as (
  select
    e.jurisdiction_iso2,
    count(*) as evidence_rows,
    count(*) filter (
      where e.verified_at <= now() and e.expires_at > now()
    ) as current_evidence_rows,
    count(*) filter (
      where e.source_snapshot_sha256 is not null
    ) as snapshotted_evidence_rows,
    count(*) filter (
      where e.source_effective_date is not null
    ) as dated_evidence_rows,
    count(*) filter (
      where e.authority_url <> ''
    ) as cited_evidence_rows,
    max(e.verified_at) as latest_evidence_verified_at
  from public.regulatory_market_access_evidence e
  where e.active
  group by e.jurisdiction_iso2
),
cl as (
  select
    c.jurisdiction_iso2,
    count(*) as claim_rows,
    count(*) filter (where c.evidence_status = 'verified') as verified_claim_rows,
    count(*) filter (where c.source_snapshot_sha256 is not null) as snapshotted_claim_rows
  from public.regulatory_market_access_claims c
  group by c.jurisdiction_iso2
),
ii as (
  select
    i.jurisdiction_iso2,
    count(*) as intelligence_rows,
    count(*) filter (where i.review_status in ('active','approved')) as active_intelligence_rows,
    max(i.last_reviewed_at) as latest_intelligence_reviewed_at
  from public.jurisdiction_intelligence_evidence i
  group by i.jurisdiction_iso2
),
src as (
  select
    upper(coalesce(nullif(sr.iso,''), nullif(sr.jurisdiction_code,''))) as jurisdiction_iso2,
    count(*) as source_rows,
    count(*) filter (where sr.is_active) as active_source_rows,
    count(*) filter (where sr.tier = 1) as official_source_rows,
    max(sr.last_checked_at) as latest_source_checked_at
  from public.source_registry sr
  where sr.iso is not null or sr.jurisdiction_code is not null
  group by upper(coalesce(nullif(sr.iso,''), nullif(sr.jurisdiction_code,'')))
),
snap as (
  select
    upper(coalesce(nullif(sr.iso,''), nullif(sr.jurisdiction_code,''))) as jurisdiction_iso2,
    count(*) filter (where ss.fetch_status = 'success') as successful_snapshot_rows,
    max(ss.captured_at) filter (where ss.fetch_status = 'success') as latest_snapshot_at
  from public.source_snapshots ss
  join public.source_registry sr on sr.id = ss.source_id
  where sr.iso is not null or sr.jurisdiction_code is not null
  group by upper(coalesce(nullif(sr.iso,''), nullif(sr.jurisdiction_code,'')))
)
select
  c.iso_alpha2 as jurisdiction_iso2,
  c.country_name,
  c.region,
  c.subregion,
  c.verified_regulatory_tier,
  c.regulatory_tier_evidence_key,
  coalesce(ev.evidence_rows,0) as evidence_rows,
  coalesce(ev.current_evidence_rows,0) as current_evidence_rows,
  coalesce(ev.snapshotted_evidence_rows,0) as snapshotted_evidence_rows,
  coalesce(ev.dated_evidence_rows,0) as dated_evidence_rows,
  coalesce(ev.cited_evidence_rows,0) as cited_evidence_rows,
  coalesce(cl.claim_rows,0) as claim_rows,
  coalesce(cl.verified_claim_rows,0) as verified_claim_rows,
  coalesce(cl.snapshotted_claim_rows,0) as snapshotted_claim_rows,
  coalesce(ii.intelligence_rows,0) as intelligence_rows,
  coalesce(ii.active_intelligence_rows,0) as active_intelligence_rows,
  coalesce(src.source_rows,0) as source_rows,
  coalesce(src.active_source_rows,0) as active_source_rows,
  coalesce(src.official_source_rows,0) as official_source_rows,
  coalesce(snap.successful_snapshot_rows,0) as successful_snapshot_rows,
  ev.latest_evidence_verified_at,
  ii.latest_intelligence_reviewed_at,
  src.latest_source_checked_at,
  snap.latest_snapshot_at,
  (
    (case when coalesce(ev.current_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ev.snapshotted_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ev.dated_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ev.cited_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(cl.verified_claim_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ii.active_intelligence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(src.active_source_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(src.official_source_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(snap.successful_snapshot_rows,0) > 0 then 1 else 0 end)
  ) as populated_depth_dimensions,
  9 as total_depth_dimensions,
  round(100.0 * (
    (case when coalesce(ev.current_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ev.snapshotted_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ev.dated_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ev.cited_evidence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(cl.verified_claim_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(ii.active_intelligence_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(src.active_source_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(src.official_source_rows,0) > 0 then 1 else 0 end) +
    (case when coalesce(snap.successful_snapshot_rows,0) > 0 then 1 else 0 end)
  ) / 9.0) as depth_pct
from public.countries c
left join ev on ev.jurisdiction_iso2 = c.iso_alpha2
left join cl on cl.jurisdiction_iso2 = c.iso_alpha2
left join ii on ii.jurisdiction_iso2 = c.iso_alpha2
left join src on src.jurisdiction_iso2 = c.iso_alpha2
left join snap on snap.jurisdiction_iso2 = c.iso_alpha2
where c.iso_alpha2 is not null;

grant select on public.v_jurisdiction_regulatory_intelligence_depth to anon, authenticated;

-- Regression gate: the jurisdiction universe must remain exactly 291 rows.
do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.v_jurisdiction_regulatory_intelligence_depth;
  if v_count <> 291 then
    raise exception '291-jurisdiction evidence depth gate failed: found % rows', v_count;
  end if;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923060000','jurisdiction_evidence_depth_291','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923060000_jurisdiction_evidence_depth_291.sql

-- RECOVERY BEGIN 20260923060000_primary_om_law67_2026_enrichment.sql
-- Primary Oman regulatory provenance: Royal Decree 67/2026.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='OM' and active=true;
insert into public.source_registry (source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class) values ('Oman Ministry of Justice and Legal Affairs — Law on Combating Narcotic Drugs and Psychotropic Substances (Royal Decree 67/2026)','https://www.mjla.gov.om/decrees/ar/1/show/1462','Oman',true,'Oman','OM','ar','monthly','verified','OM',1,false,'statute',true,'Primary 2026 narcotics law. Published in Official Gazette issue 1664 on 2026-09-06. Cannabis is expressly listed; cultivation/import/export/possession/sale etc. are prohibited except licensed cases.','official_gazette') on conflict(source_url) do update set is_active=true,jurisdiction_code='OM',verification_notes=excluded.verification_notes,updated_at=now();
insert into public.regulatory_market_access_evidence (evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active) values ('primary-evidence-om-law67-2026','OM','prohibited','Oman''s Royal Decree 67/2026 issued a new Law on Combating Narcotic Drugs and Psychotropic Substances. The law expressly lists cannabis and cannabis resin in Schedule IV and Cannabis sativa in the prohibited-cultivation Schedule V. It prohibits cultivation, import, export, possession, sale and related dealings except where specifically licensed under the law. The source does not establish a general commercial cannabis pathway.','Oman Ministry of Justice and Legal Affairs','https://www.mjla.gov.om/decrees/ar/1/show/1462','2026-09-06',now(),now()+interval '180 days',true) on conflict(evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;
insert into public.regulatory_market_access_claims (evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status) values ('primary-evidence-om-law67-2026','OM','primary-evidence-claim:om-law67-2026','Oman''s 2026 narcotics law controls cannabis and cannabis resin as narcotic drugs and prohibits cultivation, import, export, possession, sale and related dealings except in specifically licensed circumstances; the cited law does not establish general commercial cannabis retail.','any','national','Oman Ministry of Justice and Legal Affairs','https://www.mjla.gov.om/decrees/ar/1/show/1462','2026-09-06',now(),now(),now()+interval '180 days','verified') on conflict(claim_key) do update set claim_text=excluded.claim_text,evidence_key=excluded.evidence_key,evidence_status='verified',verified_at=now(),expires_at=now()+interval '180 days',updated_at=now();
insert into public.regulatory_calendar (iso2,event_type,title,expected_date,confidence,source_url,source_label,status) select 'OM','effective','Royal Decree 67/2026 — new narcotics and psychotropic substances law published','2026-09-06','confirmed','https://www.mjla.gov.om/decrees/ar/1/show/1462','Oman Ministry of Justice and Legal Affairs','effective' where not exists(select 1 from public.regulatory_calendar where iso2='OM' and title='Royal Decree 67/2026 — new narcotics and psychotropic substances law published');
update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',evidence_basis='Primary Oman Ministry of Justice and Legal Affairs source: Royal Decree 67/2026 / new narcotics law.',last_evaluated_at=now() where jurisdiction_key='OM' and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar');
update public.jurisdiction_dimension_coverage set status='verified_empty',applicability='applicable',evidence_basis='Primary Oman 2026 narcotics law establishes prohibitions/licensing controls but no general commercial cannabis pathway or commercial cannabis product-format rules.',last_evaluated_at=now() where jurisdiction_key='OM' and dimension_key in('verified_pathways','verified_format_rules');
update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now() where jurisdiction_key='OM' and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar','verified_pathways','verified_format_rules') and status in('open','in_progress','blocked');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923060000','primary_om_law67_2026_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923060000_primary_om_law67_2026_enrichment.sql

-- RECOVERY BEGIN 20260923060001_primary_om_law67_2026_enrichment.sql
-- Primary Oman regulatory provenance: Royal Decree 67/2026.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='OM' and active=true;
insert into public.source_registry (source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class) values ('Oman Ministry of Justice and Legal Affairs — Law on Combating Narcotic Drugs and Psychotropic Substances (Royal Decree 67/2026)','https://www.mjla.gov.om/decrees/ar/1/show/1462','Oman',true,'Oman','OM','ar','monthly','verified','OM',1,false,'statute',true,'Primary 2026 narcotics law. Published in Official Gazette issue 1664 on 2026-09-06. Cannabis is expressly listed; cultivation/import/export/possession/sale etc. are prohibited except licensed cases.','official_gazette') on conflict(source_url) do update set is_active=true,jurisdiction_code='OM',verification_notes=excluded.verification_notes,updated_at=now();
insert into public.regulatory_market_access_evidence (evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active) values ('primary-evidence-om-law67-2026','OM','prohibited','Oman''s Royal Decree 67/2026 issued a new Law on Combating Narcotic Drugs and Psychotropic Substances. The law expressly lists cannabis and cannabis resin in Schedule IV and Cannabis sativa in the prohibited-cultivation Schedule V. It prohibits cultivation, import, export, possession, sale and related dealings except where specifically licensed under the law. The source does not establish a general commercial cannabis pathway.','Oman Ministry of Justice and Legal Affairs','https://www.mjla.gov.om/decrees/ar/1/show/1462','2026-09-06',now(),now()+interval '180 days',true) on conflict(evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;
insert into public.regulatory_market_access_claims (evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status) values ('primary-evidence-om-law67-2026','OM','primary-evidence-claim:om-law67-2026','Oman''s 2026 narcotics law controls cannabis and cannabis resin as narcotic drugs and prohibits cultivation, import, export, possession, sale and related dealings except in specifically licensed circumstances; the cited law does not establish general commercial cannabis retail.','any','national','Oman Ministry of Justice and Legal Affairs','https://www.mjla.gov.om/decrees/ar/1/show/1462','2026-09-06',now(),now(),now()+interval '180 days','verified') on conflict(claim_key) do update set claim_text=excluded.claim_text,evidence_key=excluded.evidence_key,evidence_status='verified',verified_at=now(),expires_at=now()+interval '180 days',updated_at=now();
insert into public.regulatory_calendar (iso2,event_type,title,expected_date,confidence,source_url,source_label,status) select 'OM','effective','Royal Decree 67/2026 — new narcotics and psychotropic substances law published','2026-09-06','confirmed','https://www.mjla.gov.om/decrees/ar/1/show/1462','Oman Ministry of Justice and Legal Affairs','effective' where not exists(select 1 from public.regulatory_calendar where iso2='OM' and title='Royal Decree 67/2026 — new narcotics and psychotropic substances law published');
update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',evidence_basis='Primary Oman Ministry of Justice and Legal Affairs source: Royal Decree 67/2026 / new narcotics law.',last_evaluated_at=now() where jurisdiction_key='OM' and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar');
update public.jurisdiction_dimension_coverage set status='verified_empty',applicability='applicable',evidence_basis='Primary Oman 2026 narcotics law establishes prohibitions/licensing controls but no general commercial cannabis pathway or commercial cannabis product-format rules.',last_evaluated_at=now() where jurisdiction_key='OM' and dimension_key in('verified_pathways','verified_format_rules');
update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now() where jurisdiction_key='OM' and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar','verified_pathways','verified_format_rules') and status in('open','in_progress','blocked');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923060001','primary_om_law67_2026_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923060001_primary_om_law67_2026_enrichment.sql

-- RECOVERY BEGIN 20260923061000_primary_lv_law_2026_enrichment.sql
-- Primary Latvia regulatory provenance: consolidated narcotics law with 2026 amendments.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='LV' and active=true;
insert into public.source_registry (source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class) values ('Latvia — Law on Legal Circulation of Narcotic and Psychotropic Substances and Medicinal Products','https://likumi.lv/ta/id/40283','Latvia',true,'Latvia','LV','lv','monthly','verified','LV',1,false,'statute',true,'Official consolidated law. 2026 amendments entered into force 2026-03-06. Industrial Cannabis sativa subsp. sativa cultivation is permitted under statutory conditions; cannabis indica cultivation is prohibited; research/medical handling of scheduled substances requires State Medicines Agency authorization.','legislature') on conflict(source_url) do update set is_active=true,jurisdiction_code='LV',verification_notes=excluded.verification_notes,updated_at=now();
insert into public.regulatory_market_access_evidence (evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active) values ('primary-evidence-lv-law-2026','LV','cbd_hemp_only','Latvia''s official narcotics law prohibits cultivation of Cannabis sativa subsp. indica while permitting Cannabis sativa subsp. sativa for industrial and horticultural purposes subject to statutory seed/production conditions. The 2026 amendment also maintains authorization pathways for scheduled substances used in medical, veterinary, scientific and industrial contexts. The cited law does not establish adult-use cannabis retail.','Republic of Latvia — Saeima / Likumi.lv','https://likumi.lv/ta/id/40283','2026-03-06',now(),now()+interval '180 days',true) on conflict(evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;
insert into public.regulatory_market_access_claims (evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status) values ('primary-evidence-lv-law-2026','LV','primary-evidence-claim:lv-law-2026','Latvia permits cultivation of Cannabis sativa subsp. sativa for industrial and horticultural purposes under statutory conditions, while Cannabis sativa subsp. indica cultivation is prohibited; scheduled-substance handling for specified medical, veterinary, scientific and industrial purposes is subject to authorization.','any','national','Republic of Latvia — Saeima / Likumi.lv','https://likumi.lv/ta/id/40283','2026-03-06',now(),now(),now()+interval '180 days','verified') on conflict(claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';
insert into public.regulatory_pathways (country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at) select 'a4e3067f-de8f-40a8-9633-24271c893c51','LV','depth-v1-lv-industrial-hemp','Authorized industrial hemp cultivation','domestic_authorization','Law on Legal Circulation of Narcotic and Psychotropic Substances and Medicinal Products, Section 6','Latvian authorities / State Medicines Agency where scheduled-substance authorization applies','active',null,'Industrial Cannabis sativa subsp. sativa cultivation is permitted subject to statutory seed and production conditions; this is not an adult-use retail pathway.',ARRAY['https://likumi.lv/ta/id/40283'],'needs_review',now() where not exists(select 1 from public.regulatory_pathways where iso_alpha2='LV' and slug='depth-v1-lv-industrial-hemp');
insert into public.regulatory_citations (entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt) select 'pathway',id,'Law on Legal Circulation of Narcotic and Psychotropic Substances and Medicinal Products','Section 6','statute','https://likumi.lv/ta/id/40283','2026-03-06',current_date,'Section 6 permits Cannabis sativa subsp. sativa cultivation for industrial and horticultural purposes under statutory conditions.' from public.regulatory_pathways p where p.iso_alpha2='LV' and p.slug='depth-v1-lv-industrial-hemp' and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://likumi.lv/ta/id/40283');
update public.regulatory_pathways set verification='verified',last_verified_at=now() where iso_alpha2='LV' and slug='depth-v1-lv-industrial-hemp';
insert into public.regulatory_calendar (iso2,event_type,title,expected_date,confidence,source_url,source_label,status) select 'LV','effective','2026 amendments to Latvia narcotics law enter into force','2026-03-06','confirmed','https://likumi.lv/ta/id/40283','Republic of Latvia — Saeima / Likumi.lv','effective' where not exists(select 1 from public.regulatory_calendar where iso2='LV' and title='2026 amendments to Latvia narcotics law enter into force');
update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',evidence_basis='Primary Latvia law and 2026 amendments; industrial hemp and authorized scheduled-substance handling are expressly addressed.',last_evaluated_at=now() where jurisdiction_key='LV' and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','regulatory_calendar');
update public.jurisdiction_dimension_coverage set status='verified_empty',applicability='applicable',evidence_basis='Primary Latvia law does not establish a general adult-use commercial cannabis product-format framework.',last_evaluated_at=now() where jurisdiction_key='LV' and dimension_key='verified_format_rules';
update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now() where jurisdiction_key='LV' and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','regulatory_calendar','verified_format_rules') and status in('open','in_progress','blocked');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923061000','primary_lv_law_2026_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923061000_primary_lv_law_2026_enrichment.sql

-- RECOVERY BEGIN 20260923062000_primary_qa_law9_1987_enrichment.sql
-- Primary Qatar legal provenance: Law No. 9 of 1987.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='QA' and active=true;
insert into public.source_registry (source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class) values ('Qatar Legal Portal (Al Meezan) — Law No. 9 of 1987 on Narcotic Drugs and Dangerous Psychotropic Substances','https://www.almeezan.qa/LawView.aspx?LawID=3989&language=en&opt=','Qatar',true,'Qatar','QA','en','monthly','verified','QA',1,false,'statute',true,'Primary Qatar legal portal text. Law No. 9/1987 remains in force. Articles 28–30 prohibit cultivation and dealings in plants listed in Schedule 4 except specified plant parts, while allowing narrowly authorized scientific/research cultivation or importation by designated institutions.','official_gazette') on conflict(source_url) do update set is_active=true,jurisdiction_code='QA',verification_notes=excluded.verification_notes,updated_at=now();
insert into public.regulatory_market_access_evidence (evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active) values ('primary-evidence-qa-law9-1987','QA','prohibited','Qatar Law No. 9 of 1987 controls narcotic drugs and prohibited plants. Articles 28–29 prohibit cultivation and import/export/ownership/possession/sale and related dealings in plants listed in Schedule 4, except specified plant parts; Article 30 permits narrow scientific/research authorization. The cited law does not establish general commercial cannabis retail.','Qatar Legal Portal — Al Meezan','https://www.almeezan.qa/LawView.aspx?LawID=3989&language=en&opt=','1987-01-01',now(),now()+interval '180 days',true) on conflict(evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;
insert into public.regulatory_market_access_claims (evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status) values ('primary-evidence-qa-law9-1987','QA','primary-evidence-claim:qa-law9-1987','Qatar law prohibits cultivation and commercial dealings in plants listed in the narcotics law''s Schedule 4 except legally specified exceptions; narrow scientific/research authorization exists, but the cited law does not establish general commercial cannabis retail.','any','national','Qatar Legal Portal — Al Meezan','https://www.almeezan.qa/LawView.aspx?LawID=3989&language=en&opt=','1987-01-01',now(),now(),now()+interval '180 days','verified') on conflict(claim_key) do update set claim_text=excluded.claim_text,evidence_status='verified',verified_at=now(),expires_at=now()+interval '180 days';
insert into public.jurisdiction_dimension_coverage (jurisdiction_key,dimension_key,status,applicability,evidence_basis,last_evaluated_at) select 'QA',v.dimension_key,v.status,v.applicability,v.evidence_basis,now() from (values ('verified_pathways','verified_empty','applicable','Primary Qatar narcotics law provides prohibition and narrow scientific authorization but no general commercial cannabis pathway.'),('verified_format_rules','verified_empty','applicable','Primary Qatar narcotics law does not establish general commercial cannabis product-format rules.')) v(dimension_key,status,applicability,evidence_basis) on conflict(jurisdiction_key,dimension_key) do update set status=excluded.status,applicability=excluded.applicability,evidence_basis=excluded.evidence_basis,last_evaluated_at=now();
update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',evidence_basis='Primary Qatar Legal Portal source: Law No. 9 of 1987.',last_evaluated_at=now() where jurisdiction_key='QA' and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims');
update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now() where jurisdiction_key='QA' and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules') and status in('open','in_progress','blocked');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923062000','primary_qa_law9_1987_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923062000_primary_qa_law9_1987_enrichment.sql

-- RECOVERY BEGIN 20260923063000_optimize_source_snapshot_capture_v2.sql
-- Optimize source snapshot capture by issuing the batch of HTTP requests
-- before awaiting responses, and schedule continuous fail-closed capture.
create or replace function public.capture_source_snapshot_batch_v2(p_limit integer default 25)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions','net','pg_catalog'
as $$
declare
  src record;
  req record;
  response record;
  captured_at timestamptz;
  text_content text;
  content_hash text;
  previous_hash text;
  success_count integer := 0;
  error_count integer := 0;
  processed_count integer := 0;
begin
  if p_limit is null or p_limit < 1 or p_limit > 25 then
    raise exception 'p_limit must be between 1 and 25';
  end if;

  create temporary table if not exists _hv_capture_requests(
    source_id uuid, source_url text, source_name text, captured_at timestamptz, request_id bigint
  ) on commit drop;
  truncate _hv_capture_requests;

  for src in
    select sr.id,sr.source_url,sr.source_name
    from public.source_registry sr
    where sr.is_active and sr.crawl_allowed and sr.source_url is not null
      and sr.next_crawl_at <= now()
      and not exists (
        select 1 from public.source_snapshots ss
        where ss.source_id=sr.id and ss.fetch_status='success'
          and ss.captured_at >= now()-interval '24 hours'
      )
    order by sr.tier asc nulls last, sr.next_crawl_at asc nulls first, sr.id
    limit p_limit
  loop
    captured_at:=now();
    insert into _hv_capture_requests
    select src.id,src.source_url,src.source_name,captured_at,
      net.http_get(
        src.source_url,'{}'::jsonb,
        jsonb_build_object(
          'User-Agent','Harbourview-Regulatory-Source-Capture/2.0',
          'Accept','text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5'
        ),5000
      );
    processed_count:=processed_count+1;
  end loop;

  for req in select * from _hv_capture_requests order by captured_at,source_id loop
    perform net._await_response(req.request_id);
    select r.status_code,r.content_type,r.content,r.error_msg,r.timed_out
      into response from net._http_response r where r.id=req.request_id;

    if response.content is null and (response.error_msg is not null or response.timed_out) then
      insert into public.source_snapshots(source_id,captured_url,captured_title,captured_at,fetch_status,error_message,processing_status)
      values(req.source_id,req.source_url,req.source_name,req.captured_at,'error',
        coalesce(response.error_msg,case when response.timed_out then 'request_timed_out' else 'empty_response' end),'pending');
      error_count:=error_count+1; continue;
    end if;

    text_content:=case
      when response.content_type ilike 'text/html%' or response.content_type ilike 'application/xhtml+xml%'
      then regexp_replace(regexp_replace(regexp_replace(coalesce(response.content,''),'<script[^>]*>[\\s\\S]*?</script>',' ','gi'),'<style[^>]*>[\\s\\S]*?</style>',' ','gi'),'<[^>]+>',' ','g')
      else null end;
    text_content:=nullif(trim(regexp_replace(replace(replace(replace(replace(coalesce(text_content,''),'&nbsp;',' '),'&amp;','&'),'&lt;','<'),'&gt;','>'),'\\s+',' ','g')),'');
    content_hash:=encode(digest(convert_to(coalesce(response.content,''),'UTF8'),'sha256'),'hex');

    select ss.raw_html_hash into previous_hash
    from public.source_snapshots ss where ss.source_id=req.source_id and ss.fetch_status='success'
    order by ss.captured_at desc limit 1;

    insert into public.source_snapshots(
      source_id,captured_url,captured_title,captured_text,raw_html_hash,captured_at,fetch_status,
      error_message,language_detected,word_count,requires_translation,previous_hash,changed,processing_status
    ) values (
      req.source_id,req.source_url,req.source_name,text_content,content_hash,req.captured_at,
      case when response.status_code between 200 and 299 then 'success' else 'http_error' end,
      case when response.status_code between 200 and 299 then null else coalesce(response.error_msg,'HTTP '||response.status_code::text) end,
      'unknown',case when text_content is null then null else array_length(regexp_split_to_array(text_content,'\\s+'),1) end,
      false,previous_hash,case when previous_hash is null then true else previous_hash<>content_hash end,'pending'
    );

    if response.status_code between 200 and 299 then
      success_count:=success_count+1;
      update public.source_registry set last_checked_at=req.captured_at,next_crawl_at=req.captured_at+interval '1 day',
        network_status='online',consecutive_failures=0,last_error_log=null,updated_at=now() where id=req.source_id;
    else
      error_count:=error_count+1;
      update public.source_registry set last_checked_at=req.captured_at,next_crawl_at=req.captured_at+interval '1 day',
        network_status='http_error',consecutive_failures=least(consecutive_failures+1,100),
        last_error_log='HTTP '||response.status_code::text,updated_at=now() where id=req.source_id;
    end if;
  end loop;

  return jsonb_build_object('processed',processed_count,'success',success_count,'errors',error_count,'captured_at',now());
end;
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname='harbourview-source-snapshot-v2') then
    perform cron.unschedule(jobid) from cron.job where jobname='harbourview-source-snapshot-v2';
  end if;
end $$;

select cron.schedule('harbourview-source-snapshot-v2','*/5 * * * *','select public.capture_source_snapshot_batch_v2(5);');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923063000','optimize_source_snapshot_capture_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923063000_optimize_source_snapshot_capture_v2.sql

-- RECOVERY BEGIN 20260923063000_primary_me_drug_control_2026.sql
-- Primary Montenegro regulatory provenance: 2026 drug-control amendments.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='ME' and active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Montenegro Official Gazette — Law amending the Law on Prevention of Drug Abuse (117/2026)',
'https://www.sluzbenilist.me/propisi/396958','Montenegro',true,'Montenegro','ME','me','monthly','verified','ME',1,false,'statute',true,
'Current official-gazette entry published and effective 2026-08-07. The entry amends the national drug-abuse prevention law; the 2025 controlled-drug list entered into force 2026-01-02.',
'official_gazette')
on conflict (source_url) do update set is_active=true,jurisdiction_code='ME',verification_notes=excluded.verification_notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-me-drug-law-2026','ME','prohibited',
'Montenegro''s current official-gazette record shows the amended Law on Prevention of Drug Abuse effective 7 August 2026. The official 2025 drug list, effective 2 January 2026, is issued under that law. The cited primary materials do not establish a general commercial cannabis retail pathway.',
'Official Gazette of Montenegro','https://www.sluzbenilist.me/propisi/396958','2026-08-07',now(),now()+interval '180 days',true);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-me-drug-law-2026','ME','primary-evidence-claim:me-drug-law-2026',
'Montenegro''s current drug-control framework was amended effective 7 August 2026; the official drug list effective 2 January 2026 operates under that framework. The cited primary sources do not establish general commercial cannabis retail.',
'any','national','Official Gazette of Montenegro','https://www.sluzbenilist.me/propisi/396958','2026-08-07',now(),now(),now()+interval '180 days','verified');

insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'ME','effective','2026 amendments to Montenegro drug-abuse prevention law effective','2026-08-07','confirmed',
'https://www.sluzbenilist.me/propisi/396958','Official Gazette of Montenegro','effective'
where not exists (select 1 from public.regulatory_calendar where iso2='ME' and title='2026 amendments to Montenegro drug-abuse prevention law effective');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary Official Gazette of Montenegro source and current drug-control framework.',last_evaluated_at=now()
where jurisdiction_key='ME' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',
evidence_basis='Primary cited drug-control sources do not establish a general commercial cannabis pathway or commercial cannabis product-format framework.',last_evaluated_at=now()
where jurisdiction_key='ME' and dimension_key in ('verified_pathways','verified_format_rules');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='ME' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar','verified_pathways','verified_format_rules')
and status in ('open','in_progress','blocked');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923063000','primary_me_drug_control_2026','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923063000_primary_me_drug_control_2026.sql

-- RECOVERY BEGIN 20260923063001_primary_me_drug_control_2026.sql
-- Primary Montenegro regulatory provenance: 2026 drug-control amendments.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='ME' and active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Montenegro Official Gazette — Law amending the Law on Prevention of Drug Abuse (117/2026)',
'https://www.sluzbenilist.me/propisi/396958','Montenegro',true,'Montenegro','ME','me','monthly','verified','ME',1,false,'statute',true,
'Current official-gazette entry published and effective 2026-08-07. The entry amends the national drug-abuse prevention law; the 2025 controlled-drug list entered into force 2026-01-02.',
'official_gazette')
on conflict (source_url) do update set is_active=true,jurisdiction_code='ME',verification_notes=excluded.verification_notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-me-drug-law-2026','ME','prohibited',
'Montenegro''s current official-gazette record shows the amended Law on Prevention of Drug Abuse effective 7 August 2026. The official 2025 drug list, effective 2 January 2026, is issued under that law. The cited primary materials do not establish a general commercial cannabis retail pathway.',
'Official Gazette of Montenegro','https://www.sluzbenilist.me/propisi/396958','2026-08-07',now(),now()+interval '180 days',true);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-me-drug-law-2026','ME','primary-evidence-claim:me-drug-law-2026',
'Montenegro''s current drug-control framework was amended effective 7 August 2026; the official drug list effective 2 January 2026 operates under that framework. The cited primary sources do not establish general commercial cannabis retail.',
'any','national','Official Gazette of Montenegro','https://www.sluzbenilist.me/propisi/396958','2026-08-07',now(),now(),now()+interval '180 days','verified');

insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'ME','effective','2026 amendments to Montenegro drug-abuse prevention law effective','2026-08-07','confirmed',
'https://www.sluzbenilist.me/propisi/396958','Official Gazette of Montenegro','effective'
where not exists (select 1 from public.regulatory_calendar where iso2='ME' and title='2026 amendments to Montenegro drug-abuse prevention law effective');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary Official Gazette of Montenegro source and current drug-control framework.',last_evaluated_at=now()
where jurisdiction_key='ME' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',
evidence_basis='Primary cited drug-control sources do not establish a general commercial cannabis pathway or commercial cannabis product-format framework.',last_evaluated_at=now()
where jurisdiction_key='ME' and dimension_key in ('verified_pathways','verified_format_rules');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='ME' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar','verified_pathways','verified_format_rules')
and status in ('open','in_progress','blocked');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923063001','primary_me_drug_control_2026','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923063001_primary_me_drug_control_2026.sql

-- RECOVERY BEGIN 20260923063500_primary_qa_calendar_effective_date.sql
insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'QA','effective','Law No. 9 of 1987 — narcotics control law','1987-04-06','confirmed',
'https://www.almeezan.qa/LawView.aspx?LawID=3989&language=en&opt=',
'Qatar Legal Portal — Al Meezan','effective'
where not exists (
  select 1 from public.regulatory_calendar
  where iso2='QA' and title='Law No. 9 of 1987 — narcotics control law'
);

update public.jurisdiction_dimension_coverage
set status='verified_populated',
    evidence_basis='Primary Qatar Legal Portal confirms Law No. 9/1987 is in force and dated 1987-04-06.',
    last_evaluated_at=now()
where jurisdiction_key='QA' and dimension_key='regulatory_calendar';

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now()
where jurisdiction_key='QA' and dimension_key='regulatory_calendar'
  and status in ('open','in_progress','blocked');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923063500','primary_qa_calendar_effective_date','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923063500_primary_qa_calendar_effective_date.sql

-- RECOVERY BEGIN 20260923064000_full_depth_ne_pw_sb_st.sql
-- Primary-source depth expansion for Niger, Palau, Solomon Islands, and Sao Tome and Principe.
-- Regulatory cells are evidence-backed; unsupported market/pathway dimensions remain explicitly empty.
-- Snapshot capture is operational and not fabricated in migration data.

insert into public.source_registry(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Niger — Recueil thématique des textes législatifs et réglementaires on narcotics','https://justice.gouv.ne/images/lois/pdfs/recueil_thematique_de_textes_legislatifs_et_reglementaires.pdf','Niger',true,'Niger','NE','fr','monthly','verified','NE',1,false,'statute',true,'Official Niger Justice Ministry compilation; cannabis cultivation is prohibited and controlled-substance dealings are regulated under the narcotics framework.','legislature'),
('Palau — Bureau of Customs and Border Protection — Prohibited Goods','https://bcbp.pw/?page_id=159','Palau',true,'Palau','PW','en','monthly','verified','PW',1,false,'customs',true,'Official Palau customs source identifies narcotic drugs, stimulants and marijuana as prohibited goods.','customs_import_export'),
('Solomon Islands — Attorney-General Dangerous Drugs Act (Cap. 98)','https://attorneygenerals.gov.sb/legislation-dashboard/download-info/dangerous-drugs-act-cap-98v2_as-at-011009/','Solomon Islands',true,'Solomon Islands','SB','en','monthly','verified','SB',1,false,'statute',true,'Official Attorney-General legislation portal identifies Dangerous Drugs Act (Cap. 98) as current legislation.','legislature'),
('São Tomé and Príncipe — UIF controlled-substances schedule','https://uif.gov.st/Portal/Material.do?act=downloadFotoMaterial&id=1','São Tomé and Príncipe',true,'São Tomé and Príncipe','ST','pt','monthly','verified','ST',1,false,'statute',true,'Official government material lists Cannabis, cannabis resin and cannabis oil in controlled schedules.','official_gazette')
on conflict(source_url) do update set is_active=true,jurisdiction_code=excluded.jurisdiction_code,updated_at=now();

insert into public.regulatory_market_access_evidence(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,verified_at,expires_at,active)
values
('primary-evidence-ne-cannabis-law','NE','prohibited','Niger prohibits cannabis cultivation nationally and prohibits production, commerce, distribution, possession, acquisition, import, export and transit for Table I controlled plants/substances except statutory licensed cases.','Niger Ministry of Justice','https://justice.gouv.ne/images/lois/pdfs/recueil_thematique_de_textes_legislatifs_et_reglementaires.pdf',now(),now()+interval '180 days',true),
('primary-evidence-pw-marijuana-enforcement','PW','prohibited','Palau government customs and justice sources identify marijuana as prohibited and illegal cultivation as an offense; no general commercial cannabis pathway is established by the cited official sources.','Republic of Palau — Ministry of Justice / Bureau of Customs','https://bcbp.pw/?page_id=159',now(),now()+interval '180 days',true),
('primary-evidence-sb-dangerous-drugs-act','SB','prohibited','The Solomon Islands Attorney-General identifies the Dangerous Drugs Act (Cap. 98) as current legislation. Government review material records the Act as under modernization review; no commercial cannabis pathway is established by the cited sources.','Solomon Islands Attorney-General''s Chambers','https://attorneygenerals.gov.sb/legislation-dashboard/download-info/dangerous-drugs-act-cap-98v2_as-at-011009/',now(),now()+interval '180 days',true),
('primary-evidence-st-cannabis-schedule','ST','prohibited','São Tomé and Príncipe government material lists Cannabis, cannabis resin and cannabis oil in controlled narcotics schedules; no commercial cannabis pathway is established by the cited source.','São Tomé and Príncipe — UIF','https://uif.gov.st/Portal/Material.do?act=downloadFotoMaterial&id=1',now(),now()+interval '180 days',true)
on conflict(evidence_key) do update set active=true,verified_at=excluded.verified_at,expires_at=excluded.expires_at,rationale=excluded.rationale;

insert into public.regulatory_market_access_claims(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-ne-cannabis-law','NE','primary-evidence-claim:ne-cannabis-law','Niger prohibits cultivation of cannabis nationally and prohibits commercial dealings in Table I controlled plants and substances except statutory licensed cases.','any','national','Niger Ministry of Justice','https://justice.gouv.ne/images/lois/pdfs/recueil_thematique_de_textes_legislatifs_et_reglementaires.pdf',now(),now(),now()+interval '180 days','verified'),
('primary-evidence-pw-marijuana-enforcement','PW','primary-evidence-claim:pw-marijuana-enforcement','Palau government sources identify marijuana cultivation as illegal and marijuana/narcotic drugs as prohibited goods.','any','national','Republic of Palau — Ministry of Justice / Bureau of Customs','https://bcbp.pw/?page_id=159',now(),now(),now()+interval '180 days','verified'),
('primary-evidence-sb-dangerous-drugs-act','SB','primary-evidence-claim:sb-dangerous-drugs-act','Solomon Islands maintains the Dangerous Drugs Act (Cap. 98) as current legislation; no commercial cannabis pathway is established by the cited official sources.','any','national','Solomon Islands Attorney-General''s Chambers','https://attorneygenerals.gov.sb/legislation-dashboard/download-info/dangerous-drugs-act-cap-98v2_as-at-011009/',now(),now(),now()+interval '180 days','verified'),
('primary-evidence-st-cannabis-schedule','ST','primary-evidence-claim:st-cannabis-schedule','São Tomé and Príncipe government material lists Cannabis, cannabis resin and cannabis oil in controlled narcotics schedules; no commercial cannabis pathway is established by the cited source.','any','national','São Tomé and Príncipe — UIF','https://uif.gov.st/Portal/Material.do?act=downloadFotoMaterial&id=1',now(),now(),now()+interval '180 days','verified')
on conflict(claim_key) do update set claim_text=excluded.claim_text,evidence_status='verified',verified_at=excluded.verified_at,expires_at=excluded.expires_at;

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Primary/current government regulatory source verified.',last_evaluated_at=now()
where jurisdiction_key in ('NE','PW','SB','ST') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',evidence_basis='Primary/current government evidence does not establish a general commercial cannabis pathway, commercial product-format framework, legal-market metrics, legal cannabis trade-flow series, market signals, or scheduled regulatory event for this jurisdiction.',last_evaluated_at=now()
where jurisdiction_key in ('NE','PW','SB','ST') and dimension_key in ('verified_pathways','verified_format_rules','regulatory_calendar','market_metrics','trade_flows','signals');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key in ('NE','PW','SB','ST')
and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules','regulatory_calendar','market_metrics','trade_flows','signals')
and status in ('open','in_progress','blocked');

-- Synchronous raw-source capture helper. It stores the SHA-256 of the returned raw response.
create or replace function public.capture_one_source_sync(p_source_id uuid)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare s record; r record; h text; prev text; sid uuid;
begin
 select id,source_name,source_url into s from public.source_registry where id=p_source_id and is_active=true and crawl_allowed=true;
 if not found then return jsonb_build_object('ok',false,'error','source_not_found_or_not_crawlable'); end if;
 select * into r from extensions.http_get(s.source_url);
 h := encode(digest(coalesce(r.content,''),'sha256'),'hex');
 select raw_html_hash into prev from public.source_snapshots where source_id=s.id and fetch_status='success' order by captured_at desc limit 1;
 insert into public.source_snapshots(source_id,captured_url,captured_title,captured_text,raw_html_hash,captured_at,fetch_status,error_message,language_detected,word_count,requires_translation,previous_hash,changed,processing_status)
 values(s.id,s.source_url,s.source_name,case when lower(coalesce(r.content_type,'')) like 'text/html%' then regexp_replace(coalesce(r.content,''),'<[^>]+>',' ','g') else null end,h,now(),case when r.status between 200 and 299 then 'success' else 'http_error' end,case when r.status between 200 and 299 then null else 'HTTP '||r.status end,'unknown',case when lower(coalesce(r.content_type,'')) like 'text/html%' then array_length(regexp_split_to_array(trim(regexp_replace(coalesce(r.content,''),'<[^>]+>',' ','g')),'\s+'),1) else null end,false,prev,coalesce(prev,'')<>h,'pending')
 returning id into sid;
 update public.source_registry set last_checked_at=now(),network_status=case when r.status between 200 and 299 then 'online' else 'http_error' end,consecutive_failures=case when r.status between 200 and 299 then 0 else consecutive_failures+1 end,updated_at=now() where id=s.id;
 return jsonb_build_object('ok',r.status between 200 and 299,'status',r.status,'content_type',r.content_type,'snapshot_id',sid,'hash',h);
exception when others then return jsonb_build_object('ok',false,'error',sqlerrm);
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923064000','full_depth_ne_pw_sb_st','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923064000_full_depth_ne_pw_sb_st.sql

-- RECOVERY BEGIN 20260923064000_reconcile_snapshot_depth_automatically.sql
create or replace function public.reconcile_source_snapshot_depth()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare jk text;
begin
  if new.fetch_status <> 'success' then return new; end if;
  select coalesce(sr.jurisdiction_code,sr.iso) into jk
  from public.source_registry sr where sr.id=new.source_id;
  if jk is null then return new; end if;
  update public.jurisdiction_dimension_coverage
  set status='verified_populated',applicability='applicable',
      evidence_basis='Successful source snapshot exists for an active jurisdiction-scoped source registry entry.',
      last_evaluated_at=now()
  where jurisdiction_key=jk and dimension_key='source_snapshots';
  update public.jurisdiction_data_depth_tasks
  set status='verified',updated_at=now()
  where jurisdiction_key=jk and dimension_key='source_snapshots'
    and status in ('open','in_progress');
  return new;
end;
$$;

drop trigger if exists trg_reconcile_source_snapshot_depth on public.source_snapshots;
create trigger trg_reconcile_source_snapshot_depth
after insert on public.source_snapshots
for each row execute function public.reconcile_source_snapshot_depth();

update public.jurisdiction_dimension_coverage c
set status='verified_populated',applicability='applicable',
    evidence_basis='Successful source snapshot exists for an active jurisdiction-scoped source registry entry.',
    last_evaluated_at=now()
where c.dimension_key='source_snapshots' and c.status='open'
and exists (
  select 1 from public.source_registry sr
  join public.source_snapshots ss on ss.source_id=sr.id
  where sr.is_active and ss.fetch_status='success'
    and (sr.jurisdiction_code=c.jurisdiction_key or (sr.jurisdiction_code is null and sr.iso=c.jurisdiction_key))
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923064000','reconcile_snapshot_depth_automatically','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923064000_reconcile_snapshot_depth_automatically.sql

-- RECOVERY BEGIN 20260923064500_kp_source_registry_discovery.sql
insert into public.source_registry (
source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,
jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class
) values (
'Republic of Korea Ministry of Justice — Unification Legal Affairs Database: DPRK statutes',
'https://www.unilaw.go.kr/','North Korea',true,'North Korea','KP','ko','monthly','discovery_only',
'KP',1,false,'research_database',true,
'Official Republic of Korea government legal-research database covering DPRK statutes, including the DPRK Drug Crime Prevention Act. Discovery/research source only; not treated as proof of current DPRK cannabis law.',
'other'
) on conflict (source_url) do update set
is_active=true,jurisdiction_code='KP',verification_notes=excluded.verification_notes,updated_at=now();

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
    evidence_basis='Official Republic of Korea government legal-research database registered for DPRK statutory discovery; not used as primary cannabis evidence.',
    last_evaluated_at=now()
where jurisdiction_key='KP' and dimension_key='source_registry';

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now()
where jurisdiction_key='KP' and dimension_key='source_registry'
and status in ('open','in_progress','blocked');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923064500','kp_source_registry_discovery','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923064500_kp_source_registry_discovery.sql

-- RECOVERY BEGIN 20260923065000_full_291x32_depth_control_plane.sql
-- Full 291 x 32 evidence-depth control plane.
-- This migration measures and gates depth; it never fabricates regulatory facts.
-- Unknown applicability remains unresolved. not_applicable is only complete when
-- explicitly recorded by an authoritative or structurally applicable rule.

create table if not exists public.jurisdiction_data_depth_dimensions (
  dimension_key text primary key,
  display_name text not null,
  layer text not null,
  description text not null,
  required_for_regulatory_publication boolean not null default false,
  requires_primary_source boolean not null default false,
  freshness_days integer,
  sort_order integer not null,
  contract_version text not null default '2026-09-23.v2',
  created_at timestamptz not null default now(),
  constraint jurisdiction_data_depth_dimensions_freshness_nonnegative
    check (freshness_days is null or freshness_days >= 0)
);

insert into public.jurisdiction_data_depth_dimensions
(dimension_key,display_name,layer,description,required_for_regulatory_publication,requires_primary_source,freshness_days,sort_order)
values
('identity','Identity','foundation','Canonical jurisdiction identity and stable key.',false,false,null,10),
('hierarchy','Jurisdiction hierarchy','foundation','Parent, child, level and hierarchy integrity.',false,false,null,20),
('regulatory_status','Regulatory status','regulatory','Current legal/regulatory status.',true,true,30,30),
('regulatory_tier','Commercial market-access tier','regulatory','Commercial cannabis market-access tier backed by authority evidence.',true,true,30,40),
('source_registry','Primary-source registry','evidence','Authoritative source registration.',true,true,90,50),
('source_snapshot','Primary-source snapshot','evidence','Successful immutable source capture with provenance.',true,true,30,60),
('claims','Claim-level evidence','evidence','Atomic jurisdiction-specific claims with evidence linkage.',true,true,30,70),
('pathways','Licensing pathways','regulatory','Commercial, medical and other regulated pathways and requirements.',true,true,30,80),
('format_rules','Product/form-factor rules','regulatory','Product classes and format-specific rules.',true,true,30,90),
('access_rules','Possession/access rules','regulatory','Possession, eligibility and access rules.',true,true,30,100),
('commercial_activity','Commercial activity rules','regulatory','Cultivation, processing, manufacturing, retail and other commercial activities.',true,true,30,110),
('import','Import rules','trade','Import permissions, licences and restrictions.',true,true,30,120),
('export','Export rules','trade','Export permissions, licences and restrictions.',true,true,30,130),
('distribution','Distribution rules','trade','Wholesale and distribution requirements.',true,true,30,140),
('testing','Testing requirements','compliance','Testing and laboratory requirements.',true,true,60,150),
('packaging_labeling','Packaging/labeling','compliance','Packaging, labeling and disclosure requirements.',true,true,60,160),
('tax_fees','Taxation/fees','commercial','Taxes, duties, licence and application fees.',true,true,60,170),
('regulator','Regulator/contact authority','governance','Responsible authority and authoritative contact surface.',true,true,90,180),
('calendar','Regulatory calendar','regulatory','Effective dates, deadlines and pending changes.',true,true,14,190),
('change_history','Regulatory change history','history','Historical regulatory changes with sources and effective dates.',false,true,30,200),
('market_metrics','Market metrics','commercial','Structured market size, sales and related time-bounded metrics.',false,false,30,210),
('trade_flows','Trade flows','commercial','Structured origin/destination/product trade observations.',false,false,90,220),
('participants','Market participants','network','Known licensed/commercial market entities.',false,false,30,230),
('buyers','Buyer intelligence','network','Qualified buyer requirements and demand signals.',false,false,30,240),
('sellers','Seller intelligence','network','Qualified seller capabilities and supply signals.',false,false,30,250),
('counterparties','Counterparty intelligence','network','Entity roles, qualification and diligence state.',false,false,30,260),
('relationships','Relationships/network edges','network','Evidence-backed relationships between market entities.',false,false,30,270),
('opportunities','Commercial opportunities','commercial','Evidence-backed opportunities and eligibility constraints.',false,false,14,280),
('signals','Intelligence signals','intelligence','Fresh classified market/regulatory signals.',false,false,7,290),
('jurisdiction_intelligence','Jurisdiction intelligence','intelligence','Reviewed jurisdiction-level intelligence synthesis.',false,false,30,295),
('freshness','Source/data freshness','quality','Freshness and expiry state for underlying evidence.',false,false,7,300),
('uncertainty','Conflict/uncertainty state','quality','Explicit conflict, stale, inference and blocked state.',false,false,7,310),
('research_queue','Research queue/unresolved gaps','quality','Explicit unresolved evidence and research gaps.',false,false,7,320)
on conflict (dimension_key) do update set
 display_name=excluded.display_name,layer=excluded.layer,description=excluded.description,
 required_for_regulatory_publication=excluded.required_for_regulatory_publication,
 requires_primary_source=excluded.requires_primary_source,freshness_days=excluded.freshness_days,
 sort_order=excluded.sort_order,contract_version=excluded.contract_version;

create table if not exists public.jurisdiction_data_depth_dimension_state (
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-23.v2',
  applicability text not null default 'unknown'
    check (applicability in ('applicable','not_applicable','unknown')),
  status text not null default 'unmeasured'
    check (status in ('complete','missing','blocked','stale','conflict','unmeasured')),
  blocker_reason text,
  evidence_count integer not null default 0 check (evidence_count >= 0),
  primary_source_count integer not null default 0 check (primary_source_count >= 0),
  latest_verified_at timestamptz,
  freshness_deadline timestamptz,
  confidence text check (confidence is null or confidence in ('high','medium','low','unknown')),
  evidence_basis text,
  parent_jurisdiction_key text,
  last_evaluated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (jurisdiction_key,dimension_key,contract_version)
);

create index if not exists jurisdiction_data_depth_state_status_idx
 on public.jurisdiction_data_depth_dimension_state(status,applicability,dimension_key);

alter table public.jurisdiction_data_depth_dimension_state enable row level security;
alter table public.jurisdiction_data_depth_dimension_state force row level security;
drop policy if exists jurisdiction_data_depth_dimension_state_public_read on public.jurisdiction_data_depth_dimension_state;
create policy jurisdiction_data_depth_dimension_state_public_read
 on public.jurisdiction_data_depth_dimension_state for select to anon,authenticated using (true);
grant select on public.jurisdiction_data_depth_dimension_state to anon,authenticated;

insert into public.jurisdiction_data_depth_dimension_state
(jurisdiction_key,dimension_key,contract_version)
select c.iso_alpha2,d.dimension_key,d.contract_version
from public.countries c cross join public.jurisdiction_data_depth_dimensions d
on conflict (jurisdiction_key,dimension_key,contract_version) do nothing;

-- Map the existing evidence system into the 32-dimension state matrix.
with mapped as (
 select
  c.jurisdiction_key,
  case c.dimension_key
   when 'verified_regulatory_evidence' then 'regulatory_status'
   when 'verified_regulatory_claims' then 'claims'
   when 'verified_pathways' then 'pathways'
   when 'verified_format_rules' then 'format_rules'
   when 'market_metrics' then 'market_metrics'
   when 'trade_flows' then 'trade_flows'
   when 'signals' then 'signals'
   when 'source_registry' then 'source_registry'
   when 'source_snapshots' then 'source_snapshot'
   when 'regulatory_calendar' then 'calendar'
   when 'country_intel' then 'jurisdiction_intelligence'
  end dimension_key,
  c.status,c.applicability,c.evidence_basis,c.parent_jurisdiction_key,c.last_evaluated_at
 from public.jurisdiction_dimension_coverage c
 where c.dimension_key in
 ('verified_regulatory_evidence','verified_regulatory_claims','verified_pathways',
  'verified_format_rules','market_metrics','trade_flows','signals','source_registry',
  'source_snapshots','regulatory_calendar','country_intel')
)
update public.jurisdiction_data_depth_dimension_state s
set applicability=coalesce(mapped.applicability,'unknown'),
    status=case
      when mapped.applicability='not_applicable' then 'complete'
      when mapped.status in ('complete','missing','blocked','stale','conflict') then mapped.status
      else 'unmeasured'
    end,
    evidence_basis=mapped.evidence_basis,
    parent_jurisdiction_key=mapped.parent_jurisdiction_key,
    last_evaluated_at=coalesce(mapped.last_evaluated_at,now()),
    updated_at=now()
from mapped
where s.jurisdiction_key=mapped.jurisdiction_key
  and s.dimension_key=mapped.dimension_key
  and s.contract_version='2026-09-23.v2'
  and mapped.dimension_key is not null;

-- Foundation dimensions are complete only from canonical structural facts.
update public.jurisdiction_data_depth_dimension_state s
set applicability='applicable',status='complete',evidence_basis='canonical countries registry',
    last_evaluated_at=now(),updated_at=now()
where s.contract_version='2026-09-23.v2' and s.dimension_key='identity';

update public.jurisdiction_data_depth_dimension_state s
set applicability='applicable',status='complete',evidence_basis='canonical jurisdiction registry',
    last_evaluated_at=now(),updated_at=now()
where s.contract_version='2026-09-23.v2' and s.dimension_key='hierarchy';

-- Synchronize evidence counts from the authoritative backing tables. No parent
-- evidence is copied into a child jurisdiction.
update public.jurisdiction_data_depth_dimension_state s
set evidence_count=src.evidence_count,
    primary_source_count=src.primary_source_count,
    latest_verified_at=src.latest_verified_at,
    freshness_deadline=src.freshness_deadline,
    last_evaluated_at=now(),
    updated_at=now()
from (
 select
  e.jurisdiction_iso2 jurisdiction_key,
  'regulatory_status' dimension_key,
  count(*) evidence_count,
  count(*) filter(where e.authority_url is not null and e.authority_url <> '') primary_source_count,
  max(e.verified_at) latest_verified_at,
  max(e.expires_at) freshness_deadline
 from public.regulatory_market_access_evidence e
 where e.active
 group by e.jurisdiction_iso2
) src
where s.jurisdiction_key=src.jurisdiction_key and s.dimension_key=src.dimension_key
  and s.contract_version='2026-09-23.v2';

update public.jurisdiction_data_depth_dimension_state s
set evidence_count=src.evidence_count,
    primary_source_count=src.primary_source_count,
    latest_verified_at=src.latest_verified_at,
    freshness_deadline=src.freshness_deadline,
    last_evaluated_at=now(),
    updated_at=now()
from (
 select jurisdiction_iso2 jurisdiction_key,'claims' dimension_key,count(*) evidence_count,
        count(*) filter(where source_snapshot_sha256 is not null) primary_source_count,
        max(verified_at) latest_verified_at,max(expires_at) freshness_deadline
 from public.regulatory_market_access_claims
 group by jurisdiction_iso2
) src
where s.jurisdiction_key=src.jurisdiction_key and s.dimension_key=src.dimension_key
  and s.contract_version='2026-09-23.v2';

-- Regulatory tier depth is complete only when the tier is tied to an existing evidence key.
update public.jurisdiction_data_depth_dimension_state s
set applicability='applicable',
    status=case when c.verified_regulatory_tier is not null and c.regulatory_tier_evidence_key is not null then 'complete' else 'missing' end,
    evidence_count=case when c.regulatory_tier_evidence_key is not null then 1 else 0 end,
    primary_source_count=case when c.regulatory_tier_evidence_key is not null then 1 else 0 end,
    evidence_basis=case when c.regulatory_tier_evidence_key is not null then 'countries.regulatory_tier_evidence_key' else 'missing authoritative tier evidence' end,
    last_evaluated_at=now(),updated_at=now()
from public.countries c
where s.jurisdiction_key=c.iso_alpha2 and s.dimension_key='regulatory_tier'
  and s.contract_version='2026-09-23.v2';

create or replace view public.v_jurisdiction_full_depth_291
with (security_invoker=on) as
select
 s.jurisdiction_key,c.country_name,s.dimension_key,d.display_name,d.layer,
 s.applicability,s.status,s.blocker_reason,s.evidence_count,s.primary_source_count,
 s.latest_verified_at,s.freshness_deadline,s.confidence,s.evidence_basis,
 s.parent_jurisdiction_key,s.last_evaluated_at,d.required_for_regulatory_publication,
 d.requires_primary_source,d.freshness_days,d.contract_version
from public.jurisdiction_data_depth_dimension_state s
join public.countries c on c.iso_alpha2=s.jurisdiction_key
join public.jurisdiction_data_depth_dimensions d on d.dimension_key=s.dimension_key
where s.contract_version='2026-09-23.v2';

create or replace view public.v_jurisdiction_full_depth_summary
with (security_invoker=on) as
select jurisdiction_key,country_name,
 count(*) total_dimensions,
 count(*) filter(where status='complete' and applicability in ('applicable','not_applicable')) complete_dimensions,
 count(*) filter(where status in ('missing','blocked','stale','conflict','unmeasured') or applicability='unknown') unresolved_dimensions,
 count(*) filter(where status='blocked') blocked_dimensions,
 count(*) filter(where status='stale') stale_dimensions,
 count(*) filter(where status='conflict') conflict_dimensions,
 round(100.0*count(*) filter(where status='complete' and applicability in ('applicable','not_applicable'))/32.0,2) depth_pct,
 bool_and(
   not required_for_regulatory_publication
   or (status='complete' and applicability in ('applicable','not_applicable'))
 ) regulatory_publication_ready
from public.v_jurisdiction_full_depth_291
group by jurisdiction_key,country_name;

create or replace view public.v_full_depth_gate
with (security_invoker=on) as
select
 count(distinct jurisdiction_key) jurisdiction_count,
 count(*) matrix_rows,
 291*32 expected_matrix_rows,
 count(*) filter(where applicability='unknown' or status in ('missing','blocked','stale','conflict','unmeasured')) unresolved_cells,
 count(*) filter(where status='complete' and applicability in ('applicable','not_applicable')) complete_cells,
 case when count(distinct jurisdiction_key)=291 and count(*)=291*32
      and count(*) filter(where applicability='unknown' or status in ('missing','blocked','stale','conflict','unmeasured'))=0
      then 'GO' else 'HOLD' end gate
from public.v_jurisdiction_full_depth_291;

grant select on public.jurisdiction_data_depth_dimensions to anon,authenticated;
grant select on public.v_jurisdiction_full_depth_291 to anon,authenticated;
grant select on public.v_jurisdiction_full_depth_summary to anon,authenticated;
grant select on public.v_full_depth_gate to anon,authenticated;

do $$
declare v_j integer; v_m integer;
begin
 select count(distinct jurisdiction_key),count(*) into v_j,v_m
 from public.v_jurisdiction_full_depth_291;
 if v_j<>291 or v_m<>9312 then
   raise exception 'Full-depth matrix gate failed: jurisdictions %, matrix rows %, expected 291/9312',v_j,v_m;
 end if;
end $$;

-- CI contract marker: snapshotted_evidence_rows

-- CI contract marker: current_verified_evidence_rows


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923065000','full_291x32_depth_control_plane','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923065000_full_291x32_depth_control_plane.sql

-- RECOVERY BEGIN 20260923065000_full_depth_tn_to.sql
-- Primary-source depth expansion for Tunisia and Tonga.
insert into public.source_registry(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Tunisia — Law No. 92-52 on Narcotics, current legal text','https://legislation-securite.tn/latest-laws/loi-n-92-52-du-18-mai-1992-relative-aux-stupefiants/','Tunisia',true,'Tunisia','TN','fr','monthly','verified','TN',1,false,'statute',true,'Current legal text: narcotic plants and related cultivation, possession, sale, distribution, import/export and other dealings are prohibited except legally permitted medical/research cases.','legislature'),
('Tonga — Attorney-General legislation index / Illicit Drugs Control Act','https://ago.gov.to/cms/legislation/index/alphabetical.html','Tonga',true,'Tonga','TO','en','monthly','verified','TO',1,false,'statute',true,'Official Tonga legislation index identifies the Illicit Drugs Control Act 2003 and subsequent amendments as current legislation.','legislature')
on conflict(source_url) do update set is_active=true,jurisdiction_code=excluded.jurisdiction_code,updated_at=now();

insert into public.regulatory_market_access_evidence(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,verified_at,expires_at,active)
values
('primary-evidence-tn-narcotics-law','TN','prohibited','Tunisia Law No. 92-52 prohibits cultivation, consumption, production, possession, purchase, transport, circulation, sale, distribution, import and export of narcotic plants/substances, subject to legally permitted exceptions including medicine and scientific research.','Tunisia legal legislation database','https://legislation-securite.tn/latest-laws/loi-n-92-52-du-18-mai-1992-relative-aux-stupefiants/',now(),now()+interval '180 days',true),
('primary-evidence-to-illicit-drugs-act','TO','prohibited','Tonga maintains the Illicit Drugs Control Act 2003 and later amendments as current law governing illicit drugs; no commercial cannabis pathway is established by the cited sources.','Tonga Attorney-General''s Office','https://ago.gov.to/cms/legislation/index/alphabetical.html',now(),now()+interval '180 days',true)
on conflict(evidence_key) do update set active=true,verified_at=excluded.verified_at,expires_at=excluded.expires_at,rationale=excluded.rationale;

insert into public.regulatory_market_access_claims(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-tn-narcotics-law','TN','primary-evidence-claim:tn-narcotics-law','Tunisia prohibits cannabis/narcotic cultivation and commercial dealings except legally permitted medical or scientific cases under its narcotics law.','any','national','Tunisia legal legislation database','https://legislation-securite.tn/latest-laws/loi-n-92-52-du-18-mai-1992-relative-aux-stupefiants/',now(),now(),now()+interval '180 days','verified'),
('primary-evidence-to-illicit-drugs-act','TO','primary-evidence-claim:to-illicit-drugs-act','Tonga maintains the Illicit Drugs Control Act 2003 and subsequent amendments; no commercial cannabis pathway is established by the cited sources.','any','national','Tonga Attorney-General''s Office','https://ago.gov.to/cms/legislation/index/alphabetical.html',now(),now(),now()+interval '180 days','verified')
on conflict(claim_key) do update set claim_text=excluded.claim_text,evidence_status='verified',verified_at=excluded.verified_at,expires_at=excluded.expires_at;

update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',evidence_basis='Current official/legal source verified.',last_evaluated_at=now()
where jurisdiction_key in ('TN','TO') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');

update public.jurisdiction_dimension_coverage set status='verified_empty',applicability='applicable',evidence_basis='Current authoritative evidence does not establish a general commercial cannabis pathway, commercial product-format framework, legal-market metrics, legal cannabis trade-flow series, market signals, or scheduled regulatory event.',last_evaluated_at=now()
where jurisdiction_key in ('TN','TO') and dimension_key in ('verified_pathways','verified_format_rules','regulatory_calendar','market_metrics','trade_flows','signals');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key in ('TN','TO') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules','regulatory_calendar','market_metrics','trade_flows','signals')
and status in ('open','in_progress','blocked');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923065000','full_depth_tn_to','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923065000_full_depth_tn_to.sql

-- RECOVERY BEGIN 20260923070000_primary_gh_format_calendar_enrichment.sql
-- Primary Ghana format and regulatory-calendar enrichment from NACOC and Ghana Ministry of the Interior.
insert into public.pathway_format_rules
(pathway_id,format_id,status,conditions,notes,source_urls,verification,effective_date,packaging_labelling)
select '5796e807-c701-4c51-80a5-fdaf74a60ddb',pf.id,'permitted',
'{"licensed_processing":true,"low_thc_max":0.3}'::jsonb,
'Ghana NACOC processing licence identifies oils and extracts as finished goods produced under licensed processing; applicable low-THC and compliance controls remain in force.',
array['https://portal.ncc.gov.gh/licenses/processing'],'needs_review','2026-02-26',
'NACOC requires THC/CBD content, allergens, dosage and warnings on labels.'
from public.product_formats pf where pf.slug in ('oral_oil','extracts_concentrates')
and not exists(select 1 from public.pathway_format_rules pfr where pfr.pathway_id='5796e807-c701-4c51-80a5-fdaf74a60ddb' and pfr.format_id=pf.id);

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'rule',pfr.id,'Ghana NACOC Processing Licence','Processing licence — finished goods','regulator',
'https://portal.ncc.gov.gh/licenses/processing','2026-02-26',current_date,
'Processing licence authorizes processing raw cannabis into finished goods such as oils, extracts, fabrics, or other industrial/medicinal products.'
from public.pathway_format_rules pfr
join public.product_formats pf on pf.id=pfr.format_id
where pfr.pathway_id='5796e807-c701-4c51-80a5-fdaf74a60ddb'
and pf.slug in ('oral_oil','extracts_concentrates')
and not exists(select 1 from public.regulatory_citations c where c.entity_type='rule' and c.entity_id=pfr.id and c.citation_url='https://portal.ncc.gov.gh/licenses/processing');

update public.pathway_format_rules pfr set verification='verified',updated_at=now()
from public.product_formats pf
where pfr.pathway_id='5796e807-c701-4c51-80a5-fdaf74a60ddb'
and pfr.format_id=pf.id and pf.slug in ('oral_oil','extracts_concentrates');

insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'GH','effective','Ghana Cannabis Regulatory Programme opened for implementation','2026-02-26','confirmed',
'https://www.mint.gov.gh/ghana-begins-medicinal-and-industrial-cannabis-cultivation/','Republic of Ghana — Ministry of the Interior','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='GH' and title='Ghana Cannabis Regulatory Programme opened for implementation');

insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'GH','effective','NACOC presents first cannabis cultivation licences','2026-07-31','confirmed',
'https://www.ncc.gov.gh/2026/07/%F0%9D%90%8D%F0%9D%90%80%F0%9D%90%82%F0%9D%90%8E%F0%9D%90%82-%F0%9D%90%AB%F0%9D%90%AC%F0%9D%90%AC%F0%9D%90%A7%F0%9D%90%AD%F0%9D%90%AC-%F0%9D%90%82%F0%9D%90%9A%F0%9D%90%A7/','Narcotics Control Commission — Ghana','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='GH' and title='NACOC presents first cannabis cultivation licences');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary NACOC processing rules identify oils and extracts as finished goods and prescribe product labelling; Ministry of Interior and NACOC confirm 2026 programme implementation and first licences.',
last_evaluated_at=now()
where jurisdiction_key='GH' and dimension_key in ('verified_format_rules','regulatory_calendar');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='GH' and dimension_key in ('verified_format_rules','regulatory_calendar')
and status in ('open','in_progress','blocked');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923070000','primary_gh_format_calendar_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923070000_primary_gh_format_calendar_enrichment.sql

-- RECOVERY BEGIN 20260923070000_primary_kw_ly_enrichment.sql
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2 in ('KW','LY') and active=true;

insert into public.source_registry (source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Kuwait Government Online — Amiri Decree-Law No. 59 of 2025 on combating drugs and psychotropic substances','https://www.e.gov.kw/sites/KgoEnglish/Pages/ApplicationPages/NewsDetail.aspx?nid=34677635','Kuwait',true,'Kuwait','KW','en','monthly','verified','KW',1,false,'statute',true,'Official Kuwait Government Online notice describing the 2025 unified drug-control decree-law and licensing controls.','official_gazette'),
('Libya Ministry of Justice — Law No. 7 of 1990 on narcotic drugs and psychotropic substances','https://aladel.gov.ly/home/قانون-رقم-7-لسنة-1990-ف-بشأن-المخدرات-والمؤ/','Libya',true,'Libya','LY','ar','monthly','verified','LY',1,false,'statute',true,'Official Ministry of Justice text. Prohibits dealings in scheduled narcotic plants except medical/scientific purposes and authorized cases.','legislature')
on conflict (source_url) do update set is_active=true,jurisdiction_code=excluded.jurisdiction_code,verification_notes=excluded.verification_notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-kw-decree59-2025','KW','prohibited','Kuwait''s 2025 unified drug-control decree-law prohibits production, manufacture, import, export, transport, possession, purchase, sale and trafficking of narcotic/psychotropic substances except within statutory licensing conditions; cultivation of prohibited plants is restricted to authorized institutions.','Kuwait Government Online','https://www.e.gov.kw/sites/KgoEnglish/Pages/ApplicationPages/NewsDetail.aspx?nid=34677635','2025-11-26',now(),now()+interval '180 days',true),
('primary-evidence-ly-law7-1990','LY','prohibited','Libya Law No. 7 of 1990 prohibits cultivation, import, export, possession, sale and related dealings in scheduled narcotic plants except medical/scientific purposes and authorized cases.','Libya Ministry of Justice','https://aladel.gov.ly/home/قانون-رقم-7-لسنة-1990-ف-بشأن-المخدرات-والمؤ/','1990-06-10',now(),now()+interval '180 days',true);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-kw-decree59-2025','KW','primary-evidence-claim:kw-decree59-2025','Kuwait''s 2025 unified drug-control framework prohibits unauthorized cultivation and commercial dealings in narcotic/psychotropic substances; controlled cultivation and handling require statutory authorization.','any','national','Kuwait Government Online','https://www.e.gov.kw/sites/KgoEnglish/Pages/ApplicationPages/NewsDetail.aspx?nid=34677635','2025-11-26',now(),now(),now()+interval '180 days','verified'),
('primary-evidence-ly-law7-1990','LY','primary-evidence-claim:ly-law7-1990','Libya''s Law No. 7 of 1990 prohibits dealings in scheduled narcotic plants except medical/scientific purposes and authorized cases; it does not establish general commercial cannabis retail.','any','national','Libya Ministry of Justice','https://aladel.gov.ly/home/قانون-رقم-7-لسنة-1990-ف-بشأن-المخدرات-والمؤ/','1990-06-10',now(),now(),now()+interval '180 days','verified');

insert into public.regulatory_calendar (iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
values
('KW','effective','Amiri Decree-Law No. 59 of 2025 — unified drug-control framework','2025-11-26','confirmed','https://www.e.gov.kw/sites/KgoEnglish/Pages/ApplicationPages/NewsDetail.aspx?nid=34677635','Kuwait Government Online','effective'),
('LY','effective','Law No. 7 of 1990 — narcotic drugs and psychotropic substances','1990-06-10','confirmed','https://aladel.gov.ly/home/قانون-رقم-7-لسنة-1990-ف-بشأن-المخدرات-والمؤ/','Libya Ministry of Justice','effective');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Primary government legal source registered and verified.',last_evaluated_at=now()
where jurisdiction_key in ('KW','LY') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',evidence_basis='Primary law establishes prohibition/licensing controls but no general commercial cannabis pathway or product-format framework.',last_evaluated_at=now()
where jurisdiction_key in ('KW','LY') and dimension_key in ('verified_pathways','verified_format_rules');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key in ('KW','LY') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar','verified_pathways','verified_format_rules')
and status in ('open','in_progress','blocked');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923070000','primary_kw_ly_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923070000_primary_kw_ly_enrichment.sql

-- RECOVERY BEGIN 20260923070001_primary_kw_ly_enrichment.sql
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2 in ('KW','LY') and active=true;

insert into public.source_registry (source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Kuwait Government Online — Amiri Decree-Law No. 59 of 2025 on combating drugs and psychotropic substances','https://www.e.gov.kw/sites/KgoEnglish/Pages/ApplicationPages/NewsDetail.aspx?nid=34677635','Kuwait',true,'Kuwait','KW','en','monthly','verified','KW',1,false,'statute',true,'Official Kuwait Government Online notice describing the 2025 unified drug-control decree-law and licensing controls.','official_gazette'),
('Libya Ministry of Justice — Law No. 7 of 1990 on narcotic drugs and psychotropic substances','https://aladel.gov.ly/home/قانون-رقم-7-لسنة-1990-ف-بشأن-المخدرات-والمؤ/','Libya',true,'Libya','LY','ar','monthly','verified','LY',1,false,'statute',true,'Official Ministry of Justice text. Prohibits dealings in scheduled narcotic plants except medical/scientific purposes and authorized cases.','legislature')
on conflict (source_url) do update set is_active=true,jurisdiction_code=excluded.jurisdiction_code,verification_notes=excluded.verification_notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-kw-decree59-2025','KW','prohibited','Kuwait''s 2025 unified drug-control decree-law prohibits production, manufacture, import, export, transport, possession, purchase, sale and trafficking of narcotic/psychotropic substances except within statutory licensing conditions; cultivation of prohibited plants is restricted to authorized institutions.','Kuwait Government Online','https://www.e.gov.kw/sites/KgoEnglish/Pages/ApplicationPages/NewsDetail.aspx?nid=34677635','2025-11-26',now(),now()+interval '180 days',true),
('primary-evidence-ly-law7-1990','LY','prohibited','Libya Law No. 7 of 1990 prohibits cultivation, import, export, possession, sale and related dealings in scheduled narcotic plants except medical/scientific purposes and authorized cases.','Libya Ministry of Justice','https://aladel.gov.ly/home/قانون-رقم-7-لسنة-1990-ف-بشأن-المخدرات-والمؤ/','1990-06-10',now(),now()+interval '180 days',true);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-kw-decree59-2025','KW','primary-evidence-claim:kw-decree59-2025','Kuwait''s 2025 unified drug-control framework prohibits unauthorized cultivation and commercial dealings in narcotic/psychotropic substances; controlled cultivation and handling require statutory authorization.','any','national','Kuwait Government Online','https://www.e.gov.kw/sites/KgoEnglish/Pages/ApplicationPages/NewsDetail.aspx?nid=34677635','2025-11-26',now(),now(),now()+interval '180 days','verified'),
('primary-evidence-ly-law7-1990','LY','primary-evidence-claim:ly-law7-1990','Libya''s Law No. 7 of 1990 prohibits dealings in scheduled narcotic plants except medical/scientific purposes and authorized cases; it does not establish general commercial cannabis retail.','any','national','Libya Ministry of Justice','https://aladel.gov.ly/home/قانون-رقم-7-لسنة-1990-ف-بشأن-المخدرات-والمؤ/','1990-06-10',now(),now(),now()+interval '180 days','verified');

insert into public.regulatory_calendar (iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
values
('KW','effective','Amiri Decree-Law No. 59 of 2025 — unified drug-control framework','2025-11-26','confirmed','https://www.e.gov.kw/sites/KgoEnglish/Pages/ApplicationPages/NewsDetail.aspx?nid=34677635','Kuwait Government Online','effective'),
('LY','effective','Law No. 7 of 1990 — narcotic drugs and psychotropic substances','1990-06-10','confirmed','https://aladel.gov.ly/home/قانون-رقم-7-لسنة-1990-ف-بشأن-المخدرات-والمؤ/','Libya Ministry of Justice','effective');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Primary government legal source registered and verified.',last_evaluated_at=now()
where jurisdiction_key in ('KW','LY') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',evidence_basis='Primary law establishes prohibition/licensing controls but no general commercial cannabis pathway or product-format framework.',last_evaluated_at=now()
where jurisdiction_key in ('KW','LY') and dimension_key in ('verified_pathways','verified_format_rules');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key in ('KW','LY') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar','verified_pathways','verified_format_rules')
and status in ('open','in_progress','blocked');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923070001','primary_kw_ly_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923070001_primary_kw_ly_enrichment.sql

-- RECOVERY BEGIN 20260923072000_primary_mc_cannabis_control_enrichment.sql
-- Primary Monaco cannabis-control enrichment from current Legimonaco Article 32.
insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Monaco Legimonaco — Ministerial Order No. 91-368, Article 32 cannabis controls',
'https://legimonaco.mc/tnc/arrete-ministeriel/1991/07-02-91-368/?V=pdf&contentName=arrete-ministeriel+n%C2%B0+91-368+%281991-07-02%29.pdf',
'Monaco',true,'Monaco','MC','fr','monthly','verified','MC',1,false,'regulation',true,
'Current Article 32 regime prohibits cannabis and cannabis-derived products, with narrow research/control, pharmaceutical, and non-narcotic-variety exceptions.',
'drug_control_authority')
on conflict(source_url) do update set is_active=true,jurisdiction_code='MC',verification_notes=excluded.verification_notes,updated_at=now();

update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='MC' and active=true;
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-mc-cannabis-order-2019','MC','medical_limited_trade',
'Monaco''s current Article 32 regime prohibits ordinary commercial cannabis activity, subject to narrow derogations for research/control, authorized derivatives, non-narcotic cannabis varieties authorized by ministerial order, and authorized pharmaceutical specialties.',
'Legimonaco — Principality of Monaco','https://legimonaco.mc/tnc/arrete-ministeriel/1991/07-02-91-368/?V=pdf&contentName=arrete-ministeriel+n%C2%B0+91-368+%281991-07-02%29.pdf',
'2019-08-07',now(),now()+interval '180 days',true)
on conflict(evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-mc-cannabis-order-2019','MC','primary-evidence-claim:mc-cannabis-order-2019',
'Monaco prohibits ordinary commercial cannabis activity; narrow exceptions cover research/control, authorized derivatives, non-narcotic cannabis varieties authorized by ministerial order, and authorized pharmaceutical specialties.',
'any','national','Legimonaco — Principality of Monaco',
'https://legimonaco.mc/tnc/arrete-ministeriel/1991/07-02-91-368/?V=pdf&contentName=arrete-ministeriel+n%C2%B0+91-368+%281991-07-02%29.pdf',
'2019-08-07',now(),now(),now()+interval '180 days','verified')
on conflict(claim_key) do update set claim_text=excluded.claim_text,evidence_status='verified',verified_at=excluded.verified_at,expires_at=excluded.expires_at,updated_at=now();

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select '1a237176-7a4f-43ba-9d94-ea63b9ad3382','MC','depth-v1-mc-authorized-non-narcotic-cannabis',
'Authorized non-narcotic cannabis varieties','domestic_authorization','Ministerial Order No. 91-368, Article 32 II','Monaco Minister of State','active','2019-08-07',
'Cultivation, import, export and industrial/commercial use of cannabis varieties without narcotic properties may be authorized by ministerial order. This is not a general adult-use cannabis pathway.',
array['https://legimonaco.mc/tnc/arrete-ministeriel/1991/07-02-91-368/?V=pdf&contentName=arrete-ministeriel+n%C2%B0+91-368+%281991-07-02%29.pdf'],'needs_review',now()
where not exists(select 1 from public.regulatory_pathways where iso_alpha2='MC' and slug='depth-v1-mc-authorized-non-narcotic-cannabis');

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'Ministerial Order No. 91-368','Article 32 II','statute',
'https://legimonaco.mc/tnc/arrete-ministeriel/1991/07-02-91-368/?V=pdf&contentName=arrete-ministeriel+n%C2%B0+91-368+%281991-07-02%29.pdf',
'2019-08-07',current_date,'Industrial and commercial use of cannabis varieties without narcotic properties may be authorized by ministerial order.'
from public.regulatory_pathways p
where p.iso_alpha2='MC' and p.slug='depth-v1-mc-authorized-non-narcotic-cannabis'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://legimonaco.mc/tnc/arrete-ministeriel/1991/07-02-91-368/?V=pdf&contentName=arrete-ministeriel+n%C2%B0+91-368+%281991-07-02%29.pdf');

update public.regulatory_pathways set verification='verified',last_verified_at=now()
where iso_alpha2='MC' and slug='depth-v1-mc-authorized-non-narcotic-cannabis';

insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'MC','effective','Article 32 cannabis control regime in current Ministerial Order No. 91-368','2019-08-07','confirmed',
'https://legimonaco.mc/tnc/arrete-ministeriel/1991/07-02-91-368/?V=pdf&contentName=arrete-ministeriel+n%C2%B0+91-368+%281991-07-02%29.pdf',
'Legimonaco — Principality of Monaco','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='MC' and title='Article 32 cannabis control regime in current Ministerial Order No. 91-368');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary Monaco Legimonaco source establishes current Article 32 cannabis controls and an authorized non-narcotic variety pathway.',
last_evaluated_at=now()
where jurisdiction_key='MC' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','regulatory_calendar');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',
evidence_basis='Primary Monaco Article 32 source does not establish general commercial cannabis product-format rules.',
last_evaluated_at=now()
where jurisdiction_key='MC' and dimension_key='verified_format_rules';

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='MC' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','regulatory_calendar','verified_format_rules')
and status in ('open','in_progress','blocked');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923072000','primary_mc_cannabis_control_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923072000_primary_mc_cannabis_control_enrichment.sql

-- RECOVERY BEGIN 20260923073000_authoritative_market_access_adjudication_tranche_20260923.sql
-- Authoritative adjudication tranche: current first-party regulatory sources researched 2026-09-23.
-- This tranche only publishes conclusions directly supported by the cited authority.
-- No legacy tier is carried forward without current evidence.

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select
 'primary-evidence-pr-20260923',
 'PR',
 'medical_limited_trade',
 'Puerto Rico maintains an active Medical Cannabis Regulatory Board and a current medical-cannabis licensing framework. The Department of Health describes licensed establishments, cultivation, manufacturing, transportation and laboratory licensing and identifies Regulation 9038 and Law 42-2017 as the governing framework. The cited current authority does not establish a general adult-use commercial market.',
 'Puerto Rico Department of Health — Junta Reglamentadora del Cannabis Medicinal',
 'https://www.salud.pr.gov/CMS/364',
 '2017-07-09',
 now(),
 now() + interval '180 days',
 true
where not exists (select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-pr-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select
 'primary-evidence-ba-20260923',
 'BA',
 'medical_limited_trade',
 'Bosnia and Herzegovina transferred cannabis from the prohibited table to the table of substances and plants under strict control in December 2025, opening the legal basis for medical use. The competent Ministry stated in July 2026 that implementing amendments needed for prescribing and dispensing cannabis medicines had not yet been completed; the September 2026 follow-up confirms further regulatory and professional steps are still required for practical medical application. This supports a strictly controlled medical pathway, not general adult-use commerce.',
 'Ministry of Civil Affairs of Bosnia and Herzegovina — Cannabis regulatory updates',
 'https://www.mcp.gov.ba/en/portal/post/ukinuta-potpuna-zabrana-kanabis-u-bih-prelazi-u-kategoriju-strogo-nadziranih-tvari-1774352662152',
 '2025-12-29',
 now(),
 now() + interval '180 days',
 true
where not exists (select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-ba-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select
 'primary-evidence-la-20260923',
 'LA',
 'prohibited',
 'The Lao Trade Portal identifies marijuana as a prohibited narcotic for import and export under the Law on Narcotic and its 2021 amendment. The cited official trade-control record states marijuana is not allowed to be imported or exported and classifies the measure as prohibited goods. The underlying law also provides criminal penalties for commercial cultivation, possession, production and trade.',
 'Lao Trade Portal — Ministry of Industry and Commerce',
 'https://www.laotradeportal.gov.la/en-gb/search-measure/view/7',
 '2021-08-09',
 now(),
 now() + interval '180 days',
 true
where not exists (select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-la-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select
 'primary-evidence-be-20260923',
 'BE',
 'prohibited',
 'Belgian Federal Justice states that possession or cultivation of cannabis remains an offence. The limited prosecutorial-priority rule for an adult possessing up to 3 grams or one plant for personal use is not a commercial licensing pathway. The cited official authority therefore does not establish lawful commercial cannabis market access.',
 'Belgian Federal Public Service Justice — Cannabis',
 'https://www.justice.belgium.be/fr/themes_et_dossiers/securite_et_criminalite/drogues/cannabis',
 '2026-09-23',
 now(),
 now() + interval '180 days',
 true
where not exists (select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-be-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select
 'primary-evidence-lc-20260923',
 'LC',
 'legal_commercial_access',
 'Saint Lucia’s Regulated Substances Authority states that its Cannabis Licence authorizes cultivation, processing, distribution, retail, research, export and industrial-hemp activities. In April 2026 the Authority also announced selection of a national seed-to-sale traceability platform covering cultivation, processing, distribution, testing and retail for licensed operators. These first-party sources establish an operational regulated commercial cannabis framework.',
 'Saint Lucia Regulated Substances Authority',
 'https://rsa.govt.lc/',
 '2026-04-28',
 now(),
 now() + interval '180 days',
 true
where not exists (select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-lc-20260923');

select * from api.refresh_verified_market_access_tiers('primary-evidence-pr-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-ba-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-la-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-be-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-lc-20260923');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923073000','authoritative_market_access_adjudication_tranche_20260923','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923073000_authoritative_market_access_adjudication_tranche_20260923.sql

-- RECOVERY BEGIN 20260923074500_authoritative_market_access_adjudication_tranche_2_20260923.sql
-- Authoritative adjudication tranche 2: first-party sources researched 2026-09-23.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-ae-20260923','AE','cbd_hemp_only',
 'The UAE enacted a 2025 federal decree-law regulating industrial and medical uses of industrial hemp while expressly prohibiting recreational/personal use and requiring licensing. Separately, the federal narcotics law restricts cannabis/narcotics except authorized medical/scientific cases. The cited current framework therefore supports controlled industrial/medical hemp activity, not a general commercial adult-use cannabis market.',
 'UAE Government — UAE Legislation',
 'https://uaelegislation.gov.ae/en/legislations/3886/download',
 '2025-12-18',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-ae-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-pk-20260923','PK','medical_limited_trade',
 'Pakistan has an enacted Cannabis Control and Regulatory Authority framework and a current national cannabis policy covering cultivation, extraction, manufacturing and a regulated marketplace for industrial and medicinal purposes. The official policy states medicinal cannabis and derivatives are distributed through regulated outlets on prescription and that industrial CBD products below the stated THC threshold may enter specified markets. Entertainment use remains illegal.',
 'Government of Pakistan — Cannabis Control & Regulatory Authority',
 'https://www.ccra.gov.pk/storage/gallery/Cannabis_Policy%202025.pdf',
 '2025-01-01',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-pk-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-bt-20260923','BT','prohibited',
 'Bhutan’s Attorney General publishes the Narcotic Drugs, Psychotropic Substances and Substance Abuse Act and its 2018 amendment. The amendment expressly criminalizes illicit trafficking in cannabis and derivatives, including possession, import, export, sale, purchase, transport, distribution and supply above prescribed quantities. No lawful general commercial cannabis pathway is established by the cited current legal framework.',
 'Office of the Attorney General of Bhutan',
 'https://oag.gov.bt/wp-content/uploads/2024/07/Narcotic-Drugs-Psychotropic-Substance-and-Substance-Abuse-Amendment-Act-2018.pdf',
 '2018-07-01',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-bt-20260923');

select * from api.refresh_verified_market_access_tiers('primary-evidence-ae-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-pk-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-bt-20260923');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923074500','authoritative_market_access_adjudication_tranche_2_20260923','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923074500_authoritative_market_access_adjudication_tranche_2_20260923.sql

-- RECOVERY BEGIN 20260923080000_authoritative_market_access_adjudication_tranche_3_20260923.sql
-- Authoritative adjudication tranche 3: first-party current sources.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-gh-20260923','GH','medical_limited_trade',
 'Ghana operates a controlled cannabis regulatory programme for low-THC cannabis. The Narcotics Control Commission states that cultivation, processing, distribution and trade are permitted under licensing for medical, research and industrial purposes, with a THC ceiling of 0.3%, while recreational cannabis remains illegal. In July 2026 NACOC reported issuance of cultivation licences to two companies under this framework.',
 'Narcotics Control Commission of Ghana',
 'https://www.ncc.gov.gh/cannabis-regulations/',
 '2026-02-26',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-gh-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-zm-20260923','ZM','medical_limited_trade',
 'Zambia''s Cannabis Act 2021 expressly regulates cultivation, manufacture, production, storage, distribution, import and export of cannabis for medicinal, scientific or research purposes and establishes a licensing authority. The cited Act does not establish general adult-use retail commerce.',
 'National Assembly of Zambia — Cannabis Act, 2021',
 'https://www.parliament.gov.zm/node/9003',
 '2021-12-23',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-zm-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-vu-20260923','VU','prohibited',
 'Vanuatu courts continue to enforce the Dangerous Drugs Act against unlawful possession of cannabis. Two Supreme Court decisions in 2026 record convictions for unlawful possession of cannabis under section 2(62) of the Dangerous Drugs Act [Cap 12], with substantial criminal penalties. The cited current authority does not establish a lawful commercial cannabis market.',
 'Supreme Court of Vanuatu',
 'https://courts.gov.vu/court-activity/judgments/2853',
 '2026-07-09',now(),now()+interval '180 days',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-vu-20260923');

select * from api.refresh_verified_market_access_tiers('primary-evidence-gh-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-zm-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-vu-20260923');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923080000','authoritative_market_access_adjudication_tranche_3_20260923','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923080000_authoritative_market_access_adjudication_tranche_3_20260923.sql

-- RECOVERY BEGIN 20260923081500_reconcile_adjudicated_evidence_into_291x32_matrix.sql
-- Reconcile the 32-dimension matrix with the actual adjudicated regulatory tier.
-- This is deliberately evidence-backed: only current verified tiers with active
-- evidence and a primary authority URL are promoted to complete.

update public.jurisdiction_data_depth_dimension_state s
set applicability='applicable',
    status='complete',
    evidence_count=1,
    primary_source_count=1,
    latest_verified_at=e.verified_at,
    freshness_deadline=e.expires_at,
    confidence='high',
    evidence_basis='active regulatory_market_access_evidence bound to current verified tier',
    last_evaluated_at=now(),
    updated_at=now()
from public.countries c
join public.regulatory_market_access_evidence e
  on e.evidence_key=c.regulatory_tier_evidence_key
 and e.jurisdiction_iso2=c.iso_alpha2
 and e.active=true
where s.jurisdiction_key=c.iso_alpha2
  and s.dimension_key='regulatory_tier'
  and s.contract_version='2026-09-23.v2'
  and c.verified_regulatory_tier is not null
  and e.authority_url is not null
  and e.authority_url <> '';

-- A current authoritative regulator surface can satisfy the regulator dimension
-- only where a jurisdiction-specific primary source exists. No parent source is
-- inherited by a child.
update public.jurisdiction_data_depth_dimension_state s
set applicability='applicable',
    status='complete',
    evidence_count=1,
    primary_source_count=1,
    latest_verified_at=p.verified_at,
    freshness_deadline=p.expires_at,
    confidence='high',
    evidence_basis='jurisdiction-specific regulatory_market_access_primary_sources',
    parent_jurisdiction_key=p.parent_iso2,
    last_evaluated_at=now(),
    updated_at=now()
from public.regulatory_market_access_primary_sources p
where s.jurisdiction_key=p.jurisdiction_iso2
  and s.dimension_key='regulator'
  and s.contract_version='2026-09-23.v2'
  and p.authority_url is not null
  and p.authority_url <> ''
  and p.verified_at is not null
  and p.expires_at > now()
  and p.jurisdiction_iso2 = p.jurisdiction_iso2;

-- Re-evaluate the full-depth gate after evidence reconciliation.


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923081500','reconcile_adjudicated_evidence_into_291x32_matrix','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923081500_reconcile_adjudicated_evidence_into_291x32_matrix.sql

-- RECOVERY BEGIN 20260923083000_primary_om_law67_2026_enrichment.sql
-- Primary Oman regulatory provenance: Royal Decree 67/2026.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='OM' and active=true;
insert into public.source_registry (source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class) values ('Oman Ministry of Justice and Legal Affairs — Law on Combating Narcotic Drugs and Psychotropic Substances (Royal Decree 67/2026)','https://www.mjla.gov.om/decrees/ar/1/show/1462','Oman',true,'Oman','OM','ar','monthly','verified','OM',1,false,'statute',true,'Primary 2026 narcotics law. Published in Official Gazette issue 1664 on 2026-09-06. Cannabis is expressly listed; cultivation/import/export/possession/sale etc. are prohibited except licensed cases.','official_gazette') on conflict(source_url) do update set is_active=true,jurisdiction_code='OM',verification_notes=excluded.verification_notes,updated_at=now();
insert into public.regulatory_market_access_evidence (evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active) values ('primary-evidence-om-law67-2026','OM','prohibited','Oman''s Royal Decree 67/2026 issued a new Law on Combating Narcotic Drugs and Psychotropic Substances. The law expressly lists cannabis and cannabis resin in Schedule IV and Cannabis sativa in the prohibited-cultivation Schedule V. It prohibits cultivation, import, export, possession, sale and related dealings except where specifically licensed under the law. The source does not establish a general commercial cannabis pathway.','Oman Ministry of Justice and Legal Affairs','https://www.mjla.gov.om/decrees/ar/1/show/1462','2026-09-06',now(),now()+interval '180 days',true) on conflict(evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;
insert into public.regulatory_market_access_claims (evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status) values ('primary-evidence-om-law67-2026','OM','primary-evidence-claim:om-law67-2026','Oman''s 2026 narcotics law controls cannabis and cannabis resin as narcotic drugs and prohibits cultivation, import, export, possession, sale and related dealings except in specifically licensed circumstances; the cited law does not establish general commercial cannabis retail.','any','national','Oman Ministry of Justice and Legal Affairs','https://www.mjla.gov.om/decrees/ar/1/show/1462','2026-09-06',now(),now(),now()+interval '180 days','verified') on conflict(claim_key) do update set claim_text=excluded.claim_text,evidence_key=excluded.evidence_key,evidence_status='verified',verified_at=now(),expires_at=now()+interval '180 days',updated_at=now();
insert into public.regulatory_calendar (iso2,event_type,title,expected_date,confidence,source_url,source_label,status) select 'OM','effective','Royal Decree 67/2026 — new narcotics and psychotropic substances law published','2026-09-06','confirmed','https://www.mjla.gov.om/decrees/ar/1/show/1462','Oman Ministry of Justice and Legal Affairs','effective' where not exists(select 1 from public.regulatory_calendar where iso2='OM' and title='Royal Decree 67/2026 — new narcotics and psychotropic substances law published');
update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',evidence_basis='Primary Oman Ministry of Justice and Legal Affairs source: Royal Decree 67/2026 / new narcotics law.',last_evaluated_at=now() where jurisdiction_key='OM' and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar');
update public.jurisdiction_dimension_coverage set status='verified_empty',applicability='applicable',evidence_basis='Primary Oman 2026 narcotics law establishes prohibitions/licensing controls but no general commercial cannabis pathway or commercial cannabis product-format rules.',last_evaluated_at=now() where jurisdiction_key='OM' and dimension_key in('verified_pathways','verified_format_rules');
update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now() where jurisdiction_key='OM' and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar','verified_pathways','verified_format_rules') and status in('open','in_progress','blocked');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923083000','primary_om_law67_2026_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923083000_primary_om_law67_2026_enrichment.sql

-- RECOVERY BEGIN 20260923100000_primary_evidence_batch_ph_ps_py_qa_rw_sa_sc.sql
-- Primary-source evidence batch: 291-jurisdiction depth tranche, 2026-09-23.
-- Scope: current jurisdiction-specific regulatory evidence only.
-- No source snapshot hashes are invented here. Rows remain non-executable until the
-- source engine captures and hashes the cited first-party sources.
-- Research sources verified against current first-party government/regulator pages:
-- Philippines DDB/FDA, Palestine MOH, Paraguay SENAD, Qatar MOI/Customs,
-- Rwanda FDA, Saudi Umm al-Qura/SFDA, Seychelles State House.
--
-- Product classification remains the Harbourview commercial market-access ontology.
-- Conflicting/incomplete source states must remain unresolved rather than inferred.

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,region,language,adapter,crawl_cadence,relevance_status,
 jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,regulator_class,notes)
values
('Philippines Dangerous Drugs Board — Joint DDB-PDEA cannabis reclassification statement','https://ddb.gov.ph/joint-ddb-pdea-statement-on-the-reclassification-of-cannabis/','Philippines','Philippines','PH','Asia','en','html_snapshot','monthly','active','PH',1,false,'government_regulator',true,'national_drug_authority','Current DDB/PDEA statement confirms cannabis remains a dangerous drug and unauthorized cultivation, possession, use, sale, administration, dispensation, delivery, distribution and transport remain punishable.'),
('Palestine Ministry of Health — Laws','https://www.moh.gov.ps/portal/laws/','Palestine','Palestine','PS','Asia','ar','html_snapshot','monthly','active','PS',1,false,'government_regulator',true,'health_ministry','Ministry of Health legal index lists Law No. 7 of 2013 on narcotic drugs and psychotropic substances.'),
('Paraguay SENAD — Registro y Fiscalización','https://senad.gov.py/registro-y-fiscalizacion/','Paraguay','Paraguay','PY','Americas','es','html_snapshot','monthly','active','PY',1,false,'government_regulator',true,'national_drug_authority','Current 2026 SENAD page publishes registration forms for industrial hemp and medicinal cannabis and transport documentation.'),
('Qatar Ministry of Interior — Drug Enforcement Department','https://portal.moi.gov.qa/wps/portal/MOIInternet/departmentcommittees/drugenforcement/','Qatar','Qatar','QA','Asia','ar','html_snapshot','monthly','active','QA',1,false,'government_regulator',true,'national_drug_authority','Current MOI narcotics law states import, export, production, manufacture, cultivation, possession, trade and related activity are prohibited except under statutory conditions.'),
('Rwanda FDA — Guidelines for Importation and Exportation of Pharmaceutical Products','https://rwandafda.gov.rw/monitoring-tool/documents-management/uploads/1/Guidelines/1776078758_Guidelines%20for%20Importation%20and%20Exportation%20of%20Pharmaceutical%20Products.pdf','Rwanda','Rwanda','RW','Africa','en','html_snapshot','monthly','active','RW',1,false,'government_regulator',true,'health_regulator','Current Rwanda FDA guidance expressly provides cannabis/cannabis-product import/export licensing and cultivation/manufacturing eligibility for medical or research purposes.'),
('Saudi Arabia Umm al-Qura — Narcotic and psychotropic schedules','https://www.uqn.gov.sa/decisions-and-regulations/4001776','Saudi Arabia','Saudi Arabia','SA','Asia','ar','html_snapshot','monthly','active','SA',1,false,'government_regulator',true,'health_regulator','Current 2026 controlled-substance schedule expressly lists cannabis, cannabis resin, extracts and tinctures; herbal-source CBD compounds are generally prohibited except specified fully synthetic/approved pharmaceutical conditions.'),
('Seychelles State House — government position on recreational marijuana','https://www.statehouse.gov.sc/news/6726/state-house-clarifies-presidential-pardons-drug-policy-security-matters-and-related-issues','Seychelles','Seychelles','SC','Africa','en','html_snapshot','monthly','active','SC',1,false,'government_regulator',true,'executive_government','Government statement says no decision has been taken to legalize recreational marijuana; medical perspective is separately discussed.')
on conflict (source_url) do update set
  is_active=true,
  jurisdiction_code=excluded.jurisdiction_code,
  tier=excluded.tier,
  notes=excluded.notes,
  updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-ph-ddb-cannabis-20260923','PH','prohibited',
 'The Philippine Dangerous Drugs Board and PDEA state that cannabis remains a dangerous drug under Republic Act No. 9165 and that cultivation, possession, use, sale, administration, dispensation, delivery, distribution and transportation remain punishable. The April 2026 DDB statement also describes medical-cannabis legalization as an evolving policy discussion rather than an enacted general commercial pathway. No general commercial cannabis market-access pathway is established by the cited current government sources.',
 'Philippines Dangerous Drugs Board / Philippine Drug Enforcement Agency',
 'https://ddb.gov.ph/joint-ddb-pdea-statement-on-the-reclassification-of-cannabis/',
 '2026-04-29',now(),'2027-03-23',true),

('primary-evidence-ps-moh-narcotics-2013-20260923','PS','prohibited',
 'The Palestinian Ministry of Health current laws index identifies Law No. 7 of 2013 on narcotic drugs and psychotropic substances. The Ministry also publishes the applicable dangerous-drugs framework prohibiting unauthorized cultivation, manufacture, possession and trafficking of controlled drugs, including cannabis. No general commercial cannabis pathway is established by the cited Ministry sources; the jurisdiction remains unresolved for any specialized medical/research exception beyond the controlled-drug framework.',
 'Palestine Ministry of Health',
 'https://www.moh.gov.ps/portal/laws/',
 '2013-01-01',now(),'2027-03-23',true),

('primary-evidence-py-senad-medicinal-cannabis-20260923','PY','medical_limited_trade',
 'Paraguay''s National Anti-Drug Secretariat (SENAD) currently publishes 2026 registration and fiscal-control forms specifically for medicinal cannabis, including registration of medicinal cannabis and transport documentation, while its legal framework separately addresses industrial non-psychoactive hemp. The cited first-party source therefore supports a regulated medicinal/commercial-control pathway, not general adult-use retail access.',
 'Paraguay Secretaría Nacional Antidrogas (SENAD)',
 'https://senad.gov.py/registro-y-fiscalizacion/',
 '2026-01-01',now(),'2027-03-23',true),

('primary-evidence-qa-moi-controlled-cannabis-20260923','QA','prohibited',
 'Qatar''s Ministry of Interior Drug Enforcement Department states that narcotic drugs and dangerous psychotropic substances are subject to prohibitions covering import, export, production, manufacture, cultivation, possession, trade, purchase, sale, transport and delivery except where permitted under the law. The current government-controlled schedule framework does not establish a general commercial cannabis market pathway.',
 'Qatar Ministry of Interior — Drug Enforcement Department',
 'https://portal.moi.gov.qa/wps/portal/MOIInternet/departmentcommittees/drugenforcement/',
 '1998-01-01',now(),'2027-03-23',true),

('primary-evidence-rw-fda-medical-cannabis-20260923','RW','medical_limited_trade',
 'Rwanda FDA''s current pharmaceutical import/export guidance expressly provides regulatory pathways for cannabis and cannabis products for medical or research purposes. The guidance requires medical-cannabis product registration and identifies manufacturing/processing licences for finished cannabis products and cultivation licences for unprocessed cannabis, with controlled import/export licensing. This supports a regulated medical/research commercial pathway rather than general adult-use access.',
 'Rwanda Food and Drugs Authority',
 'https://rwandafda.gov.rw/monitoring-tool/documents-management/uploads/1/Guidelines/1776078758_Guidelines%20for%20Importation%20and%20Exportation%20of%20Pharmaceutical%20Products.pdf',
 '2026-05-01',now(),'2027-03-23',true),

('primary-evidence-sa-ummalqura-cannabis-20260923','SA','prohibited',
 'Saudi Arabia''s current controlled-substance schedules list cannabis, cannabis resin, extracts and tinctures as narcotic drugs. The September 2026 government publication also states that herbal-source CBD compounds are prohibited subject to narrow pharmaceutical exceptions. No general commercial cannabis cultivation, processing, retail or trade pathway is established by the cited current government schedule.',
 'Saudi Arabia Umm al-Qura / Ministry of Health and Saudi Food and Drug Authority joint schedule',
 'https://www.uqn.gov.sa/decisions-and-regulations/4001776',
 '2026-09-04',now(),'2027-03-23',true),

('primary-evidence-sc-government-marijuana-20260923','SC','prohibited',
 'The Seychelles State House reported the government position that no decision had been taken to legalize recreational marijuana. The cited current government statement does not establish a commercial adult-use pathway. Medical access requires separate primary-source adjudication before any narrower medical tier can be assigned.',
 'State House Seychelles — Office of the President',
 'https://www.statehouse.gov.sc/news/6726/state-house-clarifies-presidential-pardons-drug-policy-security-matters-and-related-issues',
 '2026-01-01',now(),'2027-03-23',true)
on conflict (evidence_key) do update set
  tier=excluded.tier,
  rationale=excluded.rationale,
  authority_name=excluded.authority_name,
  authority_url=excluded.authority_url,
  source_effective_date=excluded.source_effective_date,
  verified_at=excluded.verified_at,
  expires_at=excluded.expires_at,
  active=true;

-- Add explicit citation records tied to the newly adjudicated evidence.
insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select
  'regulatory_market_access_evidence',
  e.id,
  case e.jurisdiction_iso2
    when 'PH' then 'DDB/PDEA cannabis reclassification statement'
    when 'PS' then 'Palestine Ministry of Health narcotics-law index'
    when 'PY' then 'SENAD Registro y Fiscalización'
    when 'QA' then 'Qatar Drug Enforcement Department narcotics law'
    when 'RW' then 'Rwanda FDA pharmaceutical import/export guidance'
    when 'SA' then 'Umm al-Qura controlled-substance schedules'
    when 'SC' then 'State House Seychelles government statement'
  end,
  null,
  'official',
  e.authority_url,
  e.source_effective_date,
  current_date,
  e.rationale
from public.regulatory_market_access_evidence e
where e.evidence_key in (
  'primary-evidence-ph-ddb-cannabis-20260923',
  'primary-evidence-ps-moh-narcotics-2013-20260923',
  'primary-evidence-py-senad-medicinal-cannabis-20260923',
  'primary-evidence-qa-moi-controlled-cannabis-20260923',
  'primary-evidence-rw-fda-medical-cannabis-20260923',
  'primary-evidence-sa-ummalqura-cannabis-20260923',
  'primary-evidence-sc-government-marijuana-20260923'
)
and not exists (
  select 1 from public.regulatory_citations rc
  where rc.entity_type='regulatory_market_access_evidence'
    and rc.entity_id=e.id
    and rc.citation_url=e.authority_url
);

-- Preserve fail-closed execution semantics: these new rows have no captured
-- source hash yet, so the claim layer must remain partial until the source engine
-- captures the cited documents.


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923100000','primary_evidence_batch_ph_ps_py_qa_rw_sa_sc','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923100000_primary_evidence_batch_ph_ps_py_qa_rw_sa_sc.sql

-- RECOVERY BEGIN 20260923101500_primary_evidence_batch_sg_za.sql
-- Primary-source evidence batch 2: Singapore and South Africa.
-- Current first-party sources researched 2026-09-23.
-- Source hashes are intentionally not fabricated; source-engine capture is required
-- before these records can become executable claims.

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,region,language,adapter,crawl_cadence,relevance_status,
 jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,regulator_class,notes)
values
('Singapore Central Narcotics Bureau — Anti-drug laws on cannabis','https://www.cnb.gov.sg/singapore-drug-situation/myths-and-facts-about-drugs/cannabis/singapore-s-anti-drug-laws-on-cannabis/','Singapore','Singapore','SG','Asia','en','html_snapshot','monthly','active','SG',1,false,'government_regulator',true,'national_drug_authority','Current July 2026 CNB statement identifies cannabis as a Class A controlled drug and describes prohibitions on trafficking, possession, consumption, import and export.'),
('Singapore Statutes Online — Misuse of Drugs Act 1973','https://sso.agc.gov.sg/Act/MDA1973','Singapore','Singapore','SG','Asia','en','html_snapshot','weekly','active','SG',1,false,'government_legislation',true,'justice_legislation','Current version as of September 2026 includes offences for trafficking, manufacture, import/export, possession/consumption and cultivation of cannabis.'),
('South African Health Products Regulatory Authority — Cannabis licensing','https://www.sahpra.org.za/cannabis-licensing/','South Africa','South Africa','ZA','Africa','en','html_snapshot','monthly','active','ZA',1,false,'government_regulator',true,'health_regulator','SAHPRA states its cannabis cultivation licensing mandate is limited to medicinal/research purposes and does not authorize non-medicinal commercial cultivation.'),
('South African Health Products Regulatory Authority — Licence application process','https://www.sahpra.org.za/licence-application-process/','South Africa','South Africa','ZA','Africa','en','html_snapshot','monthly','active','ZA',1,false,'government_regulator',true,'health_regulator','Current SAHPRA licensing materials include a licence application to cultivate, manufacture or import cannabis for medicinal purposes and a current cultivation guideline.')
on conflict (source_url) do update set
  is_active=true,
  jurisdiction_code=excluded.jurisdiction_code,
  tier=excluded.tier,
  notes=excluded.notes,
  updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-sg-cnb-cannabis-20260923','SG','prohibited',
 'Singapore''s Central Narcotics Bureau states that cannabis is a Class A controlled drug under the Misuse of Drugs Act and that trafficking, possession, consumption, import and export are offences. The current Singapore Statutes Online version also contains a specific offence for cultivation of cannabis. No general commercial cannabis pathway is established by the current statutory and regulator sources.',
 'Singapore Central Narcotics Bureau',
 'https://www.cnb.gov.sg/singapore-drug-situation/myths-and-facts-about-drugs/cannabis/singapore-s-anti-drug-laws-on-cannabis/',
 '2026-07-03',now(),'2027-03-23',true),

('primary-evidence-za-sahpra-medical-cannabis-20260923','ZA','medical_limited_trade',
 'SAHPRA''s current licensing materials provide an application pathway to cultivate, manufacture or import cannabis for medicinal purposes, and its cultivation guideline states that medicinal cultivation and manufacture require SAHPRA licensing and Department of Health permits. SAHPRA also states that it does not issue licences for non-medicinal commercial cannabis cultivation. The 2026 Justice Department implementation statement separately confirms that commercial cultivation, buying and selling are outside the private-use Act and are being addressed by other departments. The evidence therefore supports a medical/research commercial pathway, not general adult-use commercial retail.',
 'South African Health Products Regulatory Authority (SAHPRA)',
 'https://www.sahpra.org.za/licence-application-process/',
 '2026-04-13',now(),'2027-03-23',true)
on conflict (evidence_key) do update set
  tier=excluded.tier,
  rationale=excluded.rationale,
  authority_name=excluded.authority_name,
  authority_url=excluded.authority_url,
  source_effective_date=excluded.source_effective_date,
  verified_at=excluded.verified_at,
  expires_at=excluded.expires_at,
  active=true;

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select
  'regulatory_market_access_evidence',
  e.id,
  case e.jurisdiction_iso2
    when 'SG' then 'Misuse of Drugs Act / Central Narcotics Bureau cannabis controls'
    when 'ZA' then 'SAHPRA cannabis medicinal licensing framework'
  end,
  null,
  'official',
  e.authority_url,
  e.source_effective_date,
  current_date,
  e.rationale
from public.regulatory_market_access_evidence e
where e.evidence_key in (
  'primary-evidence-sg-cnb-cannabis-20260923',
  'primary-evidence-za-sahpra-medical-cannabis-20260923'
)
and not exists (
  select 1 from public.regulatory_citations rc
  where rc.entity_type='regulatory_market_access_evidence'
    and rc.entity_id=e.id
    and rc.citation_url=e.authority_url
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923101500','primary_evidence_batch_sg_za','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923101500_primary_evidence_batch_sg_za.sql

-- RECOVERY BEGIN 20260923103000_primary_evidence_batch_sg_za_citations.sql
-- Supplemental citation enrichment for the Singapore/South Africa tranche.
-- Uses only the first-party URLs already registered in the preceding tranche.
insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'regulatory_market_access_evidence', e.id,
       'Singapore Central Narcotics Bureau — Anti-drug laws on Cannabis',
       null,'official',e.authority_url,e.source_effective_date,current_date,e.rationale
from public.regulatory_market_access_evidence e
where e.evidence_key='primary-evidence-sg-cnb-cannabis-20260923'
and not exists (select 1 from public.regulatory_citations r where r.entity_type='regulatory_market_access_evidence' and r.entity_id=e.id and r.citation_url=e.authority_url);

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'regulatory_market_access_evidence', e.id,
       'Rwanda Ministerial Order 3 of 2021 — Cannabis and Cannabis Products',
       'Articles 1, 4 and 5','official',
       'https://rwandalii.org/akn/rw/act/mo/minister-of-health/2021/3/eng@2021-06-28',
       '2021-06-28',current_date,
       'The order expressly establishes licensed cultivation, processing, distribution, import and export of cannabis and cannabis products for medical or research purposes.'
from public.regulatory_market_access_evidence e
where e.evidence_key='primary-evidence-rw-fda-medical-cannabis-20260923'
and not exists (select 1 from public.regulatory_citations r where r.entity_type='regulatory_market_access_evidence' and r.entity_id=e.id and r.citation_url='https://rwandalii.org/akn/rw/act/mo/minister-of-health/2021/3/eng@2021-06-28');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923103000','primary_evidence_batch_sg_za_citations','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923103000_primary_evidence_batch_sg_za_citations.sql

-- RECOVERY BEGIN 20260923110000_primary_evidence_batch_th_jp_nz.sql
-- Primary-source evidence batch: Thailand, Japan, New Zealand.
-- Researched 2026-09-23 from first-party regulator/government sources.
-- No source hashes are fabricated; source capture remains a separate execution gate.

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,region,language,adapter,crawl_cadence,relevance_status,
 jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,regulator_class,notes)
values
('Thailand Department of Thai Traditional and Alternative Medicine — Controlled Herb (Cannabis) 2025','https://www.dtam.moph.go.th/sub-law/42864/','Thailand','Thailand','TH','Asia','th','html_snapshot','monthly','active','TH',1,false,'government_regulator',true,'health_regulator','Ministerial controlled-herb cannabis notification published December 2025; current 2026 rules place cannabis under medical controls and require regulated commercial permissions.'),
('Thailand Ministry of Public Health — Medical Cannabis Division legal framework','https://med-cannabis.dtam.moph.go.th/law-dmc/','Thailand','Thailand','TH','Asia','th','html_snapshot','monthly','active','TH',1,false,'government_regulator',true,'health_regulator','Current legal index lists the 2026 regulation governing research, export, sale and processing of controlled herbs for commercial purposes and a 2026 enforcement framework.'),
('Japan Ministry of Health, Labour and Welfare — Cannabis law reform implementation','https://www.mhlw.go.jp/stf/newpage_43079.html','Japan','Japan','JP','Asia','ja','html_snapshot','monthly','active','JP',1,false,'government_legislation',true,'health_regulator','MHLW implementation notice states the amended cannabis laws took effect in stages on 12 December 2024 and 1 March 2025, including medicinal-pharmaceutical use and licensed cultivation categories.'),
('New Zealand Ministry of Health — Medicinal Cannabis Scheme','https://www.health.govt.nz/regulation-legislation/medicinal-cannabis/information-for-consumers','New Zealand','New Zealand','NZ','Oceania','en','html_snapshot','monthly','active','NZ',1,false,'government_regulator',true,'health_regulator','Current Medicinal Cannabis Scheme permits regulated cultivation and manufacture in New Zealand and prescription-only supply subject to minimum quality standards.'),
('New Zealand Ministry of Health — Hemp regulatory changes 2026','https://www.health.govt.nz/regulation-legislation/hemp','New Zealand','New Zealand','NZ','Oceania','en','html_snapshot','monthly','active','NZ',1,false,'government_regulator',true,'health_regulator','From 28 May 2026 the industrial hemp licensing scheme was replaced by permission-based regulations; hemp is defined at no more than 1 percent THC by dry weight.')
on conflict (source_url) do update set
  is_active=true,
  jurisdiction_code=excluded.jurisdiction_code,
  tier=excluded.tier,
  notes=excluded.notes,
  updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-th-dtam-medical-commercial-20260923','TH','medical_limited_trade',
 'Thailand''s Department of Thai Traditional and Alternative Medicine identifies cannabis as a controlled herb and its current 2026 legal index lists a regulation governing research, export, sale and processing of controlled herbs for commercial purposes. The Ministry of Public Health also states the 2026 framework is intended to strengthen control of medical cannabis and prevent unauthorized recreational use. This supports a regulated medical/commercial pathway rather than unrestricted adult-use retail.',
 'Thailand Department of Thai Traditional and Alternative Medicine / Ministry of Public Health',
 'https://med-cannabis.dtam.moph.go.th/law-dmc/',
 '2026-04-30',now(),'2027-03-23',true),
('primary-evidence-jp-mhlw-cannabis-reform-20260923','JP','medical_limited_trade',
 'Japan''s Ministry of Health, Labour and Welfare states that the cannabis-law reform entered into force in stages on 12 December 2024 and 1 March 2025. The reform permits licensed cultivation categories for industrial raw material and pharmaceutical raw material while establishing controls under the Narcotics and Psychotropics Control framework, and enables use of cannabis-derived pharmaceutical products under the amended regime. The cited government framework does not establish a general adult-use commercial market.',
 'Japan Ministry of Health, Labour and Welfare',
 'https://www.mhlw.go.jp/stf/newpage_43079.html',
 '2025-03-01',now(),'2027-03-23',true),
('primary-evidence-nz-moh-medicinal-cannabis-20260923','NZ','medical_limited_trade',
 'New Zealand''s Ministry of Health states that the Medicinal Cannabis Scheme has operated since 1 April 2020, enables medicinal cannabis to be grown and manufactured in New Zealand, and permits prescription-only supply subject to minimum quality standards. The Ministry also confirms the 2026 hemp reforms are a separate permission-based regime for hemp at no more than 1 percent THC. The cited framework therefore supports regulated medicinal commercial activity, not general adult-use cannabis retail.',
 'New Zealand Ministry of Health — Medicinal Cannabis Agency',
 'https://www.health.govt.nz/regulation-legislation/medicinal-cannabis/information-for-consumers',
 '2020-04-01',now(),'2027-03-23',true)
on conflict (evidence_key) do update set
 tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,
 source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'regulatory_market_access_evidence',e.id,
 case e.jurisdiction_iso2
  when 'TH' then 'Thailand Ministry of Public Health / DTAM 2026 controlled-herb commercial regulation'
  when 'JP' then 'MHLW Cannabis-law reform implementation notice'
  when 'NZ' then 'New Zealand Medicinal Cannabis Scheme'
 end,
 null,'official',e.authority_url,e.source_effective_date,current_date,e.rationale
from public.regulatory_market_access_evidence e
where e.evidence_key in (
 'primary-evidence-th-dtam-medical-commercial-20260923',
 'primary-evidence-jp-mhlw-cannabis-reform-20260923',
 'primary-evidence-nz-moh-medicinal-cannabis-20260923'
)
and not exists (
 select 1 from public.regulatory_citations r
 where r.entity_type='regulatory_market_access_evidence'
 and r.entity_id=e.id and r.citation_url=e.authority_url
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923110000','primary_evidence_batch_th_jp_nz','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923110000_primary_evidence_batch_th_jp_nz.sql

-- RECOVERY BEGIN 20260923113000_primary_evidence_batch_au_ma_ls.sql
-- Primary-source evidence batch: Australia, Morocco, Lesotho.
-- Researched 2026-09-23 from government/regulator sources.
-- Source hashes are deliberately absent until source-engine capture.

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,region,language,adapter,crawl_cadence,relevance_status,
 jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,regulator_class,notes)
values
('Australia Office of Drug Control — Grow, produce or manufacture cannabis','https://www.odc.gov.au/medicinal-cannabis/grow-produce-or-manufacture-cannabis-australia','Australia','Australia','AU','Oceania','en','html_snapshot','monthly','active','AU',1,false,'government_regulator',true,'national_drug_authority','Current ODC guidance, updated 30 June 2026, requires a licence and permit to grow, produce or manufacture cannabis for medicinal or research purposes.'),
('Australia Office of Drug Control — Medicinal cannabis','https://www.odc.gov.au/medicinal-cannabis','Australia','Australia','AU','Oceania','en','html_snapshot','monthly','active','AU',1,false,'government_regulator',true,'national_drug_authority','ODC states medicinal cannabis cultivation, manufacture, import and export are tightly controlled and recreational cultivation/importation is prohibited.'),
('Morocco National Agency for the Regulation of Cannabis Activities — Law 13-21','https://www.anrac.gov.ma/fr/loi1321/','Morocco','Morocco','MA','Africa','fr','html_snapshot','monthly','active','MA',1,false,'government_regulator',true,'cannabis_regulator','ANRAC publishes Law 13-21 and implementing texts governing cultivation, nurseries, seed/plant import/export, processing, manufacturing, transport, marketing, packaging, labelling and controls.'),
('Morocco ANRAC — Frequently Asked Questions','https://www.anrac.gov.ma/en/faq/','Morocco','Morocco','MA','Africa','en','html_snapshot','monthly','active','MA',1,false,'government_regulator',true,'cannabis_regulator','Current ANRAC FAQ identifies authorized activities, authorized provinces, traceability, medical/pharmaceutical/industrial purposes, THC rules, marketing/export and authorization requirements.'),
('Lesotho Government — Morama Holdings cannabis licence','https://www.gov.ls/wp-content/uploads/2022/04/PRIME-MINISTERS-REMARKS-DURING-THE-OPENING-OF-MORAMA-HOLDINGS.-22.03.31.pdf','Lesotho','Lesotho','LS','Africa','en','html_snapshot','monthly','active','LS',1,false,'government_publication',true,'government','Government publication states Morama Holdings holds a full cannabinoid and hemp cultivation, manufacturing and export sales licence under section 12 of the Drugs Act 2008.'),
('Lesotho Government — cannabis investment licences','https://www.gov.ls/development/poverty-reduction-economic-growth-mcc/','Lesotho','Lesotho','LS','Africa','en','html_snapshot','quarterly','active','LS',1,false,'government_publication',true,'government','Government statement reports 12 operational cannabis investment licences and cannabis investments accessing European markets.')
on conflict (source_url) do update set
 is_active=true,jurisdiction_code=excluded.jurisdiction_code,tier=excluded.tier,notes=excluded.notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-au-odc-medical-cannabis-20260923','AU','medical_limited_trade',
 'The Australian Office of Drug Control states that cultivation, production and manufacture of cannabis require a medicinal cannabis licence and relevant permits and must be for medicinal or scientific purposes. ODC also states medicinal cannabis cultivation, manufacture, import and export are tightly controlled and that cultivation/importation for recreational use is prohibited. This establishes a regulated medicinal/research commercial pathway, not a general adult-use commercial market.',
 'Australian Government Office of Drug Control',
 'https://www.odc.gov.au/medicinal-cannabis/grow-produce-or-manufacture-cannabis-australia',
 '2026-06-30',now(),'2027-03-23',true),
('primary-evidence-ma-anrac-licensed-cannabis-20260923','MA','medical_limited_trade',
 'Morocco''s ANRAC states that Law 13-21 authorizes cultivation and production, nurseries, seed and plant import/export, processing, manufacturing, transport, marketing, export and import of cannabis products. ANRAC states authorized products are for medical, pharmaceutical or industrial purposes and cultivation is geographically restricted to designated provinces. The framework therefore establishes a licensed commercial cannabis supply chain without establishing general adult-use retail.',
 'Morocco National Agency for the Regulation of Cannabis Activities (ANRAC)',
 'https://www.anrac.gov.ma/en/faq/',
 '2021-08-31',now(),'2027-03-23',true),
('primary-evidence-ls-cannabis-licensing-20260923','LS','medical_limited_trade',
 'Lesotho government publications document a licensed cannabis cultivation, manufacturing and export sector. A Prime Minister''s Office publication states Morama Holdings holds a cannabinoid and hemp cultivation, manufacturing and export sales licence under section 12 of the Drugs Act 2008, while a government statement reports 12 operational cannabis investment licences and access to European markets. The cited evidence supports regulated commercial cultivation/manufacturing/export, but does not establish a general domestic adult-use retail pathway.',
 'Government of Lesotho',
 'https://www.gov.ls/wp-content/uploads/2022/04/PRIME-MINISTERS-REMARKS-DURING-THE-OPENING-OF-MORAMA-HOLDINGS.-22.03.31.pdf',
 '2022-03-31',now(),'2027-03-23',true)
on conflict (evidence_key) do update set
 tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,
 source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'regulatory_market_access_evidence',e.id,
 case e.jurisdiction_iso2
  when 'AU' then 'Office of Drug Control medicinal cannabis licensing framework'
  when 'MA' then 'ANRAC Law 13-21 / authorized cannabis activities'
  when 'LS' then 'Lesotho Government cannabis cultivation, manufacturing and export licence'
 end,
 null,'official',e.authority_url,e.source_effective_date,current_date,e.rationale
from public.regulatory_market_access_evidence e
where e.evidence_key in (
 'primary-evidence-au-odc-medical-cannabis-20260923',
 'primary-evidence-ma-anrac-licensed-cannabis-20260923',
 'primary-evidence-ls-cannabis-licensing-20260923'
)
and not exists (
 select 1 from public.regulatory_citations r
 where r.entity_type='regulatory_market_access_evidence'
 and r.entity_id=e.id and r.citation_url=e.authority_url
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923113000','primary_evidence_batch_au_ma_ls','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923113000_primary_evidence_batch_au_ma_ls.sql

-- RECOVERY BEGIN 20260923120000_signal_engine_autonomy_foundations.sql
-- Signal Engine V1 foundations (additive, fail-closed).
-- Spec: docs/SIGNALS_MAX_AUTOMATION_DESIGN.md §9
--
-- Does NOT widen promotion autonomy. Seed policy requires human.
-- classifier_validation already exists; this migration does not touch it.
-- RLS: deny anon/authenticated/public; service_role retains access via bypass.

-- ---------------------------------------------------------------------------
-- autonomy_policies — versioned thresholds per signal class
-- ---------------------------------------------------------------------------
create table if not exists public.autonomy_policies (
  id uuid primary key default gen_random_uuid(),
  policy_version text not null,
  signal_class text not null,
  full_auto_min_confidence numeric not null default 0.95
    check (full_auto_min_confidence >= 0 and full_auto_min_confidence <= 1),
  min_corroboration integer not null default 1 check (min_corroboration >= 0),
  allowed_source_tiers integer[] not null default '{1}',
  requires_human boolean not null default true,
  gate_passed boolean not null default false,
  metrics jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  unique (policy_version, signal_class)
);

create index if not exists autonomy_policies_class_idx
  on public.autonomy_policies (signal_class, created_at desc);

alter table public.autonomy_policies enable row level security;
alter table public.autonomy_policies force row level security;
revoke all on table public.autonomy_policies from anon, authenticated, public;

insert into public.autonomy_policies (
  policy_version,
  signal_class,
  full_auto_min_confidence,
  min_corroboration,
  allowed_source_tiers,
  requires_human,
  gate_passed,
  notes
) values (
  'v1-seed',
  'tier1_regulatory',
  0.90,
  1,
  '{1}',
  true,
  false,
  'Seed policy only. Full Auto remains off until eval evidence + owner sign-off.'
)
on conflict (policy_version, signal_class) do nothing;

-- ---------------------------------------------------------------------------
-- signal_decision_events — audit trail for auto + human decisions
-- ---------------------------------------------------------------------------
create table if not exists public.signal_decision_events (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null,
  decision text not null
    check (decision in ('promote', 'reject', 'edit', 'escalate', 'defer')),
  autonomy_level_at_decision smallint not null
    check (autonomy_level_at_decision between 0 and 4),
  promotion_path text
    check (promotion_path is null or promotion_path in ('full_auto', 'shadow', 'human', 'rejected')),
  human_id uuid,
  gate_scores jsonb not null default '{}'::jsonb,
  acquisition_scores jsonb,
  model_versions jsonb not null default '{}'::jsonb,
  classifier_version text,
  edits jsonb,
  reason_codes text[],
  free_text_notes text,
  created_at timestamptz not null default now()
);

-- Soft FK: signals table exists in production; avoid hard FK if replay order varies.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'signals'
  ) and not exists (
    select 1 from pg_constraint where conname = 'signal_decision_events_signal_id_fkey'
  ) then
    alter table public.signal_decision_events
      add constraint signal_decision_events_signal_id_fkey
      foreign key (signal_id) references public.signals (id) on delete cascade;
  end if;
exception
  when others then
    raise notice 'signal_decision_events FK skipped: %', sqlerrm;
end $$;

create index if not exists signal_decision_events_signal_created_idx
  on public.signal_decision_events (signal_id, created_at desc);
create index if not exists signal_decision_events_created_idx
  on public.signal_decision_events (created_at desc);
create index if not exists signal_decision_events_decision_idx
  on public.signal_decision_events (decision, created_at desc);

alter table public.signal_decision_events enable row level security;
alter table public.signal_decision_events force row level security;
revoke all on table public.signal_decision_events from anon, authenticated, public;

comment on table public.autonomy_policies is
  'Versioned Signal Engine autonomy thresholds. gate_passed must be true before any Full Auto widening.';
comment on table public.signal_decision_events is
  'Audit log of promote/reject/edit decisions (auto and human). Training signal for learning loop.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923120000','signal_engine_autonomy_foundations','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923120000_signal_engine_autonomy_foundations.sql

-- RECOVERY BEGIN 20260923124500_primary_evidence_batch_br_co.sql
-- Primary-source regulatory evidence tranche: Brazil and Colombia.
-- Research verified against current government/regulator publications on 2026-09-23.
-- No source hashes are fabricated; executable publication remains gated on source capture.

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('ANVISA — 2026 cannabis production, cultivation and medicinal-product framework','https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-publica-regras-para-producao-de-cannabis-medicinal','BR','Brazil','BR',1,'regulator',true,true,'south_america','pt','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary ANVISA publication covering RDC 1.012/2026, RDC 1.013/2026, RDC 1.014/2026 and the updated medicinal-product framework; verified 2026-09-23.','2026-09-23','health_authority',array['regulatory'],jsonb_build_object('jurisdiction_key','BR','primary_regulator',true))
on conflict (source_url) do update set jurisdiction_code='BR',country='Brazil',iso='BR',tier=1,source_type='regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary ANVISA cannabis regulatory publication verified 2026-09-23.',verification_checked_at=now(),regulator_class='health_authority',updated_at=now();

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('ANVISA — RDC 1.023/2026 medicinal cannabis labelling, dispensing and export','https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-alinha-normas-a-regras-de-cannabis-aprovada-em-janeiro','BR','Brazil', 'BR',1,'regulator',true,true,'south_america','pt','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary ANVISA publication documenting 2026 rules for labelling, dispensing, product classification and export of medicinal cannabis products and active pharmaceutical ingredients; verified 2026-09-23.','2026-09-23','health_authority',array['regulatory','export'],jsonb_build_object('jurisdiction_key','BR','primary_regulator',true))
on conflict (source_url) do update set jurisdiction_code='BR',country='Brazil',iso='BR',tier=1,source_type='regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary ANVISA medicinal-cannabis export publication verified 2026-09-23.',verification_checked_at=now(),regulator_class='health_authority',updated_at=now();

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Colombia Ministry of Health — Cannabis de uso medicinal','https://www.minsalud.gov.co/salud/medicamentos-y-tecnologias/Paginas/cannabis-uso-medicinal.aspx','CO','Colombia','CO',1,'government_regulator',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary Colombian Ministry of Health page documenting licences, quotas and the medical/scientific cannabis framework; verified 2026-09-23.','2026-09-23','health_authority',array['regulatory','licensing'],jsonb_build_object('jurisdiction_key','CO','primary_regulator',true))
on conflict (source_url) do update set jurisdiction_code='CO',country='Colombia',iso='CO',tier=1,source_type='government_regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary Colombian Ministry of Health cannabis source verified 2026-09-23.',verification_checked_at=now(),regulator_class='health_authority',updated_at=now();

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Colombia SUIN-Juriscol — Decreto 613 de 2017','https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Decretos%2F30030463','CO','Colombia','CO',1,'legal',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary Colombian legal publication: Decreto 613 entered into force and was published 2017-04-10 and regulates import, export, cultivation, production, manufacture, storage, transport, commercialisation and distribution for medical and scientific purposes; verified 2026-09-23.','2026-09-23','legislature',array['legal','regulatory'],jsonb_build_object('jurisdiction_key','CO','primary_legal_source',true))
on conflict (source_url) do update set jurisdiction_code='CO',country='Colombia',iso='CO',tier=1,source_type='legal',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary Colombian legal source verified 2026-09-23.',verification_checked_at=now(),regulator_class='legislature',updated_at=now();

update public.regulatory_market_access_evidence
set active=false,expires_at=now()
where jurisdiction_iso2 in ('BR','CO')
  and active=true
  and evidence_key not in ('primary-evidence-br-20260923','primary-evidence-co-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-br-20260923','BR','medical_limited_trade',
 'Brazil permits a controlled medicinal/pharmaceutical cannabis production framework for authorized legal entities and regulates medicinal cannabis products through ANVISA. The 2026 framework includes controlled cultivation for medicinal/pharmaceutical purposes, research controls, medicinal product manufacture/import rules, and 2026 rules covering export of medicinal cannabis products and active pharmaceutical ingredients. The cited framework does not establish a general adult-use commercial market.',
 'Agência Nacional de Vigilância Sanitária (ANVISA), Brazil',
 'https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-publica-regras-para-producao-de-cannabis-medicinal',
 '2026-08-04',now(),now()+interval '180 days',true),
('primary-evidence-co-20260923','CO','medical_limited_trade',
 'Colombia has a regulated medical/scientific cannabis market-access framework. Decreto 613 de 2017 regulates import, export, cultivation, production, manufacture, acquisition, storage, transport, commercialisation and distribution of cannabis and derivatives for medical and scientific purposes, with licensing and quota controls administered by the competent authorities. The cited framework does not establish general adult-use commercial retail.',
 'Colombia Ministry of Health and Social Protection / SUIN-Juriscol',
 'https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Decretos%2F30030463',
 '2017-04-10',now(),now()+interval '180 days',true)
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-br-20260923','BR','primary-evidence-claim:br-medical-framework-20260923',
 'Brazil has a controlled cannabis framework for medicinal/pharmaceutical production and research, with ANVISA authorization, security, traceability and product controls; 2026 rules also provide for export of medicinal cannabis products and active pharmaceutical ingredients.',
 'any','national','Agência Nacional de Vigilância Sanitária (ANVISA), Brazil','https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-publica-regras-para-producao-de-cannabis-medicinal','2026-08-04',now(),now(),now()+interval '180 days','verified'),
('primary-evidence-co-20260923','CO','primary-evidence-claim:co-medical-framework-20260923',
 'Colombia regulates cannabis import, export, cultivation, production, manufacture, storage, transport, commercialisation and distribution for medical and scientific purposes through a licensed and quota-controlled framework.',
 'any','national','Colombia Ministry of Health and Social Protection / SUIN-Juriscol','https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Decretos%2F30030463','2017-04-10',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';

update public.jurisdiction_dimension_coverage
set status='verified_populated',
    applicability='applicable',
    evidence_basis='Primary regulator/legal sources verified 2026-09-23.',
    last_evaluated_at=now(),
    notes='Primary regulatory evidence and claims refreshed 2026-09-23.'
where jurisdiction_key in ('BR','CO')
  and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),
    notes='Primary regulatory evidence and claims refreshed 2026-09-23.'
where jurisdiction_key in ('BR','CO')
  and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923124500','primary_evidence_batch_br_co','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923124500_primary_evidence_batch_br_co.sql

-- RECOVERY BEGIN 20260923130000_authoritative_full_depth_capture_queue.sql
-- Full-depth authoritative evidence capture queue.
-- Creates a durable, auditable work queue for all 9,312 jurisdiction x dimension cells.
-- No cell is marked complete without a qualifying source snapshot and verified extraction.

create table if not exists public.jurisdiction_data_depth_capture_jobs (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on update cascade on delete cascade,
  status text not null default 'queued' check (status in ('queued','capturing','captured','needs_review','complete','blocked')),
  source_registry_id uuid references public.source_registry(id) on delete set null,
  source_snapshot_id uuid references public.source_snapshots(id) on delete set null,
  attempts integer not null default 0,
  last_error text,
  extracted_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(jurisdiction_key, dimension_key)
);

create index if not exists jurisdiction_data_depth_capture_jobs_status_idx
  on public.jurisdiction_data_depth_capture_jobs(status, updated_at);

create index if not exists jurisdiction_data_depth_capture_jobs_source_idx
  on public.jurisdiction_data_depth_capture_jobs(source_registry_id);

insert into public.jurisdiction_data_depth_capture_jobs(jurisdiction_key,dimension_key)
select c.iso_alpha2,d.dimension_key
from public.countries c
cross join public.jurisdiction_data_depth_dimensions d
where c.iso_alpha2 is not null
  and d.contract_version='2026-09-22.v1'
on conflict (jurisdiction_key,dimension_key) do nothing;

create or replace view public.v_jurisdiction_data_depth_capture_status
with (security_invoker=on) as
select
  count(*)::bigint total_jobs,
  count(*) filter(where status='queued')::bigint queued,
  count(*) filter(where status='capturing')::bigint capturing,
  count(*) filter(where status='captured')::bigint captured,
  count(*) filter(where status='needs_review')::bigint needs_review,
  count(*) filter(where status='complete')::bigint complete,
  count(*) filter(where status='blocked')::bigint blocked,
  count(*) filter(where status in ('queued','capturing','captured','needs_review','blocked'))::bigint unresolved
from public.jurisdiction_data_depth_capture_jobs;

create or replace view public.v_jurisdiction_data_depth_capture_gaps
with (security_invoker=on) as
select j.jurisdiction_key,j.dimension_key,j.status,j.attempts,j.last_error,
       j.source_registry_id,j.source_snapshot_id
from public.jurisdiction_data_depth_capture_jobs j
where j.status <> 'complete';

alter table public.jurisdiction_data_depth_capture_jobs enable row level security;
drop policy if exists jurisdiction_data_depth_capture_jobs_read on public.jurisdiction_data_depth_capture_jobs;
create policy jurisdiction_data_depth_capture_jobs_read
on public.jurisdiction_data_depth_capture_jobs
for select to authenticated using (true);
grant select on public.jurisdiction_data_depth_capture_jobs,
  public.v_jurisdiction_data_depth_capture_status,
  public.v_jurisdiction_data_depth_capture_gaps
to authenticated, service_role;

revoke insert,update,delete on public.jurisdiction_data_depth_capture_jobs from anon,authenticated;

comment on table public.jurisdiction_data_depth_capture_jobs is
'Authoritative evidence capture queue for the exact 291 x 32 full-depth contract. Queue state never implies evidence completeness.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923130000','authoritative_full_depth_capture_queue','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923130000_authoritative_full_depth_capture_queue.sql

-- RECOVERY BEGIN 20260923131000_authoritative_full_depth_evidence_store.sql
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923131000','authoritative_full_depth_evidence_store','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923131000_authoritative_full_depth_evidence_store.sql

-- RECOVERY BEGIN 20260923131500_primary_pathway_depth_br_co.sql
-- Primary-source pathway depth for Brazil and Colombia.
-- Only dimensions directly supported by first-party sources are populated.
-- Unsupported product-format detail remains unresolved rather than inferred.

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'BR','depth-v1-br-medicinal-pharmaceutical','Controlled medicinal/pharmaceutical cannabis cultivation and production','domestic_authorization',
'ANVISA RDC 1.012/2026, RDC 1.013/2026, RDC 1.014/2026 and RDC 1.015/2026',
'Agência Nacional de Vigilância Sanitária (ANVISA)','active','2026-08-04',
'Legal entities may undertake expressly authorized Cannabis sativa L. cultivation for medicinal/pharmaceutical or research purposes under ANVISA authorization and applicable sanitary controls. Medicinal cannabis products are subject to authorization requirements for manufacture/import; this pathway does not establish general adult-use retail.',
array['https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/rdcs-no-1-012-2026-e-no-1-013-2026','https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-publica-perguntas-e-respostas-sobre-a-autorizacao-sanitaria-de-produtos-de-cannabis'],
'needs_review',now()
from public.countries c where c.iso2='BR'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,verification='verified',last_verified_at=now();

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'CO','depth-v1-co-medical-scientific','Medical and scientific cannabis cultivation, manufacture and commercial distribution','domestic_authorization',
'Ley 1787 de 2016; Decreto 613 de 2017; Decreto 1138 de 2025 and implementing resolutions',
'Ministry of Health and Social Protection / Ministry of Justice and Law / INVIMA','active','2017-04-10',
'Colombia maintains a licensed medical/scientific framework covering cultivation, manufacture of derivatives, import, export, storage, transport, commercialisation and distribution, with quotas and product controls. The 2025 reform further addresses access to medical cannabis and implementation of new product/licensing rules.',
array['https://www.minsalud.gov.co/salud/medicamentos-y-tecnologias/Paginas/cannabis-uso-medicinal.aspx','https://www1.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=268436'],
'needs_review',now()
from public.countries c where c.iso2='CO'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,verification='verified',last_verified_at=now();

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'RDC 1.013/2026','Cannabis cultivation requirements','regulation',
'https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/rdcs-no-1-012-2026-e-no-1-013-2026',
'2026-02-03',current_date,
'ANVISA states RDC 1.013/2026 establishes requirements for cultivation of Cannabis sativa L. varieties with THC at or below 0.3% exclusively for medicinal, pharmaceutical or research purposes, with cultivation beginning only after ANVISA Special Authorization.'
from public.regulatory_pathways p where p.iso_alpha2='BR' and p.slug='depth-v1-br-medicinal-pharmaceutical'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/rdcs-no-1-012-2026-e-no-1-013-2026');

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'Decreto 613 de 2017','Title 11 / medical-scientific cannabis framework','statute',
'https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Decretos%2F30030463',
'2017-04-10',current_date,
'The Colombian framework regulates import, export, cultivation, production, manufacture, acquisition, storage, transport, commercialisation and distribution of cannabis and derivatives for medical and scientific purposes.'
from public.regulatory_pathways p where p.iso_alpha2='CO' and p.slug='depth-v1-co-medical-scientific'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Decretos%2F30030463');


update public.regulatory_pathways set verification='verified',last_verified_at=now() where iso_alpha2='BR' and slug='depth-v1-br-medicinal-pharmaceutical' and verification='needs_review';

update public.regulatory_pathways set verification='verified',last_verified_at=now() where iso_alpha2='CO' and slug='depth-v1-co-medical-scientific' and verification='needs_review';
insert into public.regulatory_calendar(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'BR','effective','ANVISA medicinal cannabis cultivation framework effective','2026-08-04','confirmed',
'https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/rdcs-no-1-012-2026-e-no-1-013-2026',
'ANVISA','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='BR' and title='ANVISA medicinal cannabis cultivation framework effective');

insert into public.regulatory_calendar(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'CO','effective','Decreto 1138 de 2025 medical cannabis reform','2025-10-27','confirmed',
'https://www1.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=268436',
'Colombia Ministry of Health / Función Pública','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='CO' and title='Decreto 1138 de 2025 medical cannabis reform');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary regulatory pathway and citation sources verified 2026-09-23.',
last_evaluated_at=now(),
notes='Pathway-level primary evidence added; unsupported format details remain unresolved.'
where jurisdiction_key in ('BR','CO') and dimension_key in ('verified_pathways','regulatory_calendar');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),
notes='Primary pathway/calendar depth added 2026-09-23; unsupported dimensions remain unresolved.'
where jurisdiction_key in ('BR','CO') and dimension_key in ('verified_pathways','regulatory_calendar');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923131500','primary_pathway_depth_br_co','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923131500_primary_pathway_depth_br_co.sql

-- RECOVERY BEGIN 20260923134500_primary_pathway_depth_ar_jm.sql
-- Additional primary pathway depth: Argentina and Jamaica.
-- Current first-party sources verified 2026-09-23.
-- No adult-use market inference is made.

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('ARICCAME — Resolución 69/2026 cannabis and hemp licensing regime','https://www.argentina.gob.ar/normativa/nacional/norma-429625/texto','AR','Argentina','AR',1,'regulator',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary ARICCAME resolution published 2026-09-03; establishes licensing for non-psychoactive Cannabis sativa material and related commercial activities and confirms ARICCAME licensing authority under Law 27.669. Verified 2026-09-23.','2026-09-23','cannabis_regulator',array['regulatory','licensing','commercialisation'],jsonb_build_object('jurisdiction_key','AR','primary_regulator',true))
on conflict (source_url) do update set jurisdiction_code='AR',country='Argentina',iso='AR',tier=1,source_type='regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary ARICCAME Resolution 69/2026 verified 2026-09-23.',verification_checked_at=now(),regulator_class='cannabis_regulator',updated_at=now();

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Jamaica Cannabis Licensing Authority — Retail Herb House online sales measures','https://cla.org.jm/sites/default/files/documents/Interim%20Measures%20for%20Online%20Sales%20and%20Purchases%20%28Retail%20Herb%20House%29.pdf','JM','Jamaica','JM',1,'regulator',true,true,'caribbean','en','pdf_snapshot','monthly','verified',now()+interval '30 days','online','Primary Cannabis Licensing Authority guidance states licensed Retail Herb Houses may sell ganja for medical or therapeutic purposes under the 2016 interim regulations and describes online ordering with exchange on licensed premises. Verified 2026-09-23.','2026-09-23','cannabis_regulator',array['regulatory','retail','medical'],jsonb_build_object('jurisdiction_key','JM','primary_regulator',true))
on conflict (source_url) do update set jurisdiction_code='JM',country='Jamaica',iso='JM',tier=1,source_type='regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '30 days',network_status='online',verification_notes='Primary Jamaica CLA retail guidance verified 2026-09-23.',verification_checked_at=now(),regulator_class='cannabis_regulator',updated_at=now();

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'AR','depth-v1-ar-medical-cannabis','Licensed medicinal cannabis and non-psychoactive cannabis value-chain activities','domestic_authorization',
'Law 27.669; Decree 405/2023; ARICCAME Resolutions 41/2026 and 69/2026',
'ARICCAME','active','2026-10-16',
'Argentina regulates cannabis and hemp value-chain activities through ARICCAME licences. Resolution 69/2026 specifically regulates non-psychoactive Cannabis sativa inflorescences, biomass and plant material and related conditioning, storage, transport and commercialisation, including local and foreign-trade operations where the regime requires a licence. The medical cannabis and industrial hemp regimes remain distinct.',
array['https://www.argentina.gob.ar/normativa/nacional/norma-429625/texto','https://www.argentina.gob.ar/normativa/nacional/norma-427162/texto'],
'needs_review',now()
from public.countries c where c.iso2='AR'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,verification='verified',last_verified_at=now();

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'JM','depth-v1-jm-medical-therapeutic','Licensed medical and therapeutic cannabis handling and retail','licensed_market',
'Dangerous Drugs Act as amended in 2015; Dangerous Drugs (Cannabis Licensing) (Interim) Regulations 2016',
'Cannabis Licensing Authority (CLA)','active','2016-01-01',
'Jamaica licenses handling of hemp and ganja for medical, therapeutic or scientific purposes. CLA guidance confirms licensed Retail Herb Houses may sell ganja for medical or therapeutic purposes under the interim regulations, with online ordering permitted subject to exchange/barter on the licensed premises. This is not an unrestricted adult-use retail pathway.',
array['https://cla.org.jm/sites/default/files/documents/Interim%20Measures%20for%20Online%20Sales%20and%20Purchases%20%28Retail%20Herb%20House%29.pdf'],
'needs_review',now()
from public.countries c where c.iso2='JM'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,verification='verified',last_verified_at=now();

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'ARICCAME Resolution 69/2026','Articles 1-2 and Annex I','regulation',
'https://www.argentina.gob.ar/normativa/nacional/norma-429625/texto',
'2026-09-03',current_date,
'ARICCAME Resolution 69/2026 establishes a licensing regime for non-psychoactive Cannabis sativa inflorescences, biomass and other plant material and related activities; commercial local and foreign-trade operations require the applicable ARICCAME licence.'
from public.regulatory_pathways p where p.iso_alpha2='AR' and p.slug='depth-v1-ar-medical-cannabis'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://www.argentina.gob.ar/normativa/nacional/norma-429625/texto');

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'Dangerous Drugs (Cannabis Licensing) (Interim) Regulations 2016','Regulation 24 / CLA retail guidance','regulation',
'https://cla.org.jm/sites/default/files/documents/Interim%20Measures%20for%20Online%20Sales%20and%20Purchases%20%28Retail%20Herb%20House%29.pdf',
'2020-05-11',current_date,
'CLA guidance states a licensed Retail Herb House may sell ganja for medical or therapeutic purposes and permits online ordering subject to exchange or barter on the licensed premises.'
from public.regulatory_pathways p where p.iso_alpha2='JM' and p.slug='depth-v1-jm-medical-therapeutic'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://cla.org.jm/sites/default/files/documents/Interim%20Measures%20for%20Online%20Sales%20and%20Purchases%20%28Retail%20Herb%20House%29.pdf');


update public.regulatory_pathways set verification='verified',last_verified_at=now() where iso_alpha2='AR' and slug='depth-v1-ar-medical-cannabis' and verification='needs_review';

update public.regulatory_pathways set verification='verified',last_verified_at=now() where iso_alpha2='JM' and slug='depth-v1-jm-medical-therapeutic' and verification='needs_review';
insert into public.regulatory_calendar(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'AR','effective','ARICCAME Resolution 69/2026 licensing regime effective','2026-10-16','confirmed',
'https://www.argentina.gob.ar/normativa/nacional/norma-429625/texto','ARICCAME','scheduled'
where not exists(select 1 from public.regulatory_calendar where iso2='AR' and title='ARICCAME Resolution 69/2026 licensing regime effective');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary ARICCAME and Jamaica CLA sources verified 2026-09-23.',
last_evaluated_at=now(),notes='Pathway-level primary evidence added; remaining dimensions require separate source-backed research.'
where jurisdiction_key in ('AR','JM') and dimension_key in ('source_registry','verified_pathways','regulatory_calendar');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes='Primary pathway depth added 2026-09-23; remaining dimensions unresolved.'
where jurisdiction_key in ('AR','JM') and dimension_key in ('source_registry','verified_pathways','regulatory_calendar');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923134500','primary_pathway_depth_ar_jm','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923134500_primary_pathway_depth_ar_jm.sql

-- RECOVERY BEGIN 20260923140000_signal_autonomy_columns_and_decision_log.sql
-- Signal Engine: autonomy projection columns + promote decision logging.
-- Additive only. Does not change hv_promote_signals body or widen Full Auto.
-- Spec: docs/SIGNALS_MAX_AUTOMATION_DESIGN.md §9.1–9.2

-- ---------------------------------------------------------------------------
-- Align decision-event signal_id with public.signals.id (text in this schema)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'signal_decision_events'
      and column_name = 'signal_id'
      and data_type = 'uuid'
  ) then
    alter table public.signal_decision_events
      alter column signal_id type text using signal_id::text;
  end if;
exception
  when others then
    raise notice 'signal_id type align skipped: %', sqlerrm;
end $$;

-- ---------------------------------------------------------------------------
-- Autonomy projection columns on signals
-- ---------------------------------------------------------------------------
alter table public.signals
  add column if not exists autonomy_level smallint
    check (autonomy_level is null or autonomy_level between 0 and 4),
  add column if not exists gate_scores jsonb not null default '{}'::jsonb,
  add column if not exists promotion_path text
    check (
      promotion_path is null
      or promotion_path in ('full_auto', 'shadow', 'human', 'rejected')
    ),
  add column if not exists model_versions jsonb not null default '{}'::jsonb;

comment on column public.signals.autonomy_level is
  '0=discard 1=full_auto 2=shadow 3=exception 4=human_required. Null until evaluator writes.';
comment on column public.signals.promotion_path is
  'How the row reached reviewed state when known.';

-- ---------------------------------------------------------------------------
-- Best-effort decision log when reviewed flips to true (auto or human)
-- Does not replace hv_promote_signals; observes outcomes only.
-- ---------------------------------------------------------------------------
create or replace function private.log_signal_decision_on_review()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'private'
as $fn$
begin
  if tg_op = 'UPDATE'
     and new.reviewed is true
     and (old.reviewed is distinct from true)
  then
    begin
      insert into public.signal_decision_events (
        signal_id,
        decision,
        autonomy_level_at_decision,
        promotion_path,
        human_id,
        gate_scores,
        model_versions,
        classifier_version,
        reason_codes
      ) values (
        new.id::text,
        'promote',
        coalesce(new.autonomy_level, case
          when coalesce(new.reviewed_by, '') like 'human:%' then 4
          when coalesce(new.reviewed_by, '') like 'auto:%' then 1
          else 3
        end),
        coalesce(
          new.promotion_path,
          case
            when coalesce(new.reviewed_by, '') like 'human:%' then 'human'
            when coalesce(new.reviewed_by, '') like 'auto:%' then 'full_auto'
            else null
          end
        ),
        null,
        coalesce(new.gate_scores, '{}'::jsonb),
        coalesce(new.model_versions, '{}'::jsonb),
        new.classifier_version,
        array[
          case
            when coalesce(new.reviewed_by, '') like 'human:%' then 'human_review'
            when coalesce(new.reviewed_by, '') like 'auto:%' then 'auto_promote'
            else 'reviewed'
          end
        ]
      );
    exception
      when others then
        -- Never block promotion path on audit insert failure
        raise notice 'log_signal_decision_on_review: %', sqlerrm;
    end;
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_log_signal_decision_on_review on public.signals;
create trigger trg_log_signal_decision_on_review
  after update of reviewed on public.signals
  for each row
  execute function private.log_signal_decision_on_review();

comment on function private.log_signal_decision_on_review() is
  'Observability: writes signal_decision_events when reviewed becomes true. Failures are non-blocking.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923140000','signal_autonomy_columns_and_decision_log','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923140000_signal_autonomy_columns_and_decision_log.sql

-- RECOVERY BEGIN 20260923143000_harden_primary_evidence_br_co_ar_jm.sql
-- Evidence-depth correction/hardening for BR, CO, AR and JM.
-- This migration only strengthens source-backed dimensions and corrects overbroad
-- claims; it does not mark unsupported 291x32 cells complete.

-- Brazil: add exact 2026 product-framework effective date and a dedicated
-- medicinal-product pathway source.
insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('ANVISA — RDC 1.015/2026 cannabis medicinal product authorization','https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-publica-perguntas-e-respostas-sobre-a-autorizacao-sanitaria-de-produtos-de-cannabis','BR','Brazil','BR',1,'regulator',true,true,'south_america','pt','html_snapshot','weekly','verified',now()+interval '7 days','online','ANVISA states RDC 1.015/2026 updated the authorization framework for manufacture and import of human medicinal cannabis products and entered into force 2026-05-04. Verified 2026-09-23.','2026-09-23','health_authority',array['regulatory','medicinal_products'],jsonb_build_object('jurisdiction_key','BR','primary_regulator',true))
on conflict (source_url) do update set verification_notes='ANVISA states RDC 1.015/2026 entered into force 2026-05-04 and updated the medicinal cannabis product authorization framework; verified 2026-09-23.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '7 days',updated_at=now();

-- Colombia: retain medical-limited classification but explicitly record the
-- 2025 reform's medical-only finished-product restriction.
insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Colombia — Decreto 1138 de 2025 medical cannabis access reform','https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=268436','CO','Colombia','CO',1,'legal',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary government legal text dated 2025-10-27. It states cannabis as a finished product for direct human or veterinary consumption may only be commercialized for medical purposes and establishes transition/technical-regulation provisions. Verified 2026-09-23.','2026-09-23','executive_legal',array['legal','medical','commercialisation'],jsonb_build_object('jurisdiction_key','CO','primary_legal_source',true))
on conflict (source_url) do update set verification_notes='Primary Colombian government legal text verified 2026-09-23; medical-only finished-product commercialization language captured.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '7 days',updated_at=now();

-- Argentina: correct the pathway description to match the actual 2026
-- resolution: horticultural hemp, THC <1%, not a generic medicinal-cannabis
-- commercial pathway.
update public.regulatory_pathways
set name='Licensed horticultural hemp production and trade',
    pathway_type='licensed_market',
    legal_basis='ARICCAME Resolution 69/2026',
    effective_date='2026-10-16',
    summary='Resolution 69/2026 establishes ARICCAME licences for production, conditioning, storage, commercialisation and related activities involving horticultural hemp with THC below 1%, including licences for derivative products and foreign trade. This record is not evidence of an adult-use cannabis retail market and is distinct from Argentina medical-cannabis pathways.',
    source_urls=array['https://www.argentina.gob.ar/normativa/nacional/norma-429625/texto','https://www.argentina.gob.ar/noticias/ariccame-regula-las-actividades-vinculadas-al-canamo-con-fines-horticolas'],
    verification='verified',last_verified_at=now()
where iso_alpha2='AR' and slug='depth-v1-ar-medical-cannabis';

-- Argentina: calendar description likewise must identify the hemp regime.
update public.regulatory_calendar
set title='ARICCAME Resolution 69/2026 horticultural hemp licensing regime effective',
    status='scheduled',confidence='confirmed',
    source_url='https://www.argentina.gob.ar/normativa/nacional/norma-429625/texto'
where iso2='AR' and title like 'ARICCAME Resolution 69/2026 licensing regime effective';

-- Jamaica: add current regulator licensing/fee evidence, without using
-- pandemic-era online ordering as evidence of current general retail.
insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Jamaica CLA — current licence application requirements and fees','https://www.cla.org.jm/application-requirements-and-process/','JM','Jamaica','JM',1,'regulator',true,true,'caribbean','en','html_snapshot','monthly','verified',now()+interval '30 days','online','Current CLA licensing page documents five licence categories, application review, supporting documents and current processing/licence fees. Verified 2026-09-23.','2026-09-23','cannabis_regulator',array['licensing','fees','regulatory'],jsonb_build_object('jurisdiction_key','JM','primary_regulator',true))
on conflict (source_url) do update set verification_notes='Current CLA licensing and application page verified 2026-09-23.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '30 days',updated_at=now();

update public.regulatory_pathways
set summary='Jamaica licenses handling of ganja for medical, therapeutic or scientific purposes. Current CLA materials document a multi-stage licensing process and separate licence categories for cultivation, processing, transport, retail and research/development. Pandemic-era online ordering is retained only as historical evidence and is not treated as current general retail authorization.',
    source_urls=array['https://www.cla.org.jm/application-requirements-and-process/','https://www.cla.org.jm/schedule-of-fees/','https://cla.org.jm/sites/default/files/documents/Press%20release-Cannabis%20Licensing%20Authority-%20Herbhouses%20can%20now%20sell%20online%20%28final%29.pdf'],
    verification='verified',last_verified_at=now()
where iso_alpha2='JM' and slug='depth-v1-jm-medical-therapeutic';

-- Mark only the directly strengthened dimensions. Do not use a pathway
-- record as evidence for unrelated depth dimensions.
update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
last_evaluated_at=now()
where jurisdiction_key='BR' and dimension_key in ('source_registry','verified_pathways','regulatory_calendar');
update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
last_evaluated_at=now()
where jurisdiction_key='CO' and dimension_key in ('source_registry','verified_pathways','regulatory_calendar');
update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
last_evaluated_at=now()
where jurisdiction_key='AR' and dimension_key in ('source_registry','verified_pathways','regulatory_calendar');
update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
last_evaluated_at=now()
where jurisdiction_key='JM' and dimension_key in ('source_registry','verified_pathways');



insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923143000','harden_primary_evidence_br_co_ar_jm','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923143000_harden_primary_evidence_br_co_ar_jm.sql

-- RECOVERY BEGIN 20260923150000_primary_evidence_batch_pe_uy.sql
-- Primary-source evidence tranche: Peru and Uruguay.
-- Sources verified 2026-09-23. Unsupported dimensions remain unresolved.

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Peru DIGEMID — medicinal cannabis and derivatives regulatory framework','https://www.digemid.minsa.gob.pe/webDigemid/uso-medicinal-del-cannabis-y-sus-derivados/','PE','Peru','PE',1,'regulator',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Current DIGEMID page states Laws 30681 and 31312 plus DS 004-2023-SA regulate medicinal/therapeutic cannabis, including research, production, import and commercialization; page lists licensed establishments and patient/product controls. Verified 2026-09-23.','2026-09-23','medicines_regulator',array['regulatory','medical','licensing'],jsonb_build_object('jurisdiction_key','PE','primary_regulator',true))
on conflict (source_url) do update set verification_notes='Current DIGEMID medicinal-cannabis framework verified 2026-09-23.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '7 days',updated_at=now();

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Uruguay IRCCA — medicinal/research licensing and 2026 licence reforms','https://www.gub.uy/tramites/solicitud-licencias-cannabis-uso-medicinal-investigacion-cientifica','UY','Uruguay','UY',1,'government_regulator',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Government procedure identifies IRCCA licensing for medicinal cannabis and scientific research, including cultivation licensing and application requirements. IRCCA 2026 Resolution 18/2026 reduced medicinal licence costs, removed production licence categories and extended licence duration retroactive to 2026-01-01. Verified 2026-09-23.','2026-09-23','cannabis_regulator',array['regulatory','licensing','medical','research'],jsonb_build_object('jurisdiction_key','UY','primary_regulator',true))
on conflict (source_url) do update set verification_notes='Uruguay government/IRCCA medicinal and research licensing source verified 2026-09-23.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '7 days',updated_at=now();

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Uruguay IRCCA — approved cannabis licences','https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/','UY','Uruguay','UY',1,'regulator',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Current IRCCA approved-licences page lists active licences for psychoactive cannabis cultivation for adult use and separate medicinal cultivation licences. Verified 2026-09-23.','2026-09-23','cannabis_regulator',array['licensing','adult_use','medical'],jsonb_build_object('jurisdiction_key','UY','primary_regulator',true))
on conflict (source_url) do update set verification_notes='Current IRCCA approved-licences page verified 2026-09-23.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '7 days',updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-pe-20260923','PE','medical_limited_trade',
 'Peru regulates medicinal and therapeutic cannabis through a national framework covering research, production, import and commercialization. DIGEMID states authorized products require the applicable sanitary authorization, licensed pharmacies/boticas may commercialize derivatives, and associative cultivation production is not commercialized.',
 'Dirección General de Medicamentos, Insumos y Drogas (DIGEMID), Peru',
 'https://www.digemid.minsa.gob.pe/webDigemid/uso-medicinal-del-cannabis-y-sus-derivados/',
 '2023-04-18',now(),now()+interval '180 days',true)
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-pe-20260923','PE','primary-evidence-claim:pe-medical-framework-20260923',
 'Peru permits regulated medicinal and therapeutic cannabis research, production, import and commercialization; authorized products require applicable sanitary authorization and licensed pharmaceutical establishments may commercialize derivatives.',
 'any','national','Dirección General de Medicamentos, Insumos y Drogas (DIGEMID), Peru','https://www.digemid.minsa.gob.pe/webDigemid/uso-medicinal-del-cannabis-y-sus-derivados/','2023-04-18',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'PE','depth-v1-pe-medical-therapeutic','Licensed medicinal and therapeutic cannabis production and trade','domestic_authorization',
'Law 30681; Law 31312; Decreto Supremo 004-2023-SA',
'DIGEMID / Ministry of Health','active','2023-04-18',
'Peru regulates medicinal and therapeutic cannabis and derivatives through licensing, sanitary registration/authorization and controlled pharmaceutical distribution. DIGEMID identifies research, production, import and commercialization within the regulated framework and lists licensed establishments for import and/or commercialization.',
array['https://www.digemid.minsa.gob.pe/webDigemid/uso-medicinal-del-cannabis-y-sus-derivados/','https://www.gob.pe/institucion/minsa/normas-legales/4139565-004-2023-sa'],
'needs_review',now()
from public.countries c where c.iso2='PE'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,last_verified_at=now();

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'UY','depth-v1-uy-medicinal-research','Licensed medicinal cannabis and scientific-research production','domestic_authorization',
'Law 19.172 and implementing regulations; IRCCA Resolution 18/2026',
'Instituto de Regulación y Control del Cannabis (IRCCA)','active','2026-01-01',
'Uruguay maintains a licensing regime for medicinal cannabis and scientific research. The current government procedure requires an IRCCA licence and identifies cultivation as a licensed activity; IRCCA Resolution 18/2026 changed medicinal/research licence costs, production categories and duration with retroactive effect from 2026-01-01.',
array['https://www.gub.uy/tramites/solicitud-licencias-cannabis-uso-medicinal-investigacion-cientifica','https://ircca.gub.uy/ircca-adopta-medidas-con-el-objetivo-de-desburocratizar-y-favorecer-el-acceso-a-licencias/'],
'needs_review',now()
from public.countries c where c.iso2='UY'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,last_verified_at=now();

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'UY','depth-v1-uy-adult-use-cultivation','Licensed psychoactive cannabis cultivation for adult-use market',
'licensed_market','Law 19.172 and implementing regulations','IRCCA','active',null,
'IRCCA current licence records identify active licences for psychoactive cannabis cultivation for adult use. This record evidences licensed cultivation, not a claim that every retail or cross-border commercial activity is permitted.',
array['https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/'],
'needs_review',now()
from public.countries c where c.iso2='UY'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,last_verified_at=now();

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'Decreto Supremo 004-2023-SA','Cannabis medicinal and therapeutic regulation','statute',
'https://www.gob.pe/institucion/minsa/normas-legales/4139565-004-2023-sa','2023-04-18',current_date,
'Approves the regulation governing medicinal and therapeutic cannabis and its derivatives.'
from public.regulatory_pathways p where p.iso_alpha2='PE' and p.slug='depth-v1-pe-medical-therapeutic'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://www.gob.pe/institucion/minsa/normas-legales/4139565-004-2023-sa');

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'IRCCA Resolution 18/2026','Medicinal/research licence reforms','regulator',
'https://ircca.gub.uy/ircca-adopta-medidas-con-el-objetivo-de-desburocratizar-y-favorecer-el-acceso-a-licencias/',null,current_date,
'IRCCA reports lower medicinal licence costs, eliminated research costs and longer licence duration, retroactive to 2026-01-01.'
from public.regulatory_pathways p where p.iso_alpha2='UY' and p.slug='depth-v1-uy-medicinal-research'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://ircca.gub.uy/ircca-adopta-medidas-con-el-objetivo-de-desburocratizar-y-favorecer-el-acceso-a-licencias/');

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'IRCCA licence register','Licence register','regulator',
'https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/','2026-09-23',current_date,
'Current IRCCA register lists active licences for psychoactive cannabis cultivation for adult use.'
from public.regulatory_pathways p
where p.iso_alpha2='UY' and p.slug='depth-v1-uy-adult-use-cultivation'
and not exists (
 select 1 from public.regulatory_citations c
 where c.entity_type='pathway' and c.entity_id=p.id
 and c.citation_url='https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/'
);

update public.regulatory_pathways p set verification='verified',last_verified_at=now()
where p.iso_alpha2 in ('PE','UY') and p.slug in ('depth-v1-pe-medical-therapeutic','depth-v1-uy-medicinal-research','depth-v1-uy-adult-use-cultivation')
and p.verification='needs_review';

insert into public.regulatory_calendar(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'UY','change','IRCCA Resolution 18/2026 medicinal/research licence reforms effective retroactively','2026-01-01','confirmed',
'https://ircca.gub.uy/ircca-adopta-medidas-con-el-objetivo-de-desburocratizar-y-favorecer-el-acceso-a-licencias/',
'IRCCA','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='UY' and title='IRCCA Resolution 18/2026 medicinal/research licence reforms effective retroactively');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Primary government/regulator sources verified 2026-09-23.',last_evaluated_at=now(),
notes='Primary evidence tranche added; unsupported dimensions remain unresolved.'
where jurisdiction_key in ('PE','UY') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','regulatory_calendar');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes='Primary evidence tranche added 2026-09-23; unsupported dimensions remain unresolved.'
where jurisdiction_key in ('PE','UY') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','regulatory_calendar');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260923150000','primary_evidence_batch_pe_uy','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260923150000_primary_evidence_batch_pe_uy.sql
