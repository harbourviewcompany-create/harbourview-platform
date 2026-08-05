from pathlib import Path

migration_path = Path('supabase/migrations/20260804190000_production_security_hardening.sql')
test_path = Path('tests/supabase/productionSecurityHardening.test.ts')
doc_path = Path('docs/control/SUPABASE_PRODUCTION_SECURITY_HARDENING.md')

migration = migration_path.read_text(encoding='utf-8')
old_net_block = """-- Remove direct access to asynchronous network internals from browser roles.
-- pg_net is optional in isolated/local environments, so guard the schema.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'net') then
    execute 'revoke usage on schema net from public, anon, authenticated';
    execute 'grant usage on schema net to service_role';
  end if;
end
$$;
"""
new_net_block = old_net_block + """
-- pg_net routines are extension-owned and therefore excluded from the generic
-- custom-routine loop below. Close their routine ACLs explicitly while keeping
-- the service-role integration path available.
do $$
declare
  routine record;
  routine_kind text;
begin
  for routine in
    select p.oid::regprocedure as signature, p.prokind
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'net'
      and p.prokind in ('f','p')
  loop
    routine_kind := case when routine.prokind = 'p' then 'procedure' else 'function' end;
    execute format(
      'revoke all privileges on %s %s from public, anon, authenticated',
      routine_kind,
      routine.signature
    );
    execute format(
      'grant execute on %s %s to service_role',
      routine_kind,
      routine.signature
    );
  end loop;
end
$$;
"""
if migration.count(old_net_block) != 1:
    raise SystemExit('expected one guarded pg_net schema block')
migration_path.write_text(migration.replace(old_net_block, new_net_block), encoding='utf-8')

test_text = test_path.read_text(encoding='utf-8')
old_test = """    expect(migration).toContain(\"execute 'revoke usage on schema net from public, anon, authenticated'\")
  })
"""
new_test = """    expect(migration).toContain(\"execute 'revoke usage on schema net from public, anon, authenticated'\")
    expect(migration).toContain(\"where n.nspname = 'net'\")
    expect(migration).toContain("'grant execute on %s %s to service_role'")
  })
"""
if test_text.count(old_test) != 1:
    raise SystemExit('expected one pg_net static assertion block')
test_path.write_text(test_text.replace(old_test, new_test), encoding='utf-8')

doc_text = doc_path.read_text(encoding='utf-8')
old_doc = "- `pg_net` remains vendor-managed; direct `net` schema access is removed from browser roles when the schema exists."
new_doc = "- `pg_net` remains vendor-managed; direct `net` schema usage and routine execution are removed from `public`, `anon`, and `authenticated` when the schema exists, while `service_role` retains explicit schema usage and routine execution."
if doc_text.count(old_doc) != 1:
    raise SystemExit('expected one pg_net control outcome')
doc_path.write_text(doc_text.replace(old_doc, new_doc), encoding='utf-8')
