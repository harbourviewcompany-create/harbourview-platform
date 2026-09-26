-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260922231639
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

update public.regulatory_market_access_evidence e
set source_snapshot_sha256=p.source_snapshot_sha256,
    authority_name=p.authority_name,
    authority_url=p.authority_url,
    verified_at=now(),
    expires_at=now()+interval '365 days'
from public.regulatory_market_access_primary_sources p
where p.jurisdiction_iso2=e.jurisdiction_iso2
  and p.expires_at>now()
  and e.active=true
  and e.jurisdiction_iso2 in ('NL','DE-BY');

select api.refresh_verified_market_access_tiers('official-primary-source-adjudication-20260922') as refreshed;
