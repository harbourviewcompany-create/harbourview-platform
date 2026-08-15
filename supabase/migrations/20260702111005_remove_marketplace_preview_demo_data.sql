-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260702111005.
--
-- Rewriting this file cannot affect production: 20260702111005 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Removes all "Marketplace Preview" demo/placeholder data from the live marketplace.
-- Verified before this migration: zero disclosure_requests, marketplace_inquiries,
-- marketplace_candidates, or listings.superseded_by references touch any of this
-- data. marketplace_item_images cascades automatically via its own FK.
-- Order: matches (child) -> listings/buyer_requests (parents).

delete from public.matches
where buyer_request_id in (select id from public.buyer_requests where title ilike '%marketplace preview%')
   or listing_id in (select id from public.listings where title ilike '%marketplace preview%');

delete from public.listings
where title ilike '%marketplace preview%';

delete from public.buyer_requests
where title ilike '%marketplace preview%';
