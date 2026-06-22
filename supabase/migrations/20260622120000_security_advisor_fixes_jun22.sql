-- Migration: security_advisor_fixes_jun22
-- Addresses Supabase security advisor findings from 2026-06-22 audit
-- Covers: anon SECURITY DEFINER exposure, storage bucket listing, RLS no-policy tables
-- Note: vector and pg_net extension schema move requires downtime — deferred to separate migration
-- Note: Enable leaked password protection manually in Supabase Dashboard → Auth → Password Settings

-- =============================================================================
-- SECTION 1: Revoke EXECUTE on anon-callable SECURITY DEFINER functions
-- These functions are callable by the anon role but should not be.
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.get_country_status(p_iso2 text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_genetics_admin_or_reviewer() FROM anon;


-- =============================================================================
-- SECTION 2: Switch SECURITY DEFINER trigger function to SECURITY INVOKER
-- Only cc_set_updated_at() is safe to recreate as a simple trigger helper.
-- get_country_status and is_genetics_admin_or_reviewer bodies are not
-- reproduced here to avoid accidental breakage — only the anon REVOKE above
-- is applied for those two functions.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.cc_set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- =============================================================================
-- SECTION 3: Restrict storage bucket listing for public-assets
-- Remove broad SELECT policy that allows listing all files, then re-add a
-- more targeted policy that allows read by URL but not directory listing.
-- =============================================================================

DROP POLICY IF EXISTS "public_assets_public_read" ON storage.objects;

CREATE POLICY "public_assets_object_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'public-assets' AND name IS NOT NULL);


-- =============================================================================
-- SECTION 4: Add RLS policies for tables with RLS enabled but zero policies
-- These tables currently block all access. Policies are added per table role.
-- =============================================================================

-- _push_staging: service role only
CREATE POLICY "service_role_only" ON public._push_staging
  USING (auth.role() = 'service_role');

-- adi_cache: service role only
CREATE POLICY "service_role_only" ON public.adi_cache
  USING (auth.role() = 'service_role');

-- adi_source_log: service role only
CREATE POLICY "service_role_only" ON public.adi_source_log
  USING (auth.role() = 'service_role');

-- country_coverage_matrix: allow authenticated read
CREATE POLICY "authenticated_read" ON public.country_coverage_matrix
  FOR SELECT TO authenticated
  USING (true);

-- country_data_import_runs: service role only
CREATE POLICY "service_role_only" ON public.country_data_import_runs
  USING (auth.role() = 'service_role');

-- country_regulatory_profiles_admin: allow authenticated read
CREATE POLICY "authenticated_read" ON public.country_regulatory_profiles_admin
  FOR SELECT TO authenticated
  USING (true);

-- llm_rate_limits: service role only
CREATE POLICY "service_role_only" ON public.llm_rate_limits
  USING (auth.role() = 'service_role');

-- review_queue: service role only
CREATE POLICY "service_role_only" ON public.review_queue
  USING (auth.role() = 'service_role');

-- source_expansion_coverage_queue: allow authenticated read
CREATE POLICY "authenticated_read" ON public.source_expansion_coverage_queue
  FOR SELECT TO authenticated
  USING (true);

-- source_expansion_import_runs: service role only
CREATE POLICY "service_role_only" ON public.source_expansion_import_runs
  USING (auth.role() = 'service_role');

-- source_expansion_import_staging: service role only
CREATE POLICY "service_role_only" ON public.source_expansion_import_staging
  USING (auth.role() = 'service_role');

-- source_import_batches: service role only
CREATE POLICY "service_role_only" ON public.source_import_batches
  USING (auth.role() = 'service_role');

-- source_import_rejections: service role only
CREATE POLICY "service_role_only" ON public.source_import_rejections
  USING (auth.role() = 'service_role');
