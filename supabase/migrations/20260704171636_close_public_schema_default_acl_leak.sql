-- ============================================================
-- Found during a post-session "is anything missing" audit.
--
-- This project has a default-privileges rule on the `public` schema
-- (set by `postgres`/`supabase_admin`, visible in pg_default_acl for
-- object type 'f') that grants EXECUTE to anon + authenticated on
-- every NEW function created in `public`, independent of the PUBLIC
-- pseudo-role. `revoke all on function ... from public` only strips
-- the PUBLIC-pseudo-role grant — it does NOT touch this separate,
-- role-specific default grant. Net effect: every "revoke all from
-- public" in this session's earlier migrations left anon+authenticated
-- with EXECUTE on the underlying public.* function regardless.
--
-- This is not a live REST-reachable hole today — PostgREST only
-- exposes the `api` schema (lib/supabase/env.ts), and the `api.*`
-- wrappers came out clean (no equivalent default-ACL rule on `api`).
-- But it's exactly the kind of latent landmine ADR #9 says to close:
-- if `public` were ever added to Data API's exposed schemas, these
-- would become directly callable by anonymous users as SECURITY
-- DEFINER. Fixing it now while cheap rather than leaving it.
--
-- Scoped to the three public.* functions touched this session
-- (get_command_centre_stats is new; the other two got api.* wrappers
-- today, so they're "mine" for this pass even though the underlying
-- public functions predate this session). Also re-applies an explicit
-- by-name revoke on the api.* wrappers for the same three, even
-- though they already tested clean — cheap defense-in-depth, no
-- functional change since service_role already holds EXECUTE either way.
-- ============================================================

revoke execute on function public.get_command_centre_stats() from anon, authenticated;
revoke execute on function public.enqueue_regulatory_enrichment() from anon, authenticated;
revoke execute on function public.claim_intelligence_job(text, text) from anon, authenticated;

revoke execute on function api.get_command_centre_stats() from anon, authenticated;
revoke execute on function api.enqueue_regulatory_enrichment() from anon, authenticated;
revoke execute on function api.claim_intelligence_job(text, text) from anon, authenticated;
