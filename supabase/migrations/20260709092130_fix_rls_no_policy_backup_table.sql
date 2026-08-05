-- country_intel_backup_20260630 is an out-of-band production snapshot.
-- When present, add the production service-role-only policy so internal backup
-- and restore operations can access it while anon/authenticated remain denied.
-- Zero-state history intentionally does not fabricate the backup relation.
do $guard_country_intel_backup_policy$
declare
  target_relation regclass := to_regclass('public.country_intel_backup_20260630');
begin
  if target_relation is not null
     and not exists (
       select 1
       from pg_policy
       where polrelid = target_relation
         and polname = 'service_role_only'
     ) then
    execute $policy$
      create policy service_role_only
        on public.country_intel_backup_20260630
        as permissive
        for all
        to public
        using ((select auth.role()) = 'service_role'::text)
    $policy$;
  end if;
end
$guard_country_intel_backup_policy$;
