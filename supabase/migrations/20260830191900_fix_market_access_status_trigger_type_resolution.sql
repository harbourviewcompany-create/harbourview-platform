-- Reconstructed from production. Verbatim statements for version 20260830191900.
-- Forward fix for the production-reconciled 20260830184434 trigger body.
-- The historical function casts to an unqualified market_access_status enum.
-- In later trigger execution paths that resolve with a restricted search_path,
-- PostgreSQL cannot resolve that type name. Keep the historical migration body
-- unchanged and replace only the live function with an explicitly-qualified
-- enum reference before any subsequent regulatory-tier update can fire it.

create or replace function public.sync_market_access_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.market_access_status := case new.regulatory_tier
    when 'legal_commercial_access' then 'open'
    when 'medical_limited_trade'   then 'regulated'
    when 'domestic_only'           then 'emerging'
    when 'cbd_hemp_only'           then 'limited'
    when 'prohibited'              then 'restricted'
    else 'unknown'
  end::public.market_access_status;
  return new;
end;
$$;

comment on function public.sync_market_access_status() is
  'Keeps countries.market_access_status synchronized with regulatory_tier; enum type is schema-qualified for restricted-search_path trigger execution.';
