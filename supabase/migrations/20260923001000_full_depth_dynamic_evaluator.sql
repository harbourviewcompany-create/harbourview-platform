-- Dynamic evaluator: derives contract state from current evidence instead of freezing
-- completeness at migration time. Unknown applicability remains unresolved.
create or replace view public.v_jurisdiction_data_depth_evaluator
with (security_invoker = on) as
with base as (
  select s.*, c.country_name, c.jurisdiction_level,
         d.required_for_regulatory_publication, d.requires_primary_source, d.freshness_days
  from public.jurisdiction_data_depth_dimension_state s
  join public.countries c on c.iso_alpha2=s.jurisdiction_key
  join public.jurisdiction_data_depth_dimensions d
    on d.dimension_key=s.dimension_key and d.contract_version=s.contract_version
  where s.contract_version='2026-09-22.v1'
),
rule_counts as (
  select jurisdiction_key, rule_dimension, count(*) filter (
    where verification_status='verified'
      and source_url <> ''
      and verified_at is not null
      and (effective_to is null or effective_to >= current_date)
  ) verified_rows,
  count(*) filter (where verification_status='conflict') conflict_rows,
  max(verified_at) filter (where verification_status='verified') latest_verified_at
  from public.jurisdiction_regulatory_rules
  group by jurisdiction_key, rule_dimension
),
regulator_counts as (
  select jurisdiction_key,
         count(*) filter (where verification_status='verified' and source_url <> '' and verified_at is not null) verified_rows,
         count(*) filter (where verification_status='conflict') conflict_rows,
         max(verified_at) filter (where verification_status='verified') latest_verified_at
  from public.jurisdiction_regulators group by jurisdiction_key
),
change_counts as (
  select jurisdiction_key,
         count(*) filter (where verification_status='verified' and source_url <> '' and verified_at is not null and effective_at is not null) verified_rows,
         count(*) filter (where verification_status='conflict') conflict_rows,
         max(verified_at) filter (where verification_status='verified') latest_verified_at
  from public.jurisdiction_regulatory_changes group by jurisdiction_key
),
participant_counts as (
  select jurisdiction_key, participant_type,
         count(*) filter (where verification_status='verified' and source_url <> '' and verified_at is not null) verified_rows,
         count(*) filter (where verification_status='conflict') conflict_rows,
         max(verified_at) filter (where verification_status='verified') latest_verified_at
  from public.jurisdiction_market_participants group by jurisdiction_key, participant_type
),
relationship_counts as (
  select jurisdiction_key,
         count(*) filter (where verification_status='verified' and source_url <> '' and verified_at is not null) verified_rows,
         count(*) filter (where verification_status='conflict') conflict_rows,
         max(verified_at) filter (where verification_status='verified') latest_verified_at
  from public.jurisdiction_relationships group by jurisdiction_key
),
opportunity_counts as (
  select jurisdiction_key,
         count(*) filter (where verification_status='verified' and source_url <> '' and verified_at is not null) verified_rows,
         count(*) filter (where verification_status='conflict') conflict_rows,
         max(verified_at) filter (where verification_status='verified') latest_verified_at
  from public.jurisdiction_opportunities group by jurisdiction_key
),
generic_evidence as (
  select jurisdiction_key,dimension_key,
         count(*) filter(where verification_status='verified') verified_rows,
         count(*) filter(where verification_status='verified' and coalesce(g.qualifying_snapshot,false) and g.captured_url=source_url) qualified_rows,
         count(*) filter(where verification_status='conflict') conflict_rows,
         max(verified_at) filter(where verification_status='verified') latest_verified_at
  from public.jurisdiction_data_depth_evidence e
  left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=e.source_snapshot_id
  group by jurisdiction_key,dimension_key
),
legacy as (
  select * from public.v_jurisdiction_data_depth
),
market_access_snapshot_gate as (
  select
    e.jurisdiction_iso2 as jurisdiction_key,
    count(*) filter (
      where e.active
        and e.verified_at is not null
        and e.expires_at >= now()
    ) as current_verified_rows,
    count(*) filter (
      where e.active
        and e.verified_at is not null
        and e.expires_at >= now()
        and e.source_snapshot_sha256 is not null
        and g.qualifying_snapshot
        and lower(e.source_snapshot_sha256)=lower(g.snapshot_hash)
        and e.authority_url=g.registered_source_url
    ) as qualifying_current_rows
  from public.regulatory_market_access_evidence e
  left join public.v_jurisdiction_verified_snapshot_gate g
    on lower(e.source_snapshot_sha256)=lower(g.snapshot_hash)
   and e.authority_url=g.registered_source_url
  group by e.jurisdiction_iso2
)
select
  b.jurisdiction_key,
  b.country_name,
  b.dimension_key,
  b.display_name,
  b.layer,
  b.required_for_regulatory_publication,
  b.requires_primary_source,
  b.applicability,
  case
    when b.applicability='unknown' then 'unmeasured'
    when b.applicability='not_applicable' then 'complete'
    when b.dimension_key not in ('regulatory_status','regulatory_tier')
      and coalesce(ge.qualified_rows,0)>0 and coalesce(ge.conflict_rows,0)=0 then 'complete'
    when b.dimension_key='identity' then 'complete'
    when b.dimension_key='hierarchy' then b.status
    when b.dimension_key='regulatory_status' then
      case when coalesce(ma.qualifying_current_rows,0)>0 then 'complete'
           when coalesce(ma.current_verified_rows,0)>0 then 'blocked'
           else 'missing' end
    when b.dimension_key='regulatory_tier' then
      case when coalesce(ma.qualifying_current_rows,0)>0
             and c.verified_regulatory_tier is not null then 'complete'
           when c.verified_regulatory_tier is not null then 'blocked'
           else 'missing' end
    when b.dimension_key='source_registry' then
      case when l.active_source_rows>0 and l.official_source_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='source_snapshot' then
      case when l.successful_snapshot_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='claims' then
      case when l.verified_claim_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='pathways' then
      case when l.verified_pathway_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='format_rules' then
      case when l.verified_format_rule_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='access_rules' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='commercial_activity' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='import' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='export' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='distribution' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='testing' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='packaging_labeling' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='tax_fees' then
      case when coalesce(rc.verified_rows,0)>0 and coalesce(rc.conflict_rows,0)=0 then 'complete'
           when coalesce(rc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='regulator' then
      case when coalesce(rgc.verified_rows,0)>0 and coalesce(rgc.conflict_rows,0)=0 then 'complete'
           when coalesce(rgc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='calendar' then
      case when l.calendar_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='change_history' then
      case when coalesce(cc.verified_rows,0)>0 and coalesce(cc.conflict_rows,0)=0 then 'complete'
           when coalesce(cc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='market_metrics' then
      case when l.metric_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='trade_flows' then
      case when l.trade_flow_rows>0 then 'complete' else 'missing' end
    when b.dimension_key in ('participants','buyers','sellers','counterparties') then
      case when coalesce(pc.verified_rows,0)>0 and coalesce(pc.conflict_rows,0)=0 then 'complete'
           when coalesce(pc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='relationships' then
      case when coalesce(rel.verified_rows,0)>0 and coalesce(rel.conflict_rows,0)=0 then 'complete'
           when coalesce(rel.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='opportunities' then
      case when coalesce(oc.verified_rows,0)>0 and coalesce(oc.conflict_rows,0)=0 then 'complete'
           when coalesce(oc.conflict_rows,0)>0 then 'conflict' else 'missing' end
    when b.dimension_key='signals' then
      case when l.signal_rows>0 then 'complete' else 'missing' end
    when b.dimension_key='freshness' then
      case when coalesce(l.latest_evidence_verified_at,l.latest_source_check,l.latest_snapshot_at) is not null then
             case when coalesce(l.latest_evidence_verified_at,l.latest_source_check,l.latest_snapshot_at)
                       + make_interval(days => coalesce(b.freshness_days,0)) >= now()
                  then 'complete' else 'stale' end
           else 'missing' end
    when b.dimension_key='uncertainty' then
      case when coalesce(b.status,'unmeasured')='conflict' then 'conflict' else b.status end
    when b.dimension_key='research_queue' then
      case when b.status in ('missing','blocked','stale','conflict','unmeasured') then 'missing' else 'complete' end
    else b.status
  end as evaluated_status,
  case
    when b.dimension_key not in ('regulatory_status','regulatory_tier')
      and coalesce(ge.qualified_rows,0)>0 and coalesce(ge.conflict_rows,0)=0 then null
    when b.dimension_key='regulatory_status' and coalesce(ma.current_verified_rows,0)>0 and coalesce(ma.qualifying_current_rows,0)=0
      then 'Current verified market-access evidence exists but lacks a qualifying source snapshot with matching SHA-256 and registered source URL.'
    when b.dimension_key='regulatory_tier' and c.verified_regulatory_tier is not null and coalesce(ma.qualifying_current_rows,0)=0
      then 'Verified tier exists without qualifying current primary-source snapshot provenance.'
    when b.dimension_key in ('access_rules','commercial_activity','import','export','distribution','testing','packaging_labeling','tax_fees')
      and coalesce(rc.conflict_rows,0)>0 then 'Conflicting structured rule evidence requires resolution.'
    when b.dimension_key='change_history' and coalesce(cc.conflict_rows,0)>0 then 'Conflicting change evidence requires resolution.'
    when b.dimension_key in ('participants','buyers','sellers','counterparties') and coalesce(pc.conflict_rows,0)>0
      then 'Conflicting participant evidence requires resolution.'
    when b.dimension_key='relationships' and coalesce(rel.conflict_rows,0)>0 then 'Conflicting relationship evidence requires resolution.'
    when b.dimension_key='opportunities' and coalesce(oc.conflict_rows,0)>0 then 'Conflicting opportunity evidence requires resolution.'
    when b.applicability='unknown' then 'Applicability has not been established.'
    when b.status in ('blocked','missing','stale','conflict','unmeasured') then coalesce(b.blocker_reason,'Structured evidence required; no completion inferred.')
    else null
  end as evaluated_blocker_reason,
  case b.dimension_key
    when 'regulatory_status' then coalesce(l.current_verified_evidence_rows,0)
    when 'source_registry' then coalesce(l.active_source_rows,0)
    when 'source_snapshot' then coalesce(l.successful_snapshot_rows,0)
    when 'claims' then coalesce(l.verified_claim_rows,0)
    when 'pathways' then coalesce(l.verified_pathway_rows,0)
    when 'format_rules' then coalesce(l.verified_format_rule_rows,0)
    when 'market_metrics' then coalesce(l.metric_rows,0)
    when 'trade_flows' then coalesce(l.trade_flow_rows,0)
    when 'signals' then coalesce(l.signal_rows,0)
    when 'calendar' then coalesce(l.calendar_rows,0)
    when 'access_rules' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='access_rules'),0)
    when 'commercial_activity' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='commercial_activity'),0)
    when 'import' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='import'),0)
    when 'export' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='export'),0)
    when 'distribution' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='distribution'),0)
    when 'testing' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='testing'),0)
    when 'packaging_labeling' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='packaging_labeling'),0)
    when 'tax_fees' then coalesce((select verified_rows from rule_counts where jurisdiction_key=b.jurisdiction_key and rule_dimension='tax_fees'),0)
    when 'regulator' then coalesce(rgc.verified_rows,0)
    when 'change_history' then coalesce(cc.verified_rows,0)
    when 'participants' then coalesce((select verified_rows from participant_counts where jurisdiction_key=b.jurisdiction_key and participant_type='participant'),0)
    when 'buyers' then coalesce((select verified_rows from participant_counts where jurisdiction_key=b.jurisdiction_key and participant_type='buyer'),0)
    when 'sellers' then coalesce((select verified_rows from participant_counts where jurisdiction_key=b.jurisdiction_key and participant_type='seller'),0)
    when 'counterparties' then coalesce((select verified_rows from participant_counts where jurisdiction_key=b.jurisdiction_key and participant_type='counterparty'),0)
    when 'relationships' then coalesce(rel.verified_rows,0)
    when 'opportunities' then coalesce(oc.verified_rows,0)
    else coalesce(ge.qualified_rows,b.evidence_count)
  end as evaluated_evidence_count,
  b.primary_source_count,
  b.latest_verified_at,
  b.freshness_deadline,
  b.confidence,
  b.evidence_basis,
  b.parent_jurisdiction_key,
  b.last_evaluated_at,
  b.contract_version
from base b
join public.countries c on c.iso_alpha2=b.jurisdiction_key
join legacy l on l.jurisdiction_key=b.jurisdiction_key
left join rule_counts rc on rc.jurisdiction_key=b.jurisdiction_key and rc.rule_dimension=b.dimension_key
left join regulator_counts rgc on rgc.jurisdiction_key=b.jurisdiction_key
left join change_counts cc on cc.jurisdiction_key=b.jurisdiction_key
left join participant_counts pc on pc.jurisdiction_key=b.jurisdiction_key and pc.participant_type=case
  when b.dimension_key='participants' then 'participant'
  when b.dimension_key='buyers' then 'buyer'
  when b.dimension_key='sellers' then 'seller'
  when b.dimension_key='counterparties' then 'counterparty'
end
left join relationship_counts rel on rel.jurisdiction_key=b.jurisdiction_key
left join opportunity_counts oc on oc.jurisdiction_key=b.jurisdiction_key
left join generic_evidence ge on ge.jurisdiction_key=b.jurisdiction_key and ge.dimension_key=b.dimension_key
left join market_access_snapshot_gate ma on ma.jurisdiction_key=b.jurisdiction_key;

create or replace view public.v_jurisdiction_data_depth_summary
with (security_invoker = on) as
select
  jurisdiction_key,
  max(country_name) country_name,
  count(*) total_contract_dimensions,
  count(*) filter (where evaluated_status='complete') complete_dimensions,
  count(*) filter (where evaluated_status='missing') missing_dimensions,
  count(*) filter (where evaluated_status in ('blocked','stale','conflict')) blocked_dimensions,
  count(*) filter (where evaluated_status='unmeasured') unmeasured_dimensions,
  count(*) filter (where applicability='unknown') unknown_applicability_dimensions,
  count(*) filter (where applicability='not_applicable') not_applicable_dimensions,
  round(100.0 * count(*) filter (where evaluated_status='complete') /
    nullif(count(*) filter (where applicability <> 'unknown'),0),2) contract_depth_pct,
  bool_and(
    not required_for_regulatory_publication
    or evaluated_status='complete'
  ) as regulatory_publication_ready
from public.v_jurisdiction_data_depth_evaluator
group by jurisdiction_key;

create or replace view public.v_jurisdiction_data_depth_integrity
with (security_invoker = on) as
select
  count(distinct jurisdiction_key) jurisdiction_count,
  count(*) matrix_rows,
  count(distinct dimension_key) dimension_count,
  count(*) filter (where applicability='unknown') unknown_applicability_rows,
  count(*) filter (where evaluated_status='unmeasured') unmeasured_rows,
  count(*) filter (where evaluated_status in ('blocked','stale','conflict')) blocked_or_exception_rows,
  count(*) filter (where applicability='applicable' and evaluated_status='complete') applicable_complete_rows,
  count(*) filter (where applicability='not_applicable' and evaluated_status='complete') not_applicable_complete_rows,
  count(*) filter (where applicability='applicable' and evaluated_status<>'complete') applicable_incomplete_rows,
  (count(distinct jurisdiction_key)=291) expected_jurisdiction_count,
  (count(distinct dimension_key)=32) expected_dimension_count,
  (count(*)=291*32) expected_matrix_size,
  (
    count(distinct jurisdiction_key)=291 and count(distinct dimension_key)=32 and count(*)=291*32
    and count(*) filter (where applicability='unknown')=0
    and count(*) filter (where evaluated_status in ('missing','blocked','stale','conflict','unmeasured'))=0
  ) full_depth_ready
from public.v_jurisdiction_data_depth_evaluator;

grant select on public.v_jurisdiction_data_depth_evaluator to anon, authenticated;
grant select on public.v_jurisdiction_data_depth_summary to anon, authenticated;
grant select on public.v_jurisdiction_data_depth_integrity to anon, authenticated;

-- CI contract marker: snapshotted_evidence_rows
