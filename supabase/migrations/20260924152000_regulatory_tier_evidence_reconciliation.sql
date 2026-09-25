-- Reconcile verified commercial market-access tier evidence already present in the
-- authoritative regulatory evidence store. Never infer missing tiers.

with tier as (
  select distinct on (e.jurisdiction_iso2)
    e.jurisdiction_iso2, e.tier, e.rationale, e.authority_name, e.authority_url,
    e.source_effective_date, e.verified_at, e.source_snapshot_sha256
  from public.regulatory_market_access_evidence e
  where e.active and e.tier is not null
  order by e.jurisdiction_iso2, e.verified_at desc nulls last
)
insert into public.jurisdiction_data_depth_evidence (
  jurisdiction_key, dimension_key, contract_version, evidence_kind, applicability,
  evidence_payload, evidence_quote, source_registry_id, source_snapshot_id,
  source_url, effective_from, verification_status, verified_at, created_at, updated_at
)
select t.jurisdiction_iso2, 'regulatory_tier', '2026-09-23.v2',
  'authority_statement', 'applicable',
  jsonb_build_object(
    'tier', t.tier, 'rationale', t.rationale, 'authority', t.authority_name
  ),
  left(coalesce(t.rationale, t.tier::text), 1000),
  sr.id, ss.id, t.authority_url, t.source_effective_date,
  'verified', t.verified_at, now(), now()
from tier t
join public.source_registry sr on sr.source_url=t.authority_url
join lateral (
  select ss.*
  from public.source_snapshots ss
  where ss.source_id=sr.id
    and ss.fetch_status='success'
    and length(coalesce(ss.captured_text,'')) > 0
    and lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
    and (t.source_snapshot_sha256 is null or ss.raw_html_hash=t.source_snapshot_sha256)
  order by
    case when t.source_snapshot_sha256 is not null
      and ss.raw_html_hash=t.source_snapshot_sha256 then 0 else 1 end,
    ss.captured_at desc
  limit 1
) ss on true
where not exists (
  select 1 from public.jurisdiction_data_depth_evidence x
  where x.jurisdiction_key=t.jurisdiction_iso2
    and x.dimension_key='regulatory_tier'
    and x.contract_version='2026-09-23.v2'
    and x.verification_status='verified'
)
on conflict do nothing;

with ev as (
  select e.jurisdiction_key,e.dimension_key,
    count(*) filter(where e.verification_status='verified') ec,
    count(*) filter(where e.verification_status='verified' and v.qualifying_provenance) pc,
    max(e.verified_at) lv
  from public.jurisdiction_data_depth_evidence e
  left join public.v_jurisdiction_data_depth_v2_evidence_gate v
    on v.jurisdiction_key=e.jurisdiction_key
   and v.dimension_key=e.dimension_key
   and v.contract_version=e.contract_version
   and v.verification_status=e.verification_status
  where e.contract_version='2026-09-23.v2'
  group by e.jurisdiction_key,e.dimension_key
),
b as (
  select s.jurisdiction_key,s.dimension_key,s.contract_version,s.applicability,
    d.requires_primary_source,d.freshness_days,
    coalesce(ev.ec,0) ec,coalesce(ev.pc,0) pc,ev.lv
  from public.jurisdiction_data_depth_dimension_state s
  join public.jurisdiction_data_depth_dimensions d on d.dimension_key=s.dimension_key
  left join ev on ev.jurisdiction_key=s.jurisdiction_key and ev.dimension_key=s.dimension_key
  where s.contract_version='2026-09-23.v2'
)
update public.jurisdiction_data_depth_dimension_state s
set evidence_count=b.ec, primary_source_count=b.pc, latest_verified_at=b.lv,
    freshness_deadline=case when b.lv is not null and b.freshness_days is not null
      then b.lv+make_interval(days=>b.freshness_days) end,
    status=case
      when b.dimension_key in ('identity','hierarchy') or b.applicability='not_applicable' then 'complete'
      when b.ec=0 then 'unmeasured'
      when b.requires_primary_source and b.pc=0 then 'blocked'
      when b.freshness_days is not null and b.lv+make_interval(days=>b.freshness_days)<now() then 'stale'
      else 'complete' end,
    blocker_reason=case
      when b.dimension_key in ('identity','hierarchy') or b.applicability='not_applicable' then null
      when b.ec=0 then 'No verified evidence captured for this jurisdiction/dimension.'
      when b.requires_primary_source and b.pc=0 then 'Verified evidence exists but qualifying primary-source provenance is absent.'
      when b.freshness_days is not null and b.lv+make_interval(days=>b.freshness_days)<now() then 'Latest verified evidence is past the dimension freshness window.'
      else null end,
    confidence=case when b.ec=0 then 'unknown' when b.pc>0 then 'high' else 'medium' end,
    evidence_basis=case when b.ec=0 then 'unresolved'
      when b.pc>0 then 'direct_verified_source' else 'verified_structural_or_research' end,
    last_evaluated_at=now(), updated_at=now()
from b
where s.jurisdiction_key=b.jurisdiction_key
  and s.dimension_key=b.dimension_key
  and s.contract_version=b.contract_version;

do $$
declare dims int; jurs int; matrix int;
begin
  select count(*) into dims from public.jurisdiction_data_depth_dimensions where contract_version='2026-09-23.v2';
  select count(*) into jurs from public.countries;
  select count(*) into matrix from public.jurisdiction_data_depth_dimension_state where contract_version='2026-09-23.v2';
  if dims <> 32 or jurs <> 291 or matrix <> 9312 then
    raise exception '291x32 invariant failed: dimensions %, jurisdictions %, matrix %',dims,jurs,matrix;
  end if;
end $$;