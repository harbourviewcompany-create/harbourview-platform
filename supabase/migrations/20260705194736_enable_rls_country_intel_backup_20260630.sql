-- Fix: public.country_intel_backup_20260630 was exposed with RLS disabled.
-- Backup snapshot tables should never be reachable via anon/authenticated
-- roles through PostgREST. Enabling RLS with no policies = default-deny for
-- those roles; service_role (bypassrls) is unaffected.
--
-- The backup relation was created directly in production and is not part of
-- the reproducible zero-state schema. Guard the repair so production remains
-- hardened while clean rebuilds continue when the backup table is absent.

do $enable_country_intel_backup_rls$
begin
  if to_regclass('public.country_intel_backup_20260630') is not null then
    alter table public.country_intel_backup_20260630 enable row level security;
  end if;
end
$enable_country_intel_backup_rls$;
