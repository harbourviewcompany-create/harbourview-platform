-- Primary-source market-access hardening registry.
-- No existing evidence is silently upgraded by this migration.

create table if not exists public.regulatory_market_access_primary_sources (
  jurisdiction_iso2 text primary key,
  source_class text not null check (source_class in ('primary_regulator','primary_government_legal','primary_gazette','primary_court_or_official_decision')),
  authority_name text not null,
  authority_url text not null,
  source_title text not null,
  source_effective_date date,
  source_snapshot_sha256 text,
  verified_at timestamptz not null,
  expires_at timestamptz not null,
  notes text,
  constraint regulatory_market_access_primary_source_expiry check (expires_at > verified_at),
  constraint regulatory_market_access_primary_source_url check (authority_url ~ '^https://'),
  constraint regulatory_market_access_primary_source_snapshot check (source_snapshot_sha256 is null or source_snapshot_sha256 ~ '^[0-9a-f]{64}$')
);

create unique index if not exists regulatory_market_access_primary_sources_unique_url
  on public.regulatory_market_access_primary_sources (authority_url);

alter table public.regulatory_market_access_primary_sources enable row level security;
drop policy if exists regulatory_market_access_primary_sources_public_read on public.regulatory_market_access_primary_sources;
create policy regulatory_market_access_primary_sources_public_read on public.regulatory_market_access_primary_sources for select to anon, authenticated using (true);
revoke insert, update, delete on public.regulatory_market_access_primary_sources from anon, authenticated;
grant select on public.regulatory_market_access_primary_sources to anon, authenticated;

comment on table public.regulatory_market_access_primary_sources is
  'Strict provenance registry. One jurisdiction-specific primary regulator/government/legal source per published market-access jurisdiction. Secondary trackers and aggregate treaty reports do not satisfy this registry. The source URL is unique so one generic page cannot be reused for multiple jurisdictions.';

create or replace view api.regulatory_market_access_primary_source_gaps as
select c.iso_alpha2,c.country_name,c.verified_regulatory_tier,c.regulatory_tier_evidence_key,
  p.authority_url as primary_source_url,p.authority_name as primary_source_authority,p.source_class,
  p.verified_at as primary_source_verified_at,p.expires_at as primary_source_expires_at,
  case
    when p.jurisdiction_iso2 is null then 'missing_primary_source'
    when p.expires_at <= now() then 'expired_primary_source'
    when p.source_snapshot_sha256 is null then 'missing_source_snapshot'
    when p.authority_url = e.authority_url then 'same_source_as_current_evidence'
    else 'hardened'
  end as hardening_status
from public.countries c
left join public.regulatory_market_access_primary_sources p on p.jurisdiction_iso2=c.iso_alpha2
left join public.regulatory_market_access_evidence e on e.evidence_key=c.regulatory_tier_evidence_key
where c.iso_alpha2 is not null;

grant select on api.regulatory_market_access_primary_source_gaps to authenticated, service_role;

create or replace function api.assert_market_access_primary_source_hardening()
returns table (jurisdictions bigint,hardened bigint,missing bigint,expired bigint,missing_snapshot bigint)
language sql stable security definer set search_path = '' as $$
  with inventory as (
    select c.iso_alpha2,p.expires_at,p.source_snapshot_sha256
    from public.countries c
    left join public.regulatory_market_access_primary_sources p on p.jurisdiction_iso2=c.iso_alpha2
    where c.iso_alpha2 is not null
  )
  select count(*)::bigint,
    count(*) filter (where expires_at>now() and source_snapshot_sha256 is not null)::bigint,
    count(*) filter (where expires_at is null)::bigint,
    count(*) filter (where expires_at<=now())::bigint,
    count(*) filter (where expires_at>now() and source_snapshot_sha256 is null)::bigint
  from inventory;
$$;
revoke all on function api.assert_market_access_primary_source_hardening() from public, anon, authenticated;
grant execute on function api.assert_market_access_primary_source_hardening() to service_role;

-- Deliberately no guessed URLs are inserted. A jurisdiction enters the registry
-- only after its primary source has been fetched/read and its snapshot hash recorded.
