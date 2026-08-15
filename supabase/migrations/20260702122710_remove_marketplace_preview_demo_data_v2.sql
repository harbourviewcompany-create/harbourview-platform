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
-- version 20260702122710.
--
-- Rewriting this file cannot affect production: 20260702122710 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Temporarily lifts the *_no_delete guardrails to perform an explicit,
-- user-confirmed one-time removal of "Marketplace Preview" demo/placeholder
-- data, then restores the guardrails immediately after, in the same
-- transaction. Confirmed explicitly by the platform owner after the
-- guardrails were discovered and surfaced (see EVIDENCE_LOG.md).
--
-- Pre-verified (read-only, prior to this migration): zero disclosure_requests,
-- marketplace_inquiries, marketplace_candidates, or listings.superseded_by
-- rows reference any of this data. No other demo/test/seed naming patterns
-- found elsewhere in listings/buyer_requests/supplier_profiles.

drop rule if exists matches_no_delete on public.matches;
drop rule if exists listings_no_delete on public.listings;
drop rule if exists buyer_requests_no_delete on public.buyer_requests;

delete from public.matches
where buyer_request_id in (select id from public.buyer_requests where title ilike '%marketplace preview%')
   or listing_id in (select id from public.listings where title ilike '%marketplace preview%');

delete from public.listings
where title ilike '%marketplace preview%';

delete from public.buyer_requests
where title ilike '%marketplace preview%';

-- Restore the guardrails exactly as they were before this migration.
create rule matches_no_delete as on delete to public.matches do instead nothing;
create rule listings_no_delete as on delete to public.listings do instead nothing;
create rule buyer_requests_no_delete as on delete to public.buyer_requests do instead nothing;
