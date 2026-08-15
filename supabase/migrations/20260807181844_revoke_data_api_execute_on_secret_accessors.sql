do $revoke_secret_accessor_execute$
declare
  target      text;
  v_remaining text[] := '{}';
begin
  foreach target in array array[
    'public.get_github_pat()',
    'api.get_github_pat()',
    'api.hv_get_github_pat()',
    'public.verify_hv_cron_secret(text)',
    'public.verify_hv_bridge_key(text)',
    'public.verify_source_engine_cron_secret(text)',
    'api.verify_hv_cron_secret(text)',
    'api.verify_hv_bridge_key(text)',
    'api.hv_bridge_key_matches(text)'
  ]
  loop
    if to_regprocedure(target) is null then
      raise notice 'skipping %, not present', target;
      continue;
    end if;

    execute format('revoke all privileges on function %s from public, anon, authenticated', target);
    execute format('grant execute on function %s to service_role', target);

    if has_function_privilege('anon', to_regprocedure(target), 'execute')
       or has_function_privilege('authenticated', to_regprocedure(target), 'execute')
    then
      v_remaining := v_remaining || target;
    end if;
  end loop;

  if array_length(v_remaining, 1) is not null then
    raise exception
      'anon or authenticated still hold EXECUTE on secret accessors after revoke: %',
      array_to_string(v_remaining, ', ');
  end if;

  raise notice 'secret accessors are service_role-only';
end
$revoke_secret_accessor_execute$;

notify pgrst, 'reload schema';