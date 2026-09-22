update public.jurisdiction_dimension_coverage c
set status=case
 when c.dimension_key='country_intel' and d.jurisdiction_level='subnational' then 'inherited'
 when c.dimension_key='country_intel' and d.country_intel_rows>0 then 'verified_populated'
 when c.dimension_key='country_intel' then 'open'
 when c.dimension_key='market_metrics' and d.jurisdiction_level='subnational' then 'not_applicable'
 when c.dimension_key='market_metrics' and d.metric_rows>0 then 'verified_populated'
 when c.dimension_key='market_metrics' then 'open'
 when c.dimension_key='trade_flows' and d.jurisdiction_level='subnational' then 'not_applicable'
 when c.dimension_key='trade_flows' and d.trade_flow_rows>0 then 'verified_populated'
 when c.dimension_key='trade_flows' then 'open'
 when c.dimension_key='signals' and d.jurisdiction_level='subnational' then 'not_applicable'
 when c.dimension_key='signals' and d.signal_rows>0 then 'verified_populated'
 when c.dimension_key='signals' then 'open'
 when c.dimension_key='source_registry' and d.registered_source_rows>0 then 'verified_populated'
 when c.dimension_key='source_registry' then 'open'
 when c.dimension_key='source_snapshots' and d.successful_snapshot_rows>0 then 'verified_populated'
 when c.dimension_key='source_snapshots' then 'open'
 when c.dimension_key='verified_regulatory_evidence' and d.current_verified_evidence_rows>0 then 'verified_populated'
 when c.dimension_key='verified_regulatory_evidence' then 'open'
 when c.dimension_key='verified_regulatory_claims' and d.verified_claim_rows>0 then 'verified_populated'
 when c.dimension_key='verified_regulatory_claims' then 'open'
 when c.dimension_key='verified_pathways' and d.verified_pathway_rows>0 then 'verified_populated'
 when c.dimension_key='verified_pathways' then 'open'
 when c.dimension_key='verified_format_rules' and d.verified_format_rule_rows>0 then 'verified_populated'
 when c.dimension_key='verified_format_rules' then 'open'
 when c.dimension_key='regulatory_calendar' and d.calendar_rows>0 then 'verified_populated'
 when c.dimension_key='regulatory_calendar' then 'open'
 else c.status end,
 applicability=case
  when c.dimension_key in ('market_metrics','trade_flows','signals') and d.jurisdiction_level='subnational' then 'not_applicable'
  when c.dimension_key='country_intel' and d.jurisdiction_level='subnational' then 'inherited'
  else 'applicable' end,
 last_evaluated_at=now()
from public.v_jurisdiction_data_depth d
where d.jurisdiction_key=c.jurisdiction_key;