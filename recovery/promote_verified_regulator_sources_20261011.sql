-- Recovery operational promotion.
-- Promotes only successful first-party regulator snapshots from the explicitly
-- reviewed recovery source set. Failed/empty captures and third-party sources are excluded.
with target(iso) as (
  values ('AR'),('BA'),('FR'),('HR'),('JM'),('JP'),('LU'),('LV'),
         ('MK'),('MW'),('NL'),('PA'),('PT'),('SI'),('UA'),('ZW')
),
qualified as (
  select distinct on (sr.iso)
    sr.iso jurisdiction_iso2,
    sr.source_name authority_name,
    sr.source_url authority_url,
    sr.regulator_class,
    lower(ss.raw_html_hash) source_snapshot_sha256,
    ss.captured_at verified_at
  from public.source_registry sr
  join target t on t.iso=sr.iso
  join public.source_snapshots ss on ss.source_id=sr.id
  where sr.source_type='government_regulator'
    and sr.is_active
    and sr.crawl_allowed
    and sr.source_url like 'https://%'
    and ss.fetch_status='success'
    and ss.raw_html_hash ~ '^[0-9a-fA-F]{64}$'
    and length(coalesce(ss.captured_text,''))>0
  order by sr.iso,ss.captured_at desc
)
insert into public.regulatory_market_access_primary_sources
(jurisdiction_iso2,jurisdiction_level,parent_iso2,source_class,authority_name,authority_url,
 source_title,source_effective_date,source_snapshot_sha256,verified_at,expires_at,notes)
select
  q.jurisdiction_iso2,'national',null,'primary_regulator',
  q.authority_name,q.authority_url,q.authority_name,null,
  q.source_snapshot_sha256,q.verified_at,q.verified_at+interval '30 days',
  'Recovery promotion from successful reviewed first-party regulator snapshot; no synthetic evidence introduced.'
from qualified q
on conflict (jurisdiction_iso2) do update set
  jurisdiction_level=excluded.jurisdiction_level,
  parent_iso2=excluded.parent_iso2,
  source_class='primary_regulator',
  authority_name=excluded.authority_name,
  authority_url=excluded.authority_url,
  source_title=excluded.source_title,
  source_effective_date=excluded.source_effective_date,
  source_snapshot_sha256=excluded.source_snapshot_sha256,
  verified_at=excluded.verified_at,
  expires_at=excluded.expires_at,
  notes=excluded.notes
where excluded.verified_at >= public.regulatory_market_access_primary_sources.verified_at;