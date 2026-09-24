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

-- Map the existing evidence system into the 32-dimension state matrix. Jurisdiction intelligence remains a separate analyst-synthesis layer and is not one of the 32 contract dimensions.
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
