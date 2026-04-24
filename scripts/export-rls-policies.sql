select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  p.polname as policy_name,
  case p.polcmd
    when 'r' then 'select'
    when 'a' then 'insert'
    when 'w' then 'update'
    when 'd' then 'delete'
    when '*' then 'all'
  end as command,
  case p.polpermissive
    when true then 'permissive'
    else 'restrictive'
  end as policy_type,
  pg_get_expr(p.polqual, p.polrelid) as using_expression,
  pg_get_expr(p.polwithcheck, p.polrelid) as with_check_expression,
  coalesce(array_to_string(array(select rolname from pg_roles where oid = any(p.polroles)), ', '), '') as roles
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname, p.polname;
