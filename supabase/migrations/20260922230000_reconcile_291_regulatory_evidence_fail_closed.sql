-- Canonical forward reconciliation for the 291-jurisdiction regulatory evidence contract.
-- This migration is deliberately fail-closed:
--   * only successful primary-source snapshots with a SHA-256 are publishable;
--   * jurisdictions without that evidence are blocked;
--   * no tier is inferred from a third-party source, a regex, or an override.
-- It does not manufacture missing evidence.

begin;

do $$
declare
  v_total integer;
begin
  select count(*) into v_total
  from public.v_jurisdiction_data_depth
  where jurisdiction_level in ('national','subnational');

  if v_total <> 291 then
    raise exception '291-jurisdiction evidence reconciliation requires 291 jurisdiction rows; found %', v_total;
  end if;
end $$;

with latest as (
  select distinct on (sr.jurisdiction_code)
    sr.jurisdiction_code,
    sr.source_name,
    sr.source_url,
    sr.regulator_class,
    ss.raw_html_hash,
    ss.captured_at,
    ss.captured_text
  from public.source_registry sr
  join public.source_snapshots ss on ss.source_id = sr.id
  where sr.is_active
    and sr.tier = 1
    and sr.regulator_class <> 'other'
    and ss.fetch_status = 'success'
    and ss.raw_html_hash is not null
  order by sr.jurisdiction_code, ss.captured_at desc
),
eligible as (
  select l.*, d.jurisdiction_level
  from latest l
  join public.v_jurisdiction_data_depth d
    on d.jurisdiction_key = l.jurisdiction_code
  where length(coalesce(l.captured_text, '')) >= 500
    and (
      l.captured_text ilike '%cannabis%'
      or l.captured_text ilike '%marijuana%'
      or l.captured_text ilike '%narcotic%'
    )
)
insert into public.regulatory_market_access_primary_sources (
  jurisdiction_iso2,
  jurisdiction_level,
  parent_iso2,
  source_class,
  authority_name,
  authority_url,
  source_title,
  source_snapshot_sha256,
  verified_at,
  expires_at,
  notes
)
select
  e.jurisdiction_code,
  e.jurisdiction_level,
  case
    when e.jurisdiction_level = 'subnational'
      then split_part(e.jurisdiction_code, '-', 1)
    else null
  end,
  case
    when e.regulator_class = 'official_gazette' then 'primary_gazette'
    when e.regulator_class = 'legislature' then 'primary_government_legal'
    else 'primary_regulator'
  end,
  e.source_name,
  e.source_url,
  e.source_name,
  e.raw_html_hash,
  e.captured_at,
  e.captured_at + interval '365 days',
  'Authoritative source snapshot captured. Publication remains fail-closed until the evidence claim is reconciled to the captured source.'
from eligible e
on conflict (jurisdiction_iso2) do update
set jurisdiction_level = excluded.jurisdiction_level,
    parent_iso2 = excluded.parent_iso2,
    source_class = excluded.source_class,
    authority_name = excluded.authority_name,
    authority_url = excluded.authority_url,
    source_title = excluded.source_title,
    source_snapshot_sha256 = excluded.source_snapshot_sha256,
    verified_at = excluded.verified_at,
    expires_at = excluded.expires_at,
    notes = excluded.notes;

with primary_sources as (
  select distinct on (jurisdiction_iso2)
    jurisdiction_iso2,
    authority_name,
    authority_url,
    source_snapshot_sha256,
    verified_at,
    expires_at
  from public.regulatory_market_access_primary_sources
  where expires_at > now()
  order by jurisdiction_iso2, verified_at desc
)
update public.regulatory_market_access_evidence e
set authority_name = p.authority_name,
    authority_url = p.authority_url,
    source_snapshot_sha256 = p.source_snapshot_sha256,
    verified_at = p.verified_at,
    expires_at = p.expires_at
from primary_sources p
where e.active
  and e.jurisdiction_iso2 = p.jurisdiction_iso2;

update public.jurisdiction_dimension_coverage
set status = 'blocked',
    evidence_basis = 'No authoritative primary-source snapshot captured; publication blocked fail-closed.',
    last_evaluated_at = now(),
    notes = 'FAIL-CLOSED: no current authoritative primary-source snapshot is available for this jurisdiction.'
where dimension_key = 'verified_regulatory_evidence';

update public.jurisdiction_dimension_coverage dc
set status = 'verified_populated',
    evidence_basis = 'primary_source_snapshot_sha256',
    last_evaluated_at = now(),
    notes = 'Primary authoritative source snapshot captured; tier remains publishable only while the snapshot is current.'
from public.regulatory_market_access_primary_sources ps
where dc.dimension_key = 'verified_regulatory_evidence'
  and dc.jurisdiction_key = ps.jurisdiction_iso2
  and ps.expires_at > now();

do $$
declare
  v_verified integer;
  v_blocked integer;
begin
  select count(*) filter (where status = 'verified_populated'),
         count(*) filter (where status = 'blocked')
    into v_verified, v_blocked
  from public.jurisdiction_dimension_coverage
  where dimension_key = 'verified_regulatory_evidence';

  if coalesce(v_verified, 0) + coalesce(v_blocked, 0) <> 291 then
    raise exception 'Evidence reconciliation must cover exactly 291 jurisdictions; verified %, blocked %', v_verified, v_blocked;
  end if;

  if exists (
    select 1
    from public.jurisdiction_dimension_coverage
    where dimension_key = 'verified_regulatory_evidence'
      and status = 'verified_populated'
      and evidence_basis <> 'primary_source_snapshot_sha256'
  ) then
    raise exception 'Verified regulatory evidence contains a row without a primary-source snapshot basis';
  end if;
end $$;

commit;
