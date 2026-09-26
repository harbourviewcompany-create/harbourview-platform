-- Jurisdiction data-depth aggregation layer.
-- Read-only derived intelligence metadata: never infers missing regulatory facts.
create or replace view public.v_jurisdiction_data_depth
with (security_invoker = on) as
with base as (
  select c.id, c.iso_alpha2 as jurisdiction_key, c.country_name, c.country_slug, c.iso_alpha3,
         c.region, c.subregion, null::text as jurisdiction_level, c.market_access_status, c.medical_status, c.adult_use_status,
         c.import_status, c.export_status, c.regulatory_tier, c.regulatory_tier_verified_at,
         c.data_completeness, c.last_updated_label
  from public.countries c
), ci as (
  select country_code, count(*) country_intel_rows,
         count(*) filter (where review_status in ('approved','active')) active_country_intel_rows,
         max(last_reviewed_at) country_intel_last_reviewed
  from public.country_intel group by country_code
), ev as (
  select jurisdiction_iso2, count(*) evidence_rows,
         count(*) filter (where active) active_evidence_rows,
         count(*) filter (where verified_at is not null and expires_at >= now()) current_verified_evidence_rows,
         count(*) filter (where source_snapshot_sha256 is not null) snapshotted_evidence_rows,
         max(verified_at) latest_evidence_verified_at
  from public.regulatory_market_access_evidence group by jurisdiction_iso2
), cl as (
  select jurisdiction_iso2, count(*) claim_rows,
         count(*) filter (where evidence_status='verified') verified_claim_rows,
         count(distinct product_class) claim_product_classes
  from public.regulatory_market_access_claims group by jurisdiction_iso2
), pw as (
  select iso_alpha2, count(*) pathway_rows,
         count(*) filter (where verification='verified') verified_pathway_rows,
         count(distinct pathway_type) pathway_types, max(last_verified_at) latest_pathway_verified_at
  from public.regulatory_pathways group by iso_alpha2
), fr as (
  select p.iso_alpha2, count(r.id) format_rule_rows,
         count(r.id) filter (where r.verification='verified') verified_format_rule_rows,
         count(distinct r.format_id) distinct_formats, count(distinct r.pathway_id) pathways_with_format_rules
  from public.regulatory_pathways p left join public.pathway_format_rules r on r.pathway_id=p.id
  group by p.iso_alpha2
), mm as (
  select country_iso2, count(*) metric_rows, count(distinct metric_name) metric_types,
         max(period_end) latest_metric_period, max(updated_at) latest_metric_updated_at
  from public.market_metrics group by country_iso2
), tf as (
  select iso, count(*) trade_flow_rows,
         count(distinct product_category) filter (where product_category is not null) trade_product_categories,
         max(last_verified) latest_trade_verified_at
  from (select origin_iso2 iso, product_category, last_verified from public.trade_flows
        union all select destination_iso2, product_category, last_verified from public.trade_flows) x
  group by iso
), sg as (
  select country_iso2, count(*) signal_rows,
         count(*) filter (where lower(coalesce(verification,'')) in ('verified','reviewed','approved')) reviewed_signal_rows,
         count(*) filter (where coalesce(event_effective_at,source_published_at,observed_at,created_at) >= now()-interval '90 days') recent_signal_rows,
         max(coalesce(event_effective_at,source_published_at,observed_at,created_at)) latest_signal_at
  from public.signals where country_iso2 is not null group by country_iso2
), src as (
  select coalesce(nullif(upper(iso),''),nullif(upper(jurisdiction_code),'')) jurisdiction_key,
         count(*) registered_source_rows, count(*) filter (where is_active) active_source_rows,
         count(*) filter (where tier=1) official_source_rows, max(last_checked_at) latest_source_check
  from public.source_registry where iso is not null or jurisdiction_code is not null
  group by coalesce(nullif(upper(iso),''),nullif(upper(jurisdiction_code),''))
), snap as (
  select coalesce(upper(sr.iso),upper(sr.jurisdiction_code)) jurisdiction_key,
         count(ss.id) snapshot_rows, count(ss.id) filter (where ss.fetch_status='success') successful_snapshot_rows,
         max(ss.captured_at) latest_snapshot_at
  from public.source_snapshots ss join public.source_registry sr on sr.id=ss.source_id
  group by coalesce(upper(sr.iso),upper(sr.jurisdiction_code))
), cal as (
  select iso2, count(*) calendar_rows,
         count(*) filter (where status not in ('resolved','withdrawn','cancelled')) open_calendar_rows,
         max(updated_at) latest_calendar_update
  from public.regulatory_calendar group by iso2
)
select b.*, coalesce(ci.country_intel_rows,0) country_intel_rows,
  coalesce(ci.active_country_intel_rows,0) active_country_intel_rows, ci.country_intel_last_reviewed,
  coalesce(ev.evidence_rows,0) evidence_rows, coalesce(ev.active_evidence_rows,0) active_evidence_rows,
  coalesce(ev.current_verified_evidence_rows,0) current_verified_evidence_rows,
  coalesce(ev.snapshotted_evidence_rows,0) snapshotted_evidence_rows, ev.latest_evidence_verified_at,
  coalesce(cl.claim_rows,0) claim_rows, coalesce(cl.verified_claim_rows,0) verified_claim_rows,
  coalesce(cl.claim_product_classes,0) claim_product_classes,
  coalesce(pw.pathway_rows,0) pathway_rows, coalesce(pw.verified_pathway_rows,0) verified_pathway_rows,
  coalesce(pw.pathway_types,0) pathway_types, pw.latest_pathway_verified_at,
  coalesce(fr.format_rule_rows,0) format_rule_rows, coalesce(fr.verified_format_rule_rows,0) verified_format_rule_rows,
  coalesce(fr.distinct_formats,0) distinct_formats, coalesce(fr.pathways_with_format_rules,0) pathways_with_format_rules,
  coalesce(mm.metric_rows,0) metric_rows, coalesce(mm.metric_types,0) metric_types,
  mm.latest_metric_period, mm.latest_metric_updated_at,
  coalesce(tf.trade_flow_rows,0) trade_flow_rows, coalesce(tf.trade_product_categories,0) trade_product_categories,
  tf.latest_trade_verified_at,
  coalesce(sg.signal_rows,0) signal_rows, coalesce(sg.reviewed_signal_rows,0) reviewed_signal_rows,
  coalesce(sg.recent_signal_rows,0) recent_signal_rows, sg.latest_signal_at,
  coalesce(src.registered_source_rows,0) registered_source_rows, coalesce(src.active_source_rows,0) active_source_rows,
  coalesce(src.official_source_rows,0) official_source_rows, src.latest_source_check,
  coalesce(snap.snapshot_rows,0) snapshot_rows, coalesce(snap.successful_snapshot_rows,0) successful_snapshot_rows,
  snap.latest_snapshot_at,
  coalesce(cal.calendar_rows,0) calendar_rows, coalesce(cal.open_calendar_rows,0) open_calendar_rows,
  cal.latest_calendar_update,
  (
    (case when coalesce(ci.active_country_intel_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(ev.current_verified_evidence_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(cl.verified_claim_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(pw.verified_pathway_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(fr.verified_format_rule_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(mm.metric_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(tf.trade_flow_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(sg.signal_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(src.active_source_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(snap.successful_snapshot_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(cal.calendar_rows,0)>0 then 1 else 0 end)
  ) populated_dimensions,
  11 total_dimensions,
  round(100.0*(
    (case when coalesce(ci.active_country_intel_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(ev.current_verified_evidence_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(cl.verified_claim_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(pw.verified_pathway_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(fr.verified_format_rule_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(mm.metric_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(tf.trade_flow_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(sg.signal_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(src.active_source_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(snap.successful_snapshot_rows,0)>0 then 1 else 0 end) +
    (case when coalesce(cal.calendar_rows,0)>0 then 1 else 0 end)
  )/11.0) depth_pct
from base b
left join ci on ci.country_code=b.jurisdiction_key
left join ev on ev.jurisdiction_iso2=b.jurisdiction_key
left join cl on cl.jurisdiction_iso2=b.jurisdiction_key
left join pw on pw.iso_alpha2=b.jurisdiction_key
left join fr on fr.iso_alpha2=b.jurisdiction_key
left join mm on mm.country_iso2=b.jurisdiction_key
left join tf on tf.iso=b.jurisdiction_key
left join sg on sg.country_iso2=b.jurisdiction_key
left join src on src.jurisdiction_key=b.jurisdiction_key
left join snap on snap.jurisdiction_key=b.jurisdiction_key
left join cal on cal.iso2=b.jurisdiction_key;

grant select on public.v_jurisdiction_data_depth to anon, authenticated;