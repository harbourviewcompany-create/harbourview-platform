-- country_intel_backup_20260630 is an out-of-band production snapshot.
-- When present, add the production service-role-only policy so internal backup
-- and restore operations can access it while anon/authenticated remain denied.
-- Zero-state history intentionally does not fabricate the backup relation.
do $guard_country_intel_backup_policy$
begin
  if to_regclass('public.country_intel_backup_20260630') is not null
     and not exists (
       select 1
       from pg_policy
       where polrelid = 'public.country_intel_backup_20260630'::regclass
         and polname = 'service_role_only'
     ) then
    create policy service_role_only
      on public.country_intel_backup_20260630
      as permissive
      for all
      to public
      using ((select auth.role()) = 'service_role'::text);
  end if;
end
$guard_country_intel_backup_policy$;
