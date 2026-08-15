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
-- version 20260714213221.
--
-- Rewriting this file cannot affect production: 20260714213221 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Cleanup: parallel-session inserts created duplicate facts under Title Case metric_name
-- variants alongside the snake_case rows this project otherwise uses. Same underlying value,
-- same unit, just a different name string -- so the (country_iso2, metric_name, period_start,
-- period_end) unique constraint didn't catch them. Keeping the snake_case row in each pair.

DELETE FROM public.market_metrics
WHERE country_iso2 = 'UA' AND metric_name IN ('INCB Import Quota 2026', 'Estimated Addressable Patient Population');

DELETE FROM public.market_metrics
WHERE country_iso2 = 'SI' AND metric_name = 'Projected Medical Cannabis Market Size 2029';

DELETE FROM public.market_metrics
WHERE country_iso2 = 'GD' AND metric_name IN ('Legal Personal Possession Threshold', 'Maximum Household Cultivation Plants');

DELETE FROM public.market_metrics
WHERE country_iso2 = 'IE' AND metric_name IN ('2025 Customs Cannabis Seizure Value', 'MCAP Ministerial-Approval Route Patients');
