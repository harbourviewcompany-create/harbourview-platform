-- INTENT DOCUMENTATION: 14 tables have RLS enabled but zero policies.
-- This fails closed (no role can access them) which is safe, but the intent
-- should be explicit rather than accidental. All are internal pipeline /
-- admin tables — no app-facing reads, no user-facing writes. Correct model
-- is service_role ALL only.
--
-- Tables: _push_staging, adi_cache, adi_source_log, country_coverage_matrix,
--   country_data_import_runs, country_regulatory_profiles_admin, llm_rate_limits,
--   review_queue, source_expansion_coverage_queue, source_expansion_import_runs,
--   source_expansion_import_staging, source_import_batches, source_import_rejections,
--   supplier_applications
--
-- NOTE on supplier_applications: this table was the original form target before
-- the Jun 24 fix (submitSupplierApplication now writes to supplier_profiles).
-- It is intentionally left empty and fail-closed for new writes; service_role
-- access is retained only to allow admin inspection of any historical rows.

CREATE POLICY "service_role_all__push_staging"
  ON public._push_staging FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_adi_cache"
  ON public.adi_cache FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_adi_source_log"
  ON public.adi_source_log FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_country_coverage_matrix"
  ON public.country_coverage_matrix FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_country_data_import_runs"
  ON public.country_data_import_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_country_regulatory_profiles_admin"
  ON public.country_regulatory_profiles_admin FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_llm_rate_limits"
  ON public.llm_rate_limits FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_review_queue"
  ON public.review_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_source_expansion_coverage_queue"
  ON public.source_expansion_coverage_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_source_expansion_import_runs"
  ON public.source_expansion_import_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_source_expansion_import_staging"
  ON public.source_expansion_import_staging FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_source_import_batches"
  ON public.source_import_batches FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_source_import_rejections"
  ON public.source_import_rejections FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_supplier_applications"
  ON public.supplier_applications FOR ALL TO service_role USING (true) WITH CHECK (true);
