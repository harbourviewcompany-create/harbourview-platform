
-- country_intel_backup_20260630 has RLS enabled but zero policies (deny-all).
-- Add a service-role-only policy so internal backup/restore operations can access it
-- while remaining inaccessible to anon/authenticated users via the API.
CREATE POLICY "service_role_only" ON public.country_intel_backup_20260630
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text);
