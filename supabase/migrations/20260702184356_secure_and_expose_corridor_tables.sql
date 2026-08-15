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
-- version 20260702184356.
--
-- Rewriting this file cannot affect production: 20260702184356 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

ALTER TABLE public.corridor_processing_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corridor_regulatory_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS corridor_processing_times_public_read ON public.corridor_processing_times;
CREATE POLICY corridor_processing_times_public_read ON public.corridor_processing_times
  FOR SELECT USING (true);

DROP POLICY IF EXISTS corridor_regulatory_alerts_public_read ON public.corridor_regulatory_alerts;
CREATE POLICY corridor_regulatory_alerts_public_read ON public.corridor_regulatory_alerts
  FOR SELECT USING (true);

REVOKE TRUNCATE ON public.corridor_processing_times FROM anon, authenticated;
REVOKE TRUNCATE ON public.corridor_regulatory_alerts FROM anon, authenticated;

CREATE VIEW api.corridor_processing_times AS SELECT * FROM public.corridor_processing_times;
ALTER VIEW api.corridor_processing_times SET (security_invoker = true);
GRANT SELECT ON api.corridor_processing_times TO anon, authenticated;

CREATE VIEW api.corridor_regulatory_alerts AS SELECT * FROM public.corridor_regulatory_alerts;
ALTER VIEW api.corridor_regulatory_alerts SET (security_invoker = true);
GRANT SELECT ON api.corridor_regulatory_alerts TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
