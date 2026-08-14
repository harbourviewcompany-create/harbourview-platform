do $revoke_public_default_privileges$
declare
  v_role       text;
  v_remaining  int;
begin
  foreach v_role in array array['postgres', 'supabase_admin']
  loop
    if to_regrole(v_role) is null then
      raise notice 'role % not present; skipping its default privileges', v_role;
      continue;
    end if;

    begin
      execute format(
        'alter default privileges for role %I in schema public '
        'revoke execute on functions from public, anon, authenticated', v_role);
      execute format(
        'alter default privileges for role %I in schema public '
        'revoke all on tables from anon, authenticated', v_role);
      execute format(
        'alter default privileges for role %I in schema public '
        'revoke all on sequences from anon, authenticated', v_role);
    exception
      when insufficient_privilege then
        raise warning
          'cannot alter default privileges owned by % -- they must be changed by '
          'that role. New objects in public will continue to be auto-granted to '
          'anon/authenticated via this entry.', v_role;
      when others then
        raise warning 'could not alter default privileges for %: %', v_role, sqlerrm;
    end;
  end loop;

  select count(*) into v_remaining
  from pg_default_acl d
  join pg_namespace n on n.oid = d.defaclnamespace
  where n.nspname = 'public'
    and d.defaclobjtype in ('r', 'S')
    and d.defaclacl::text ~ '(anon|authenticated)=';

  if v_remaining > 0 then
    raise warning
      'public still has % table/sequence default-privilege entr(y/ies) granting '
      'anon or authenticated. New tables there will be auto-exposed.', v_remaining;
  else
    raise notice
      'public table/sequence defaults no longer grant anon or authenticated '
      '(function EXECUTE to PUBLIC is unaffected by design -- see header)';
  end if;
end
$revoke_public_default_privileges$;