-- Root cause found via live REST testing: api.professional_service_providers
-- was declared `with (security_invoker = true)`, copied from the INSERT-view
-- precedent (api.client_error_reports) without recognizing that mode is
-- wrong for a SELECT-restriction view. security_invoker=true makes the view
-- execute as the CALLING role, so anon also needed direct SELECT on the
-- underlying public.professional_service_provider_listings table -- which
-- was intentionally never granted (RLS + no anon grant is the point, the
-- view's own WHERE status='approved' + column list is supposed to be the
-- security boundary). Result: anon could never actually read the view,
-- despite every grant on the view itself being correct -- confirmed via
-- information_schema and via three rounds of live REST testing.
--
-- Fix: default to security_invoker=false (the Postgres default -- simply
-- omitting the WITH clause) so the view runs with its OWNER's privileges,
-- bypassing the base table's RLS/grants, with the view's own query doing
-- the actual restriction. This is the standard "curated read view over an
-- RLS-protected table" pattern. The INSERT-facing
-- api.professional_service_provider_applications view keeps
-- security_invoker=true deliberately -- that one SHOULD enforce as the
-- caller, since the point there is to require the caller to satisfy the
-- insert policy themselves (matches original client_error_reports intent).

create or replace view api.professional_service_providers
as
select id, category, name, description, markets_covered, website, created_at
from public.professional_service_provider_listings
where status = 'approved';

grant select on api.professional_service_providers to anon, authenticated;

-- Drop the public-schema workaround view from the prior (unnecessary, since
-- db-schemas here is 'api' only -- public.* objects aren't reachable by name
-- via REST at all, confirmed by the PGRST205 "not found" response it got).
drop view if exists public.professional_service_providers_public;

notify pgrst, 'reload schema';
