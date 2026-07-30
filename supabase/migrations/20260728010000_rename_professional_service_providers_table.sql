-- Fixes a real bug found by live-testing 20260728000000's migration via the
-- actual REST endpoint (not just SQL-level grant inspection): when a table
-- and a view share the same name across schemas (public.X / api.X), this
-- project's PostgREST resolves ambiguous requests to the `public` schema
-- rather than honoring the `Accept-Profile`/`Content-Profile` header,
-- REGARDLESS of that header. GET /rest/v1/professional_service_providers
-- with `Accept-Profile: api` returned 401 "permission denied for table
-- professional_service_providers" with a hint pointing at the *public*
-- table -- meaning anon could not browse the directory at all despite every
-- grant being correct at the SQL level (verified independently via
-- information_schema.role_table_grants).
--
-- The existing same-name-across-schemas precedent this repo follows
-- (public.client_error_reports / api.client_error_reports, see
-- 20260710190200_client_error_reports.sql) never actually surfaced this,
-- because that table grants IDENTICAL permissions (insert) in both schemas
-- -- so whichever schema PostgREST silently picked, the request still
-- succeeded, masking the same underlying ambiguity. This table's public and
-- api permissions intentionally differ (public: authenticated insert only;
-- api: anon+authenticated select of approved rows only), which is exactly
-- the case where the collision becomes visible and breaks the feature.
--
-- Fix: rename the base table so it no longer collides with the api-schema
-- view name. Renaming preserves the table's existing RLS policies, grants,
-- and indexes automatically (they're attached to the table's OID, not its
-- name) -- confirmed below by NOT re-declaring the RLS policy or the insert
-- grant, only recreating the two views that reference the table by name.
-- App code is unaffected: it queries through the api-schema view name
-- ('professional_service_providers'), which is unchanged.

alter table public.professional_service_providers
  rename to professional_service_provider_listings;

alter index professional_service_providers_status_category_idx
  rename to professional_service_provider_listings_status_category_idx;

create or replace view api.professional_service_providers
with (security_invoker = true)
as
select id, category, name, description, markets_covered, website, created_at
from public.professional_service_provider_listings
where status = 'approved';

grant select on api.professional_service_providers to anon, authenticated;

create or replace view api.professional_service_provider_applications
with (security_invoker = true)
as select * from public.professional_service_provider_listings;

grant insert on api.professional_service_provider_applications to authenticated;

notify pgrst, 'reload schema';
