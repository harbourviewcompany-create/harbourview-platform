-- June 22 security-advisor remediation, replay-safe across historical states.
-- Every function and relation change is applied only when its exact target
-- exists. Browser grants are aligned with each policy instead of relying on RLS
-- policy presence alone.

-- Revoke anonymous execution from privileged helper functions when present.
do $advisor_function_hardening$
declare
  signature text;
begin
  foreach signature in array array[
    'public.get_country_status(text)',
    'public.is_genetics_admin_or_reviewer()'
  ]
  loop
    if to_regprocedure(signature) is not null then
      execute format('revoke execute on function %s from public, anon', signature);
      execute format('grant execute on function %s to authenticated, service_role', signature);
    end if;
  end loop;
end
$advisor_function_hardening$;

-- This trigger helper performs no privileged reads or writes and should execute
-- with the caller's privileges.
create or replace function public.cc_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- Retain object reads for the public-assets bucket while removing the former
-- blanket policy definition. Bucket listing behavior remains controlled by the
-- storage API and the bucket's public configuration.
do $public_assets_policy$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists "public_assets_public_read" on storage.objects';
    execute 'drop policy if exists "public_assets_object_read" on storage.objects';
    execute $policy$
      create policy "public_assets_object_read"
      on storage.objects
      for select
      to public
      using (bucket_id = 'public-assets' and name is not null)
    $policy$;
  end if;
end
$public_assets_policy$;

-- Close internal tables to browser roles and expose only the explicitly audited
-- read-only operational surfaces to authenticated users.
do $advisor_table_policies$
declare
  item record;
  qualified_name text;
begin
  for item in
    select *
    from (values
      ('_push_staging',                    'service_role_only',  'service'),
      ('adi_cache',                        'service_role_only',  'service'),
      ('adi_source_log',                   'service_role_only',  'service'),
      ('country_coverage_matrix',          'authenticated_read', 'read'),
      ('country_data_import_runs',         'service_role_only',  'service'),
      ('country_regulatory_profiles_admin','authenticated_read', 'read'),
      ('llm_rate_limits',                  'service_role_only',  'service'),
      ('review_queue',                     'service_role_only',  'service'),
      ('source_expansion_coverage_queue',  'authenticated_read', 'read'),
      ('source_expansion_import_runs',     'service_role_only',  'service'),
      ('source_expansion_import_staging',  'service_role_only',  'service'),
      ('source_import_batches',            'service_role_only',  'service'),
      ('source_import_rejections',         'service_role_only',  'service')
    ) as policy_inventory(table_name, policy_name, access_mode)
  loop
    qualified_name := format('public.%I', item.table_name);
    if to_regclass(qualified_name) is null then
      continue;
    end if;

    execute format('alter table %s enable row level security', qualified_name);
    execute format('drop policy if exists %I on %s', item.policy_name, qualified_name);
    execute format('revoke all privileges on table %s from public, anon, authenticated', qualified_name);
    execute format('grant all privileges on table %s to service_role', qualified_name);

    if item.access_mode = 'read' then
      execute format('grant select on table %s to authenticated', qualified_name);
      execute format(
        'create policy %I on %s for select to authenticated using (true)',
        item.policy_name,
        qualified_name
      );
    else
      execute format(
        'create policy %I on %s for all to service_role using (true) with check (true)',
        item.policy_name,
        qualified_name
      );
    end if;
  end loop;
end
$advisor_table_policies$;
