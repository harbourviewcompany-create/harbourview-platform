import assert from 'node:assert/strict'
import test from 'node:test'

import {
  auditSkipMaskedNarrowing,
  extractSurfaces,
  findViewNarrowing,
  outputColumnName,
  parseCreateView,
  planReplaySources,
} from '../../scripts/check-view-replay-narrowing.mjs'

const src = (name, sql) => ({ name, origin: name, sql })

test('the shipped migration tree replays without a view narrowing', () => {
  const sources = planReplaySources()
  const { findings } = findViewNarrowing(sources)
  assert.deepEqual(findings, [])
})

test('no narrowing is hidden behind REPLAY_ZERO_STATE_SKIPS', () => {
  // This is the assertion that would have caught the api.signals defect. On
  // 2026-09-13 20260715085610 narrowed api.signals from 32 columns to 29 and was
  // listed in REPLAY_ZERO_STATE_SKIPS, so the replay -- and any check that only
  // models the replay -- went green while the migration was broken.
  assert.deepEqual(auditSkipMaskedNarrowing(), [])
})

test('flags a replace that drops a column', () => {
  const { findings } = findViewNarrowing([
    src('0001_a.sql', 'create or replace view api.v as select a, b, c from public.t;'),
    src('0002_b.sql', 'create or replace view api.v as select a, b from public.t;'),
  ])
  assert.equal(findings.length, 1)
  assert.equal(findings[0].view, 'api.v')
  assert.equal(findings[0].file, '0002_b.sql')
  assert.equal(findings[0].previousFile, '0001_a.sql')
  assert.match(findings[0].detail, /drops "c" at position 2/)
  assert.deepEqual(findings[0].dropped, ['c'])
})

test('flags a replace that reorders columns', () => {
  const { findings } = findViewNarrowing([
    src('0001_a.sql', 'create or replace view api.v as select a, b from public.t;'),
    src('0002_b.sql', 'create or replace view api.v as select b, a from public.t;'),
  ])
  assert.equal(findings.length, 1)
  assert.match(findings[0].detail, /position 0: "a" -> "b"/)
})

test('accepts a pure prefix extension', () => {
  const { findings } = findViewNarrowing([
    src('0001_a.sql', 'create or replace view api.v as select a, b from public.t;'),
    src('0002_b.sql', 'create or replace view api.v as select a, b, c, d from public.t;'),
  ])
  assert.deepEqual(findings, [])
})

test('a DROP before the create makes a full redefinition legal', () => {
  const { findings } = findViewNarrowing([
    src('0001_a.sql', 'create or replace view api.v as select a, b, c from public.t;'),
    src('0002_b.sql', 'drop view if exists api.v;\ncreate view api.v as select c, a from public.t;'),
  ])
  assert.deepEqual(findings, [])
})

test('resolves SELECT * from a view already seen, and checks the later explicit list', () => {
  // This is the api.signals_quality / api.marketplace_public_listings_v1 shape:
  // a `select *` proxy created over a view, then replaced with an explicit list.
  const ok = findViewNarrowing([
    src('0001_a.sql', 'create view public.base as select id, name from public.t;'),
    src('0002_b.sql', 'create or replace view api.base as select * from public.base;'),
    src('0003_c.sql', 'create or replace view api.base as select id, name, extra from public.base;'),
  ])
  assert.deepEqual(ok.findings, [])

  const bad = findViewNarrowing([
    src('0001_a.sql', 'create view public.base as select id, name from public.t;'),
    src('0002_b.sql', 'create or replace view api.base as select * from public.base;'),
    src('0003_c.sql', 'create or replace view api.base as select id from public.base;'),
  ])
  assert.equal(bad.findings.length, 1)
  assert.match(bad.findings[0].detail, /drops "name" at position 1/)
})

test('SELECT * from an untracked base is not compared rather than guessed', () => {
  const { findings } = findViewNarrowing([
    src('0001_a.sql', 'create or replace view api.v as select * from public.unknown_table;'),
    src('0002_b.sql', 'create or replace view api.v as select a from public.unknown_table;'),
  ])
  assert.deepEqual(findings, [])
})

test('reads view DDL inside dollar-quoted DO blocks', () => {
  // 20260704160603 creates public.signals_quality this way.
  const sql = `do $restore$
begin
  if not exists (select 1 from information_schema.views where table_name = 'v') then
    execute $view$
      create view public.v as select a, b, c from public.t
    $view$;
  end if;
end
$restore$;`
  const { findings } = findViewNarrowing([
    src('0001_a.sql', sql),
    src('0002_b.sql', 'create or replace view public.v as select a, b from public.t;'),
  ])
  assert.equal(findings.length, 1)
  assert.match(findings[0].detail, /drops "c" at position 2/)
})

test('handles quoted identifiers containing a dot', () => {
  // api."regulatory_signals.signals" is a real view in this repository.
  const parsed = parseCreateView('create or replace view api."regulatory_signals.signals" as select a, b from x')
  assert.equal(parsed.name, 'api.regulatory_signals.signals')
  assert.deepEqual(parsed.columns, ['a', 'b'])
  assert.equal(parsed.replace, true)
})

test('honours WITH options and column aliases', () => {
  const parsed = parseCreateView(
    'create or replace view api.v with (security_invoker = on) as ' +
    "select id, coalesce(a, b) as label, t.count::int as n, other from public.t",
  )
  assert.deepEqual(parsed.columns, ['id', 'label', 'n', 'other'])
})

test('an explicit alias list is used when present', () => {
  const parsed = parseCreateView('create view api.v (one, two) as select a, b from t')
  assert.deepEqual(parsed.columns, ['one', 'two'])
})

test('outputColumnName resolves the common select-item shapes', () => {
  assert.equal(outputColumnName(' t.created_at '), 'created_at')
  assert.equal(outputColumnName('count(*) as total'), 'total')
  assert.equal(outputColumnName('value::text'), 'value')
  assert.equal(outputColumnName('*'), '*')
  assert.equal(outputColumnName('t.*'), '*')
})

test('extractSurfaces strips comments but keeps dollar-quoted bodies as scannable text', () => {
  const surfaces = extractSurfaces("-- create or replace view api.decoy as select 1;\nselect 1; $f$ create view api.real as select a from t $f$;")
  assert.equal(surfaces.some((s) => /api\.decoy/.test(s)), false)
  assert.equal(surfaces.some((s) => /api\.real/.test(s)), true)
})

test('a comment mentioning a narrowing does not trigger a finding', () => {
  const { findings } = findViewNarrowing([
    src('0001_a.sql', 'create or replace view api.v as select a, b from public.t;'),
    src('0002_b.sql', '-- create or replace view api.v as select a from public.t;\nselect 1;'),
  ])
  assert.deepEqual(findings, [])
})
