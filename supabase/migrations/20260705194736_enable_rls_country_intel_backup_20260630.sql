-- Fix: public.country_intel_backup_20260630 was exposed with RLS disabled.
-- Backup snapshot tables should never be reachable via anon/authenticated
-- roles through PostgREST. Enabling RLS with no policies = default-deny for
-- those roles; service_role (bypassrls) is unaffected.

ALTER TABLE public.country_intel_backup_20260630 ENABLE ROW LEVEL SECURITY;
