-- Evidence depth backfill from existing authoritative/verified Harbourview data.
-- Idempotent: only inserts missing current verified evidence and then recomputes state.
-- Contract: 2026-09-23.v2, exactly 291 jurisdictions x 32 dimensions.

with ls as (
  select distinct on (sr.id)
    sr.id source_registry_id, ss.id source_snapshot_id, sr.jurisdiction_code,
    sr.source_url, ss.captured_at, ss.raw_html_hash
  from public.source_registry sr
  join public.source_snapshots ss on ss.source_id = sr.id
  where sr.is_active
    and ss.fetch_status = 'success'
    and length(coalesce(ss.captured_text,'')) > 0
    and lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
  order by sr.id, ss.captured_at desc
),
src as (
  select distinct on (ls.jurisdiction_code)
    ls.jurisdiction_code jurisdiction_key, ls.source_registry_id,
    ls.source_snapshot_id, ls.source_url, ls.captured_at, ls.raw_html_hash
  from ls
  join public.countries c on c.iso_alpha2 = ls.jurisdiction_code
  order by ls.jurisdiction_code, ls.captured_at desc
)
insert into public.jurisdiction_data_depth_evidence (
  jurisdiction_key, dimension_key, contract_version, evidence_kind, applicability,
  evidence_payload, evidence_quote, source_registry_id, source_snapshot_id,
  source_url, effective_from, verification_status, verified_at, created_at, updated_at
)
select jurisdiction_key, 'source_registry', '2026-09-23.v2', 'structural_fact', 'applicable',
  jsonb_build_object('source_registry_id',source_registry_id,'source_url',source_url),
  'Active registered source with successful captured snapshot.',
  source_registry_id, source_snapshot_id, source_url, captured_at::date,
  'verified', captured_at, now(), now()
from src
on conflict do nothing;

with x as (
  select distinct on (sr.jurisdiction_code)
    sr.jurisdiction_code jurisdiction_key, sr.id source_registry_id, ss.id source_snapshot_id,
    sr.source_url, ss.captured_at, ss.raw_html_hash
  from public.source_registry sr
  join public.source_snapshots ss on ss.source_id = sr.id
  where sr.is_active and sr.jurisdiction_code is not null
    and ss.fetch_status = 'success'
    and length(coalesce(ss.captured_text,'')) > 0
    and lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
    and exists (select 1 from public.countries c where c.iso_alpha2 = sr.jurisdiction_code)
  order by sr.jurisdiction_code, ss.captured_at desc
)
insert into public.jurisdiction_data_depth_evidence (
  jurisdiction_key, dimension_key, contract_version, evidence_kind, applicability,
  evidence_payload, evidence_quote, source_registry_id, source_snapshot_id,
  source_url, effective_from, verification_status, verified_at, created_at, updated_at
)
select jurisdiction_key, 'source_snapshot', '2026-09-23.v2', 'structural_fact', 'applicable',
  jsonb_build_object('snapshot_id',source_snapshot_id,'sha256',raw_html_hash,'captured_at',captured_at),
  'Successful captured primary-source snapshot with valid SHA-256 hash.',
  source_registry_id, source_snapshot_id, source_url, captured_at::date,
  'verified', captured_at, now(), now()
from x
on conflict do nothing;

insert into public.jurisdiction_data_depth_evidence (
  jurisdiction_key, dimension_key, contract_version, evidence_kind, applicability,
  evidence_payload, evidence_quote, source_registry_id, source_snapshot_id,
  source_url, effective_from, verification_status, verified_at, created_at, updated_at
)
select c.jurisdiction_iso2, 'claims', '2026-09-23.v2', 'authority_statement', 'applicable',
  jsonb_build_object('evidence_key',c.evidence_key,'claim_key',c.claim_key,
    'claim_text',c.claim_text,'product_class',c.product_class),
  left(c.claim_text,1000), sr.id, ss.id, sr.source_url,
  coalesce(c.source_effective_date,ss.captured_at::date), 'verified',
  coalesce(c.verified_at,ss.captured_at), now(), now()
from (
  select distinct on (rc.jurisdiction_iso2)
    rc.jurisdiction_iso2, rc.evidence_key, rc.claim_key, rc.claim_text,
    rc.product_class, re.authority_url, re.source_snapshot_sha256,
    re.source_effective_date, re.verified_at
  from public.regulatory_market_access_claims rc
  join public.regulatory_market_access_evidence re
    on re.evidence_key=rc.evidence_key
   and re.jurisdiction_iso2=rc.jurisdiction_iso2
   and re.active
  where not exists (
    select 1 from public.jurisdiction_data_depth_evidence e
    where e.jurisdiction_key=rc.jurisdiction_iso2
      and e.dimension_key='claims'
      and e.contract_version='2026-09-23.v2'
      and e.verification_status='verified'
  )
  order by rc.jurisdiction_iso2, re.verified_at desc nulls last
) c
join public.source_registry sr on sr.source_url=c.authority_url
join lateral (
  select ss.* from public.source_snapshots ss
  where ss.source_id=sr.id and ss.fetch_status='success'
    and length(coalesce(ss.captured_text,'')) > 0
    and lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
    and (c.source_snapshot_sha256 is null or ss.raw_html_hash=c.source_snapshot_sha256)
  order by
    case when c.source_snapshot_sha256 is not null
      and ss.raw_html_hash=c.source_snapshot_sha256 then 0 else 1 end,
    ss.captured_at desc
  limit 1
) ss on true
on conflict do nothing;

insert into public.jurisdiction_data_depth_evidence (
  jurisdiction_key, dimension_key, contract_version, evidence_kind, applicability,
  evidence_payload, evidence_quote, source_registry_id, source_snapshot_id,
  source_url, effective_from, verification_status, verified_at, created_at, updated_at
)
select p.iso_alpha2, 'pathways', '2026-09-23.v2', 'authority_statement', 'applicable',
  jsonb_build_object('pathway_id',p.id,'name',p.name,'pathway_type',p.pathway_type,
    'legal_basis',p.legal_basis,'regulator',p.regulator,'status',p.status),
  left(coalesce(p.summary,p.legal_basis,p.name),1000),
  sr.id, ss.id, sr.source_url, p.effective_date, 'verified', p.last_verified_at, now(), now()
from (
  select distinct on (p.iso_alpha2) p.*, u.url
  from public.regulatory_pathways p
  cross join lateral unnest(p.source_urls) u(url)
  where p.last_verified_at is not null
    and not exists (
      select 1 from public.jurisdiction_data_depth_evidence e
      where e.jurisdiction_key=p.iso_alpha2 and e.dimension_key='pathways'
        and e.contract_version='2026-09-23.v2' and e.verification_status='verified'
    )
  order by p.iso_alpha2, p.last_verified_at desc
) p
join public.source_registry sr on sr.source_url=p.url
join lateral (
  select ss.* from public.source_snapshots ss
  where ss.source_id=sr.id and ss.fetch_status='success'
    and length(coalesce(ss.captured_text,'')) > 0
    and lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
  order by ss.captured_at desc limit 1
) ss on true
on conflict do nothing;

insert into public.jurisdiction_data_depth_evidence (
  jurisdiction_key, dimension_key, contract_version, evidence_kind, applicability,
  evidence_payload, evidence_quote, source_registry_id, source_snapshot_id,
  source_url, effective_from, verification_status, verified_at, created_at, updated_at
)
select m.country_iso2, 'market_metrics', '2026-09-23.v2', 'verified_research', 'applicable',
  jsonb_build_object('metric_name',m.metric_name,'metric_value',m.metric_value,
    'metric_unit',m.metric_unit,'period_start',m.period_start,'period_end',m.period_end),
  left(coalesce(m.notes,m.metric_name),1000), sr.id, ss.id, m.source_url,
  m.source_date, 'verified', ss.captured_at, now(), now()
from (
  select distinct on (m.country_iso2) m.*
  from public.market_metrics m
  where not exists (
    select 1 from public.jurisdiction_data_depth_evidence e
    where e.jurisdiction_key=m.country_iso2 and e.dimension_key='market_metrics'
      and e.contract_version='2026-09-23.v2' and e.verification_status='verified'
  )
  order by m.country_iso2, m.source_date desc nulls last
) m
join public.source_registry sr on sr.source_url=m.source_url
join lateral (
  select ss.* from public.source_snapshots ss
  where ss.source_id=sr.id and ss.fetch_status='success'
    and length(coalesce(ss.captured_text,'')) > 0
    and lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
  order by ss.captured_at desc limit 1
) ss on true
on conflict do nothing;

insert into public.jurisdiction_data_depth_evidence (
  jurisdiction_key, dimension_key, contract_version, evidence_kind, applicability,
  evidence_payload, evidence_quote, source_registry_id, source_snapshot_id,
  source_url, effective_from, verification_status, verified_at, created_at, updated_at
)
select s.country_iso2, 'signals', '2026-09-23.v2', 'verified_research', 'applicable',
  jsonb_build_object('signal_id',s.id,'category',s.cat,'priority',s.pri,'score',s.score,
    'headline',s.headline,'source',s.source,'url',s.url,'observed_at',s.observed_at),
  left(coalesce(s.headline,s.summary),1000), ss.source_id, s.snapshot_id, sr.source_url,
  coalesce(s.event_effective_at::date,s.source_published_at::date,s.observed_at::date),
  'verified', coalesce(s.observed_at,ss.captured_at), now(), now()
from (
  select distinct on (s.country_iso2) s.*
  from public.signals s
  where s.country_iso2 is not null
    and exists (select 1 from public.countries c where c.iso_alpha2=s.country_iso2)
    and not exists (
      select 1 from public.jurisdiction_data_depth_evidence e
      where e.jurisdiction_key=s.country_iso2 and e.dimension_key='signals'
        and e.contract_version='2026-09-23.v2' and e.verification_status='verified'
    )
  order by s.country_iso2, s.observed_at desc nulls last
) s
join public.source_snapshots ss
  on ss.id=s.snapshot_id and ss.fetch_status='success'
 and length(coalesce(ss.captured_text,'')) > 0
 and lower(ss.raw_html_hash) ~ '^[0-9a-f]{64}$'
join public.source_registry sr on sr.id=ss.source_id
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
set evidence_count=b.ec,
    primary_source_count=b.pc,
    latest_verified_at=b.lv,
    freshness_deadline=case when b.lv is not null and b.freshness_days is not null
      then b.lv + make_interval(days=>b.freshness_days) end,
    status=case
      when b.dimension_key in ('identity','hierarchy') or b.applicability='not_applicable' then 'complete'
      when b.ec=0 then 'unmeasured'
      when b.requires_primary_source and b.pc=0 then 'blocked'
      when b.lv + make_interval(days=>b.freshness_days) < now() then 'stale'
      else 'complete' end,
    blocker_reason=case
      when b.dimension_key in ('identity','hierarchy') or b.applicability='not_applicable' then null
      when b.ec=0 then 'No verified evidence captured for this jurisdiction/dimension.'
      when b.requires_primary_source and b.pc=0 then 'Verified evidence exists but qualifying primary-source provenance is absent.'
      when b.lv + make_interval(days=>b.freshness_days) < now() then 'Latest verified evidence is past the dimension freshness window.'
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
