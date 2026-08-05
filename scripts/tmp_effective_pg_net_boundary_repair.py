from pathlib import Path

migration_path = Path('supabase/migrations/20260804190000_production_security_hardening.sql')
assertion_path = Path('supabase/tests/production_security_hardening.sql')
test_path = Path('tests/supabase/productionSecurityHardening.test.ts')
doc_path = Path('docs/control/SUPABASE_PRODUCTION_SECURITY_HARDENING.md')

migration = migration_path.read_text(encoding='utf-8')
routine_block = """-- pg_net routines are extension-owned and therefore excluded from the generic
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
if migration.count(routine_block) != 1:
    raise SystemExit('expected one pg_net routine ACL block')
migration_path.write_text(migration.replace(routine_block, ''), encoding='utf-8')

assertions = assertion_path.read_text(encoding='utf-8')
old_anon = "  and has_function_privilege('anon', p.oid, 'execute');"
new_anon = "  and has_schema_privilege('anon', n.oid, 'usage')\n  and has_function_privilege('anon', p.oid, 'execute');"
old_auth = "  and has_function_privilege('authenticated', p.oid, 'execute')"
new_auth = "  and has_schema_privilege('authenticated', n.oid, 'usage')\n  and has_function_privilege('authenticated', p.oid, 'execute')"
if assertions.count(old_anon) != 1 or assertions.count(old_auth) != 1:
    raise SystemExit('expected one anon and authenticated execution assertion')
assertion_path.write_text(
    assertions.replace(old_anon, new_anon).replace(old_auth, new_auth),
    encoding='utf-8',
)

test_text = test_path.read_text(encoding='utf-8')
old_test = """    expect(migration).toContain(\"where n.nspname = 'net'\")
    expect(migration).toContain(\"'grant execute on %s %s to service_role'\")
"""
new_test = """    expect(assertions).toContain(\"has_schema_privilege('anon', n.oid, 'usage')\")
    expect(assertions).toContain(\"has_schema_privilege('authenticated', n.oid, 'usage')\")
"""
if test_text.count(old_test) != 1:
    raise SystemExit('expected one pg_net routine static assertion pair')
test_path.write_text(test_text.replace(old_test, new_test), encoding='utf-8')

doc_text = doc_path.read_text(encoding='utf-8')
old_doc = "- `pg_net` remains vendor-managed; direct `net` schema usage and routine execution are removed from `public`, `anon`, and `authenticated` when the schema exists, while `service_role` retains explicit schema usage and routine execution."
new_doc = "- `pg_net` remains vendor-managed. Browser roles lose `net` schema usage, so extension-owned routines are not directly callable even when their vendor-managed function ACLs remain unchanged; `service_role` retains schema usage."
if doc_text.count(old_doc) != 1:
    raise SystemExit('expected one pg_net control statement')
doc_path.write_text(doc_text.replace(old_doc, new_doc), encoding='utf-8')
