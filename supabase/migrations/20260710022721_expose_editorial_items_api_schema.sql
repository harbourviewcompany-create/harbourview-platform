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
-- version 20260710022721.
--
-- Rewriting this file cannot affect production: 20260710022721 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- editorial_items was created directly in the public schema and never
-- exposed to PostgREST's api schema — the only schema hv-extract's Supabase
-- client can actually see (db: { schema: "api" }). Every insert attempt
-- from the edge function has been failing with "relation does not exist"
-- since the table was created. This follows the exact same pattern as the
-- existing api.hv_import_staging view.
CREATE VIEW api.editorial_items AS
SELECT id, source_id, snapshot_id, headline, summary, why_it_matters,
       outlet_name, source_url, country, region, language, tone,
       published_at, used_in_digest_at, stage, created_at, updated_at
FROM public.editorial_items;

GRANT SELECT, INSERT, UPDATE, DELETE ON api.editorial_items TO service_role;
GRANT SELECT ON api.editorial_items TO authenticated;
GRANT SELECT ON api.editorial_items TO anon;
