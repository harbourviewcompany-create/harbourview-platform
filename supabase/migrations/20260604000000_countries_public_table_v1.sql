-- =============================================================================
-- countries_add_opportunity_score_v1
-- Adds opportunity_score integer column to public.countries.
--
-- Root cause: hooks/useAllCountries and useCountryBrief selected this column
-- in their PostgREST query; its absence caused a silent 400 error on every
-- call, falling back to fixture data for the globe intel layer,
-- intelligence pages, and country-brief grid.
--
-- The public.countries table and its seed data already exist (migrations
-- create_countries_table @ 20260523155437 and seed_countries_core_markets_v1
-- @ 20260524103625). This migration is purely additive.
-- =============================================================================

alter table public.countries
  add column if not exists opportunity_score integer not null default 0;

-- Back-fill from market_access_status
update public.countries set opportunity_score = case market_access_status::text
  when 'open'       then 95
  when 'active'     then 82
  when 'regulated'  then 64
  when 'emerging'   then 52
  when 'limited'    then 36
  when 'restricted' then 22
  when 'unknown'    then 10
  else 10
end
where opportunity_score = 0;

-- Keep in sync on future status changes
create or replace function public.sync_opportunity_score()
returns trigger language plpgsql as $$
begin
  new.opportunity_score := case new.market_access_status::text
    when 'open'       then 95
    when 'active'     then 82
    when 'regulated'  then 64
    when 'emerging'   then 52
    when 'limited'    then 36
    when 'restricted' then 22
    when 'unknown'    then 10
    else 10
  end;
  return new;
end;
$$;

drop trigger if exists sync_opportunity_score_trigger on public.countries;
create trigger sync_opportunity_score_trigger
  before insert or update of market_access_status
  on public.countries
  for each row execute function public.sync_opportunity_score();
