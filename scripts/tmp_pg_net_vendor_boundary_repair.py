from pathlib import Path

migration_path = Path('supabase/migrations/20260804190000_production_security_hardening.sql')
assertion_path = Path('supabase/tests/production_security_hardening.sql')
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
new_net_note = """-- pg_net is extension-owned and vendor-managed. This migration does not attempt
-- to rewrite its schema or routine ACLs. The custom-routine hardening below
-- still covers any non-extension-owned routine introduced into schema net.

"""
if migration.count(old_net_block) != 1:
    raise SystemExit('expected one ineffective pg_net schema ACL block')
migration_path.write_text(migration.replace(old_net_block, new_net_note), encoding='utf-8')

assertions = assertion_path.read_text(encoding='utf-8')
anon_anchor = """  and n.nspname in ('public','api','signals','regulatory_signals','net')
  and has_schema_privilege('anon', n.oid, 'usage')
"""
anon_replacement = """  and n.nspname in ('public','api','signals','regulatory_signals','net')
  and not exists (
    select 1 from pg_depend d
    where d.classid = 'pg_proc'::regclass
      and d.objid = p.oid
      and d.deptype = 'e'
  )
  and has_schema_privilege('anon', n.oid, 'usage')
"""
auth_anchor = """  and n.nspname in ('public','api','signals','regulatory_signals','net')
  and has_schema_privilege('authenticated', n.oid, 'usage')
"""
auth_replacement = """  and n.nspname in ('public','api','signals','regulatory_signals','net')
  and not exists (
    select 1 from pg_depend d
    where d.classid = 'pg_proc'::regclass
      and d.objid = p.oid
      and d.deptype = 'e'
  )
  and has_schema_privilege('authenticated', n.oid, 'usage')
"""
if assertions.count(anon_anchor) != 1 or assertions.count(auth_anchor) != 1:
    raise SystemExit('expected one anon and authenticated SECURITY DEFINER assertion')
assertion_path.write_text(
    assertions.replace(anon_anchor, anon_replacement).replace(auth_anchor, auth_replacement),
    encoding='utf-8',
)

test_text = test_path.read_text(encoding='utf-8')
old_test = """  it('contains foreign tables and guards optional pg_net access', () => {
    expect(migration).toContain('information_schema.foreign_tables')
    expect(migration).toContain("if exists (select 1 from pg_namespace where nspname = 'net') then")
    expect(migration).toContain("execute 'revoke usage on schema net from public, anon, authenticated'")
    expect(assertions).toContain("has_schema_privilege('anon', n.oid, 'usage')")
    expect(assertions).toContain("has_schema_privilege('authenticated', n.oid, 'usage')")
  })
"""
new_test = """  it('contains foreign tables and records the extension-owned pg_net boundary', () => {
    expect(migration).toContain('information_schema.foreign_tables')
    expect(migration).toContain('pg_net is extension-owned and vendor-managed')
    expect(migration).not.toContain('revoke usage on schema net')
    expect(assertions).toContain("has_schema_privilege('anon', n.oid, 'usage')")
    expect(assertions).toContain("has_schema_privilege('authenticated', n.oid, 'usage')")
    expect((assertions.match(/and d\\.deptype = 'e'/g) ?? []).length).toBeGreaterThanOrEqual(2)
  })
"""
if test_text.count(old_test) != 1:
    raise SystemExit('expected one pg_net static test block')
test_path.write_text(test_text.replace(old_test, new_test), encoding='utf-8')

doc_text = doc_path.read_text(encoding='utf-8')
old_bullet = "- `pg_net` remains vendor-managed. Browser roles lose `net` schema usage, so extension-owned routines are not directly callable even when their vendor-managed function ACLs remain unchanged; `service_role` retains schema usage."
new_bullet = "- `pg_net` remains vendor-managed. This migration does not attempt to rewrite extension-owned `net` schema or routine ACLs. State assertions exclude only routines proven extension-owned through `pg_depend`, while any exposed non-extension-owned SECURITY DEFINER routine in `net` remains a failure; Harbourview browser code must not invoke `net` directly."
if doc_text.count(old_bullet) != 1:
    raise SystemExit('expected one pg_net control bullet')
doc_text = doc_text.replace(old_bullet, new_bullet)
old_boundary = "The `Production Security Hardening` workflow applies the exact candidate migration to an isolated local Supabase fixture representing public, preserved-contract, internal, policyless-RLS, and SECURITY DEFINER boundaries. It then runs `supabase/tests/production_security_hardening.sql` as a zero-row state assertion."
new_boundary = old_boundary + " The sole encoded vendor exception is an extension-owned routine proven by a `pg_depend` extension-membership record; schema-name matching alone does not create an exception."
if doc_text.count(old_boundary) != 1:
    raise SystemExit('expected one verification-boundary paragraph')
doc_text = doc_text.replace(old_boundary, new_boundary)
old_evidence = "2. `supabase/tests/production_security_hardening.sql` returns zero rows. No accepted exceptions are implicit."
new_evidence = "2. `supabase/tests/production_security_hardening.sql` returns zero rows after the explicit extension-owned `pg_net` exception encoded by `pg_depend`; no other accepted exception is implicit."
if doc_text.count(old_evidence) != 1:
    raise SystemExit('expected one zero-row evidence requirement')
doc_path.write_text(doc_text.replace(old_evidence, new_evidence), encoding='utf-8')
