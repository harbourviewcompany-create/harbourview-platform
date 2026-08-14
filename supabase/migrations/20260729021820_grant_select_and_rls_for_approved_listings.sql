-- Real root cause: this project enforces security_invoker=true on every
-- api-schema view via a DDL event trigger
-- (enforce_api_view_security_invoker_trigger) -- a deliberate, project-wide
-- safety guardrail that cannot be overridden per-view (confirmed: DROP+
-- CREATE VIEW with no WITH clause at all still resulted in
-- security_invoker=true in pg_class.reloptions). This is the correct
-- behavior to design around, not fight.
--
-- With security_invoker=true enforced, the calling role (anon/authenticated)
-- needs its own SELECT grant + RLS policy satisfied on the underlying base
-- table -- the view's own WHERE clause is not sufficient on its own. Adding
-- both here. This is safe to do broadly (not narrowing to specific columns)
-- because:
--   1. This project's PostgREST only exposes the `api` schema (confirmed via
--      live testing: requesting an api-schema-only object with no
--      counterpart in `public` returned PGRST205 "not found", not a
--      permission or public-schema resolution) -- so
--      public.professional_service_provider_listings is never reachable by
--      name via REST at all, regardless of what's granted on it directly.
--   2. Column-level restriction (hiding contact_email, submitted_by,
--      status, reviewed_at, reviewer_notes from anon/authenticated) is
--      enforced by api.professional_service_providers' own column list,
--      which is unaffected by the base table's grant breadth.

drop policy if exists "Public can view approved listings" on public.professional_service_provider_listings;
create policy "Public can view approved listings"
  on public.professional_service_provider_listings
  for select
  to anon, authenticated
  using (status = 'approved');

grant select on public.professional_service_provider_listings to anon, authenticated;
