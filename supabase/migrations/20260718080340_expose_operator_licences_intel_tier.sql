-- Extends the same pattern as 20260714192255 to the competitor/operator
-- side: operator_licences (licence_class, gmp_certified, gacp_certified,
-- authorized_activities per named company) existed with zero api exposure
-- and a fully-public RLS policy, same as regulatory_pathways was.
--
-- cannabis_operators itself (the base company listing: name, type, country)
-- is already live and public -- shown today in MarketplacePage's "Verified
-- Operators" sidebar. That stays public. What's gated here is the specific
-- competitive intelligence layer on top of it: which licence class, GMP/GACP
-- certification, authorized activities -- the detail that turns "this
-- company exists" into "this company is a verified, certified match for
-- this exact corridor."
--
-- operator_countries (bare presence: headquarters/subsidiary/distribution)
-- stays public too -- lower incremental value to gate, since
-- cannabis_operators.country_iso2 already discloses primary-country
-- presence today.

drop policy if exists public_select_operator_licences on public.operator_licences;
create policy operator_licences_tier_read on public.operator_licences
  for select
  using (public.current_user_tier() in ('intel','operator'));

revoke select on public.operator_licences from anon;
grant select on public.operator_licences to authenticated;

create or replace view api.operator_licences
with (security_invoker = true) as
select id, operator_id, licence_class, issuing_regulator, authorized_activities,
       licence_status, gmp_certified, gacp_certified, facility_city,
       facility_province_state, last_verified
from public.operator_licences;

grant select on api.operator_licences to authenticated;

-- operator_countries had zero api exposure at all (found via
-- get_tables_missing_from_api_schema), same gap as product_formats had.
create or replace view api.operator_countries
with (security_invoker = true) as
select id, operator_id, country_iso2, presence_type
from public.operator_countries;

grant select on api.operator_countries to anon, authenticated;
