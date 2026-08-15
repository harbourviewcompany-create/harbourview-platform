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
-- version 20260704171507.
--
-- Rewriting this file cannot affect production: 20260704171507 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- The public genetics marketplace surfaces (/genetics, /genetics/cultivars,
-- /genetics/services, /genetics/collaboration) have never shown real data
-- to anyone but a row's own owner or a genetics admin/reviewer. Root cause,
-- confirmed directly against pg_policies: cultivar_passports,
-- cultivar_aliases, cultivar_country_opportunities, genetics_evidence_items,
-- genetics_collaboration_projects and genetics_service_providers only ever
-- had an owner/admin-scoped "_owner_all" RLS policy -- there was never a
-- public-read policy for the is_public/visibility='public_summary' rows
-- that lib/genetics/queries.ts and lib/genetics/dto.ts were already written
-- to filter for (getPublicCultivarPassports, getPublicServiceProviders,
-- getPublicCollaborationProjects, publicEvidenceSummaries). 2 cultivars
-- currently have is_public=true and were completely invisible to anon AND
-- to any authenticated non-owner user.
--
-- Confirmed live via Vercel runtime error logs (2026-07-04):
--   [genetics_queries] getPublicServiceProviders failed:
--     Could not find the table 'api.genetics_service_providers' in schema cache
--   [genetics_queries] getPublicCollaborationProjects failed:
--     Could not find the table 'api.genetics_collaboration_projects' in schema cache
--   [genetics_queries] cultivar_aliases fetch failed:
--     Could not find the table 'api.cultivar_aliases' in schema cache
-- i.e. on top of the missing RLS, 3 of these tables were never exposed
-- through the api schema at all (PostgREST 404s before RLS is even
-- evaluated), and none had an anon grant.

-- ── Public-read RLS: additive policies alongside each existing *_owner_all ──
CREATE POLICY cultivar_passports_public_read ON public.cultivar_passports
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

CREATE POLICY cultivar_aliases_public_read ON public.cultivar_aliases
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

CREATE POLICY cultivar_country_opportunities_public_read ON public.cultivar_country_opportunities
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cultivar_passports cp
    WHERE cp.id = cultivar_country_opportunities.cultivar_id AND cp.is_public = true
  ));

CREATE POLICY genetics_evidence_items_public_summary_read ON public.genetics_evidence_items
  FOR SELECT TO anon, authenticated
  USING (visibility = 'public_summary');

CREATE POLICY genetics_collaboration_projects_public_read ON public.genetics_collaboration_projects
  FOR SELECT TO anon, authenticated
  USING (visibility = 'public_summary');

CREATE POLICY genetics_service_providers_public_read ON public.genetics_service_providers
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

-- ── Missing api-schema views (PostgREST-visible; security_invoker so RLS
--    above actually applies to queries made through them) ──
CREATE VIEW api.cultivar_aliases AS SELECT * FROM public.cultivar_aliases;
ALTER VIEW api.cultivar_aliases SET (security_invoker = true);

CREATE VIEW api.genetics_collaboration_projects AS SELECT * FROM public.genetics_collaboration_projects;
ALTER VIEW api.genetics_collaboration_projects SET (security_invoker = true);

CREATE VIEW api.genetics_service_providers AS SELECT * FROM public.genetics_service_providers;
ALTER VIEW api.genetics_service_providers SET (security_invoker = true);

-- ── Grants matching the new public-read policies (both schemas) ──
GRANT SELECT ON public.cultivar_passports TO anon;
GRANT SELECT ON api.cultivar_passports TO anon;

GRANT SELECT ON public.cultivar_aliases TO anon, authenticated;
GRANT SELECT ON api.cultivar_aliases TO anon, authenticated;

GRANT SELECT ON public.cultivar_country_opportunities TO anon;
GRANT SELECT ON api.cultivar_country_opportunities TO anon;

GRANT SELECT ON public.genetics_evidence_items TO anon;
GRANT SELECT ON api.genetics_evidence_items TO anon;

GRANT SELECT ON public.genetics_collaboration_projects TO anon, authenticated;
GRANT SELECT ON api.genetics_collaboration_projects TO anon, authenticated;

GRANT SELECT ON public.genetics_service_providers TO anon, authenticated;
GRANT SELECT ON api.genetics_service_providers TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
