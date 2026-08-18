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
-- version 20260704171518.
--
-- Rewriting this file cannot affect production: 20260704171518 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- Confirmed live via Vercel runtime error logs (2026-07-04), recurring
-- through today: /api/dashboard/signals and /api/dashboard/digest both 404
-- at the PostgREST layer with "Could not find the table 'api.signals_quality'
-- in the schema cache", and intelligence-notify_cron fails subscription
-- lookups with "Could not find the table 'api.signal_subscriptions' in the
-- schema cache". Neither had an api-schema view at all.
--
-- signals_quality is a read-only view over `signals` that already bakes in
-- the public-safety filter at definition time (cat <> 'SOURCE_ENGINE' OR
-- score>=50 AND reviewed=true) -- safe for anon+authenticated, same trust
-- boundary as the view itself already enforces.
--
-- signal_subscriptions is user-owned (RLS: auth.uid() = user_id) and is
-- only ever written through the service-role client in
-- app/api/signals/subscribe/route.ts after an explicit auth check --
-- authenticated-only grant, no anon, matching that access pattern.

CREATE VIEW api.signals_quality AS SELECT * FROM public.signals_quality;
ALTER VIEW api.signals_quality SET (security_invoker = true);
GRANT SELECT ON public.signals_quality TO anon, authenticated;
GRANT SELECT ON api.signals_quality TO anon, authenticated;

CREATE VIEW api.signal_subscriptions AS SELECT * FROM public.signal_subscriptions;
ALTER VIEW api.signal_subscriptions SET (security_invoker = true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.signal_subscriptions TO authenticated;

NOTIFY pgrst, 'reload schema';
