-- Full-depth intelligence contract for the canonical 291-jurisdiction universe.
-- This migration creates measurement metadata only. It does not fabricate facts or
-- populate missing jurisdiction intelligence.
create table if not exists public.jurisdiction_data_depth_dimensions (
  dimension_key text primary key,
  display_name text not null,
  layer text not null,
  description text not null,
  required_for_regulatory_publication boolean not null default false,
  requires_primary_source boolean not null default false,
  freshness_days integer,
  sort_order integer not null,
  contract_version text not null default '2026-09-22.v1',
  created_at timestamptz not null default now(),
  constraint jurisdiction_data_depth_dimensions_freshness_nonnegative
    check (freshness_days is null or freshness_days >= 0)
);

insert into public.jurisdiction_data_depth_dimensions
  (dimension_key, display_name, layer, description, required_for_regulatory_publication, requires_primary_source, freshness_days, sort_order)
values
('identity','Identity','foundation','Canonical jurisdiction identity and stable key.',false,false,null,10),
('hierarchy','Jurisdiction hierarchy','foundation','Parent, child, level and hierarchy integrity.',false,false,null,20),
('regulatory_status','Regulatory status','regulatory','Current legal/regulatory status.',true,true,30,30),
('regulatory_tier','Regulatory tier','regulatory','Commercial market-access tier backed by evidence.',true,true,30,40),
('source_registry','Primary-source registry','evidence','Authoritative source registration.',true,true,90,50),
('source_snapshot','Primary-source snapshot','evidence','Successful immutable source capture with provenance.',true,true,30,60),
('claims','Claim-level evidence','evidence','Atomic regulatory claims with evidence linkage.',true,true,30,70),
('pathways','Licensing pathways','regulatory','Commercial/medical/licensing pathways and requirements.',true,true,30,80),
('format_rules','Product/form-factor rules','regulatory','Product classes and format-specific rules.',true,true,30,90),
('access_rules','Possession/access rules','regulatory','Possession, patient/consumer access and eligibility.',true,true,30,100),
('commercial_activity','Commercial activity rules','regulatory','Allowed commercial activities and constraints.',true,true,30,110),
('import','Import rules','trade','Import permissions, licences and restrictions.',true,true,30,120),
('export','Export rules','trade','Export permissions, licences and restrictions.',true,true,30,130),
('distribution','Distribution rules','trade','Distribution/wholesale channel requirements.',true,true,30,140),
('testing','Testing requirements','compliance','Testing and laboratory requirements.',true,true,60,150),
('packaging_labeling','Packaging/labeling','compliance','Packaging, labeling and disclosure requirements.',true,true,60,160),
('tax_fees','Taxation/fees','commercial','Taxes, duties, licence and application fees.',true,true,60,170),
('regulator','Regulator/contact authority','governance','Responsible authority and authoritative contact surface.',true,true,90,180),
('calendar','Regulatory calendar','regulatory','Known effective dates, deadlines and pending changes.',true,true,14,190),
('change_history','Regulatory change history','history','Historical regulatory changes with source/effective dates.',false,true,30,200),
('market_metrics','Market metrics','commercial','Structured market-size, sales and other metrics with periods.',false,false,30,210),
('trade_flows','Trade flows','commercial','Structured origin/destination/product trade observations.',false,false,90,220),
('participants','Market participants','network','Known licensed/commercial market entities.',false,false,30,230),
('buyers','Buyer intelligence','network','Qualified buyer requirements and demand signals.',false,false,30,240),
('sellers','Seller intelligence','network','Qualified seller capabilities and supply signals.',false,false,30,250),
('counterparties','Counterparty intelligence','network','Entity records, roles, qualification and diligence state.',false,false,30,260),
('relationships','Relationships/network edges','network','Evidence-backed relationships between market entities.',false,false,30,270),
('opportunities','Commercial opportunities','commercial','Evidence-backed opportunities and eligibility constraints.',false,false,14,280),
('signals','Intelligence signals','intelligence','Fresh, classified market/regulatory signals.',false,false,7,290),
('freshness','Source/data freshness','quality','System-wide freshness and expiry state.',false,false,7,300),
('uncertainty','Conflict/uncertainty state','quality','Explicit conflicting, stale, inferred and blocked states.',false,false,7,310),
('research_queue','Research queue/unresolved gaps','quality','Explicit unresolved research and evidence gaps.',false,false,7,320)
on conflict (dimension_key) do update set
  display_name=excluded.display_name,
  layer=excluded.layer,
  description=excluded.description,
  required_for_regulatory_publication=excluded.required_for_regulatory_publication,
  requires_primary_source=excluded.requires_primary_source,
  freshness_days=excluded.freshness_days,
  sort_order=excluded.sort_order,
  contract_version=excluded.contract_version;

create or replace view public.v_jurisdiction_data_depth_contract
with (security_invoker = on) as
select
  c.iso_alpha2 as jurisdiction_key,
  c.country_name,
  d.dimension_key,
  d.display_name,
  d.layer,
  d.required_for_regulatory_publication,
  d.requires_primary_source,
  case
    when d.dimension_key='identity' then 'complete'
    when d.dimension_key='hierarchy' then
      case when c.iso_alpha2 is not null then 'complete' else 'missing' end
    when d.dimension_key='regulatory_tier' then
      case when c.verified_regulatory_tier is not null then 'complete' else 'blocked' end
    when d.dimension_key='source_registry' then
      case when coalesce(x.registered_source_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='source_snapshot' then
      case when coalesce(x.successful_snapshot_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='claims' then
      case when coalesce(x.verified_claim_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='pathways' then
      case when coalesce(x.verified_pathway_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='format_rules' then
      case when coalesce(x.verified_format_rule_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='market_metrics' then
      case when coalesce(x.metric_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='trade_flows' then
      case when coalesce(x.trade_flow_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='signals' then
      case when coalesce(x.signal_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='calendar' then
      case when coalesce(x.calendar_rows,0)>0 then 'complete' else 'missing' end
    when d.dimension_key='freshness' then
      case when coalesce(x.latest_snapshot_at, x.latest_source_check) is not null then 'measured' else 'missing' end
    else 'unmeasured'
  end as status,
  case
    when d.dimension_key in ('identity','hierarchy') then null
    when d.dimension_key in ('regulatory_tier','source_registry','source_snapshot','claims','pathways','format_rules',
                             'market_metrics','trade_flows','signals','calendar')
      and (
        case d.dimension_key
          when 'regulatory_tier' then c.verified_regulatory_tier is not null
          when 'source_registry' then coalesce(x.registered_source_rows,0)>0
          when 'source_snapshot' then coalesce(x.successful_snapshot_rows,0)>0
          when 'claims' then coalesce(x.verified_claim_rows,0)>0
          when 'pathways' then coalesce(x.verified_pathway_rows,0)>0
          when 'format_rules' then coalesce(x.verified_format_rule_rows,0)>0
          when 'market_metrics' then coalesce(x.metric_rows,0)>0
          when 'trade_flows' then coalesce(x.trade_flow_rows,0)>0
          when 'signals' then coalesce(x.signal_rows,0)>0
          when 'calendar' then coalesce(x.calendar_rows,0)>0
          else false
        end
      ) then 'evidence_present'
    else 'not_yet_measured'
  end as evidence_state,
  d.contract_version
from public.countries c
cross join public.jurisdiction_data_depth_dimensions d
left join public.v_jurisdiction_data_depth x on x.jurisdiction_key=c.iso_alpha2;

create or replace view public.v_jurisdiction_data_depth_summary
with (security_invoker = on) as
select
  jurisdiction_key,
  country_name,
  count(*) total_contract_dimensions,
  count(*) filter (where status='complete') complete_dimensions,
  count(*) filter (where status='missing') missing_dimensions,
  count(*) filter (where status='blocked') blocked_dimensions,
  count(*) filter (where status='unmeasured') unmeasured_dimensions,
  round(100.0 * count(*) filter (where status='complete') / nullif(count(*),0),2) contract_depth_pct,
  bool_and(not required_for_regulatory_publication or status='complete') as regulatory_publication_ready
from public.v_jurisdiction_data_depth_contract
group by jurisdiction_key,country_name;

comment on table public.jurisdiction_data_depth_dimensions is
'Versioned full-depth intelligence contract. Missing/unmeasured dimensions are not treated as complete.';
comment on view public.v_jurisdiction_data_depth_contract is
'Deterministic dimension-level depth state for the 291-jurisdiction universe. Does not fabricate missing facts.';
comment on view public.v_jurisdiction_data_depth_summary is
'Aggregate depth view. 100% is impossible until every contract dimension is complete or explicitly modeled as not applicable.';

grant select on public.jurisdiction_data_depth_dimensions to anon, authenticated;
grant select on public.v_jurisdiction_data_depth_contract to anon, authenticated;
grant select on public.v_jurisdiction_data_depth_summary to anon, authenticated;
