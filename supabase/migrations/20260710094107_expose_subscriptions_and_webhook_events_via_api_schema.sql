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
-- version 20260710094107.
--
-- Rewriting this file cannot affect production: 20260710094107 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create view api.subscriptions as
select id, user_id, stripe_customer_id, status, tier, price_id, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at, updated_at
from public.subscriptions;
grant select on api.subscriptions to anon, authenticated, service_role;

create view api.stripe_webhook_events as
select id, type, processed_at
from public.stripe_webhook_events;
grant select on api.stripe_webhook_events to authenticated, service_role;
