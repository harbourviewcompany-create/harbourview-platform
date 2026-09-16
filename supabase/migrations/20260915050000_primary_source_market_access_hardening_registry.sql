-- Primary-source market-access hardening registry.
-- No existing evidence is silently upgraded by this migration.
-- A jurisdiction is not considered hardened until its source is individually
-- identified, current, unique, fetched/read, and snapshot-hashed.

create table if not exists public.regulatory_market_access_primary_sources (
  jurisdiction_iso2 text primary key,
  jurisdiction_level text not null default case when jurisdiction_iso2 ~ '^[A-Z]{2}$' then 'national' else 'subnational' end
    check (jurisdiction_level in ('national','subnational')),
  parent_iso2 text,
  source_class text not null check (source_class in ('primary_regulator','primary_government_legal','primary_gazette','primary_court_or_official_decision')),
  authority_name text not null,
  authority_url text not null,
  source_title text not null,
  source_effective_date date,
  source_snapshot_sha256 text not null,
  verified_at timestamptz not null,
  expires_at timestamptz not null,
  notes text,
  constraint regulatory_market_access_primary_source_parent check (
    (jurisdiction_level = 'national' and parent_iso2 is null)
    or (jurisdiction_level = 'subnational' and parent_iso2 is not null and parent_iso2 ~ '^[A-Z]{2}$')
  ),
  constraint regulatory_market_access_primary_source_expiry check (expires_at > verified_at),
  constraint regulatory_market_access_primary_source_url check (authority_url ~ '^https://'),
  constraint regulatory_market_access_primary_source_snapshot check (source_snapshot_sha256 ~ '^[0-9a-f]{64}$')
);

-- Existing development rows, if any, must meet the stricter contract too.
alter table public.regulatory_market_access_primary_sources
  alter column source_snapshot_sha256 set not null;

create unique index if not exists regulatory_market_access_primary_sources_unique_url
  on public.regulatory_market_access_primary_sources (lower(trim(trailing '/' from authority_url)));

create index if not exists regulatory_market_access_primary_sources_level_idx
  on public.regulatory_market_access_primary_sources (jurisdiction_level, parent_iso2);

alter table public.regulatory_market_access_primary_sources enable row level security;
drop policy if exists regulatory_market_access_primary_sources_public_read on public.regulatory_market_access_primary_sources;
create policy regulatory_market_access_primary_sources_public_read on public.regulatory_market_access_primary_sources for select to anon, authenticated using (true);
revoke insert, update, delete on public.regulatory_market_access_primary_sources from anon, authenticated;
grant select on public.regulatory_market_access_primary_sources to anon, authenticated;

comment on table public.regulatory_market_access_primary_sources is
  'Strict provenance registry. One individually reviewed, jurisdiction-specific primary regulator/government/legal source per published market-access jurisdiction. Secondary trackers, aggregate treaty reports, generic landing pages reused across jurisdictions, and inherited parent sources do not satisfy the contract.';

create or replace view api.regulatory_market_access_primary_source_gaps as
with inventory as (
  select c.iso_alpha2 as jurisdiction_iso2,
         c.country_name,
         case when c.iso_alpha2 ~ '^[A-Z]{2}$' then 'national' else 'subnational' end as jurisdiction_level,
         case when c.iso_alpha2 ~ '^[A-Z]{2}$' then null else substring(c.iso_alpha2 from 1 for 2) end as parent_iso2,
         c.verified_regulatory_tier,
         c.regulatory_tier_evidence_key
  from public.countries c
  where c.iso_alpha2 is not null
)
select i.jurisdiction_iso2,i.jurisdiction_level,i.parent_iso2,i.country_name,
  i.verified_regulatory_tier,i.regulatory_tier_evidence_key,
  p.authority_url as primary_source_url,p.authority_name as primary_source_authority,p.source_class,
  p.source_effective_date,p.source_snapshot_sha256,
  p.verified_at as primary_source_verified_at,p.expires_at as primary_source_expires_at,
  case
    when p.jurisdiction_iso2 is null then 'missing_primary_source'
    when p.jurisdiction_level is distinct from i.jurisdiction_level then 'wrong_jurisdiction_level'
    when p.parent_iso2 is distinct from i.parent_iso2 then 'wrong_parent'
    when p.expires_at <= now() then 'expired_primary_source'
    when p.source_effective_date is not null and p.source_effective_date > current_date then 'future_source_effective_date'
    when p.source_snapshot_sha256 is null then 'missing_source_snapshot'
    when lower(trim(trailing '/' from p.authority_url)) = lower(trim(trailing '/' from coalesce(e.authority_url,''))) then 'same_source_as_current_evidence'
    else 'hardened'
  end as hardening_status
from inventory i
left join public.regulatory_market_access_primary_sources p on p.jurisdiction_iso2=i.jurisdiction_iso2
left join public.regulatory_market_access_evidence e on e.evidence_key=i.regulatory_tier_evidence_key;

grant select on api.regulatory_market_access_primary_source_gaps to authenticated, service_role;

create or replace function api.assert_market_access_primary_source_hardening()
returns table (
  jurisdictions bigint,
  national_jurisdictions bigint,
  subnational_jurisdictions bigint,
  hardened bigint,
  missing bigint,
  expired bigint,
  wrong_level bigint,
  wrong_parent bigint,
  missing_snapshot bigint,
  future_effective_date bigint,
  reused_current_evidence_url bigint,
  duplicate_source_urls bigint
)
language sql stable security definer set search_path = '' as $$
  with inventory as (
    select c.iso_alpha2 as jurisdiction_iso2,
           case when c.iso_alpha2 ~ '^[A-Z]{2}$' then 'national' else 'subnational' end as jurisdiction_level,
           case when c.iso_alpha2 ~ '^[A-Z]{2}$' then null else substring(c.iso_alpha2 from 1 for 2) end as parent_iso2,
           c.regulatory_tier_evidence_key
    from public.countries c
    where c.iso_alpha2 is not null
  ),
  joined as (
    select i.*,p.jurisdiction_iso2 as p_key,p.jurisdiction_level as p_level,p.parent_iso2 as p_parent,
      p.authority_url,p.source_effective_date,p.source_snapshot_sha256,p.verified_at,p.expires_at,e.authority_url as evidence_url
    from inventory i
    left join public.regulatory_market_access_primary_sources p on p.jurisdiction_iso2=i.jurisdiction_iso2
    left join public.regulatory_market_access_evidence e on e.evidence_key=i.regulatory_tier_evidence_key
  ),
  counts as (
    select
      count(*)::bigint as jurisdictions,
      count(*) filter (where jurisdiction_level='national')::bigint as national_jurisdictions,
      count(*) filter (where jurisdiction_level='subnational')::bigint as subnational_jurisdictions,
      count(*) filter (where p_key is not null and p_level=jurisdiction_level and p_parent is not distinct from parent_iso2 and expires_at>now() and source_snapshot_sha256 ~ '^[0-9a-f]{64}$' and (source_effective_date is null or source_effective_date<=current_date) and lower(trim(trailing '/' from authority_url)) <> lower(trim(trailing '/' from coalesce(evidence_url,''))))::bigint as hardened,
      count(*) filter (where p_key is null)::bigint as missing,
      count(*) filter (where p_key is not null and expires_at<=now())::bigint as expired,
      count(*) filter (where p_key is not null and p_level is distinct from jurisdiction_level)::bigint as wrong_level,
      count(*) filter (where p_key is not null and p_parent is distinct from parent_iso2)::bigint as wrong_parent,
      count(*) filter (where p_key is not null and source_snapshot_sha256 is null)::bigint as missing_snapshot,
      count(*) filter (where p_key is not null and source_effective_date is not null and source_effective_date>current_date)::bigint as future_effective_date,
      count(*) filter (where p_key is not null and lower(trim(trailing '/' from authority_url)) = lower(trim(trailing '/' from coalesce(evidence_url,''))))::bigint as reused_current_evidence_url
    from joined
  ),
  duplicate_urls as (
    select count(*)::bigint as duplicate_source_urls
    from (
      select lower(trim(trailing '/' from authority_url))
      from public.regulatory_market_access_primary_sources
      group by 1 having count(*) > 1
    ) d
  )
  select c.*,d.duplicate_source_urls from counts c cross join duplicate_urls d;
$$;

revoke all on function api.assert_market_access_primary_source_hardening() from public, anon, authenticated;
grant execute on function api.assert_market_access_primary_source_hardening() to service_role;

-- Deliberately no guessed URLs are inserted. A jurisdiction enters the registry
-- only after its primary source has been fetched/read and its snapshot hash recorded.
