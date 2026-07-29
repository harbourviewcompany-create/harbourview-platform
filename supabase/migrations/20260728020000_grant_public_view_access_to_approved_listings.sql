-- Fixes a real bug found by live-testing 20260728000000's migration against
-- the actual REST endpoint (not just inspecting grants via SQL, which looked
-- correct and wasn't). GET /rest/v1/professional_service_providers returned
-- 401 "permission denied for table professional_service_provider_listings"
-- for anon, even though api.professional_service_providers had the right
-- SELECT grant.
--
-- Root cause: this project enforces `security_invoker = true` on every view
-- in the `api` schema via a DDL event trigger
-- (enforce_api_view_security_invoker_trigger) -- a deliberate, project-wide
-- guardrail that cannot be overridden per-view. Confirmed by dropping and
-- recreating the view with no WITH clause at all and re-checking
-- pg_class.reloptions -- it still came back security_invoker=true.
--
-- With security_invoker=true enforced, PostgREST queries execute the view
-- AS THE CALLING ROLE, so the underlying table's own grants/RLS have to
-- independently permit that role, in addition to the view's own grant --
-- the view's WHERE clause alone isn't a sufficient security boundary here.
-- The base table intentionally had zero anon/authenticated SELECT (correct
-- instinct: don't want unrestricted reads), but that meant NO role could
-- ever read through the view at all.
--
-- Fix: grant SELECT on the base table, restricted to approved rows via an
-- RLS policy (row-level filtering), while the view's column list continues
-- to do the column-level filtering (contact_email, submitted_by, status,
-- reviewed_at, reviewer_notes stay excluded from every response regardless
-- of the broader table-level grant, since the view simply never selects
-- them). This is safe to grant broadly at the table level because `public`
-- is not a PostgREST-exposed schema in this project (confirmed live: a
-- public-only object name returns PGRST205 "not found", not a permission
-- error) -- the base table is not reachable by name via REST regardless of
-- its grants; the view is the only access path, and it does the real work.
--
-- Live-verified end to end: inserted one 'pending' and one 'approved' test
-- row directly, confirmed GET as anon returned exactly the approved row
-- with only the public column set, confirmed the pending row and the
-- restricted columns were both absent, then deleted the test rows.

drop policy if exists "Public can view approved listings" on public.professional_service_provider_listings;
create policy "Public can view approved listings"
  on public.professional_service_provider_listings
  for select
  to anon, authenticated
  using (status = 'approved');

grant select on public.professional_service_provider_listings to anon, authenticated;
