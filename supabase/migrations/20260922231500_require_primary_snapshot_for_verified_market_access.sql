-- Make the public regulatory tier resolver require an actual primary-source snapshot.
-- Direct jurisdiction evidence takes precedence for both national and subnational rows.
-- National inheritance remains limited to the explicitly approved CA/AU/DE pathways.

begin;

create or replace function api.resolve_verified_market_access_evidence(p_iso text, p_at timestamptz default now())
returns table(evidence_key text,tier text,verified_at timestamptz,expires_at timestamptz)
language sql
stable
security definer
set search_path=''
as $$
  with direct_match as (
    select e.evidence_key,e.tier,e.verified_at,e.expires_at,0 as precedence
    from public.regulatory_market_access_evidence e
    join public.regulatory_market_access_primary_sources p
      on p.jurisdiction_iso2=e.jurisdiction_iso2
     and p.source_snapshot_sha256=e.source_snapshot_sha256
     and p.expires_at>p_at
    where e.active
      and e.jurisdiction_iso2=p_iso
      and e.source_snapshot_sha256 is not null
      and e.verified_at<=p_at
      and e.expires_at>p_at
  ),
  inherited_match as (
    select e.evidence_key,e.tier,e.verified_at,e.expires_at,1 as precedence
    from public.regulatory_market_access_evidence e
    join public.regulatory_market_access_primary_sources p
      on p.jurisdiction_iso2=e.jurisdiction_iso2
     and p.source_snapshot_sha256=e.source_snapshot_sha256
     and p.expires_at>p_at
    where e.active
      and e.parent_iso2 in ('CA','AU','DE')
      and e.jurisdiction_iso2=e.parent_iso2
      and e.inheritance_scope='national_licensed_pathway'
      and p_iso like e.parent_iso2 || '-%'
      and e.source_snapshot_sha256 is not null
      and e.verified_at<=p_at
      and e.expires_at>p_at
  )
  select x.evidence_key,x.tier,x.verified_at,x.expires_at
  from (select * from direct_match union all select * from inherited_match) x
  order by x.precedence,x.verified_at desc
  limit 1;
$$;

select * from api.refresh_verified_market_access_tiers('primary-source-reconciliation-20260922');

commit;
