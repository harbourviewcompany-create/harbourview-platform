revoke all on schema net from public;
revoke all on schema net from anon, authenticated;
do $$
declare r record;
begin
  if exists (select 1 from pg_namespace where nspname='net') then
    for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_depend d on d.objid=p.oid and d.deptype='e' join pg_extension e on e.oid=d.refobjid where e.extname='pg_net' loop
      execute format('revoke execute on function %s from public', r.sig);
      execute format('revoke execute on function %s from anon, authenticated', r.sig);
    end loop;
  end if;
end $$;
