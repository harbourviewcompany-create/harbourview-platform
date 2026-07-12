-- Production forward-fix for PR #1021 (bigint review_count, CONCURRENTLY indexes, NULL rating default).
-- Applied directly to production 2026-07-11 via Supabase MCP (Tyler approved). This file reconciles
-- the migration ledger with what is now actually live -- it does not need to be re-run.
--
-- review_count was `integer` (overflow risk under real load); average_rating defaulted to `0.0`
-- instead of NULL (the correct "no ratings yet" value -- every consumer already treats these columns
-- as nullable). Both idx_listings_avg_rating and idx_listings_review_count were rebuilt CONCURRENTLY
-- to avoid locking `listings`.
--
-- Two objects transitively depend on these columns and had to be dropped/recreated to allow the type
-- change: trigger_ratings_updated (BEFORE UPDATE trigger referencing review_count in its WHEN clause)
-- and public.marketplace_public_listings_v1 (view, cascades to api.marketplace_public_listings_v1).
-- Both views were recreated with security_invoker = true preserved -- see the recurring
-- CREATE OR REPLACE VIEW security_invoker regression class documented in
-- 20260709032305/20260710_close_rls_bypass_18_views. Recreating a view resets its privileges to
-- schema defaults, NOT just its WITH options: the first recreation attempt here briefly granted
-- anon/authenticated INSERT/UPDATE/DELETE/TRUNCATE on public.marketplace_public_listings_v1 (default
-- privileges on the public schema), caught and reverted to SELECT-only within the same session before
-- any traffic could hit it. Explicit REGRANT of exactly the prior privilege set is required every time
-- a view is dropped and recreated in this schema, not just security_invoker.

ALTER TABLE listings ALTER COLUMN review_count TYPE bigint;
ALTER TABLE listings ALTER COLUMN average_rating DROP DEFAULT;

-- (trigger_ratings_updated and both marketplace_public_listings_v1 views were dropped/recreated
--  identically around the ALTER above in the live session; no destructive change to their shape.)
