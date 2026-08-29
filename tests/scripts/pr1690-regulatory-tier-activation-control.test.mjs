import test from 'node:test'
import assert from 'node:assert/strict'
import { loadControl, verifyBoundMigrations, buildActivationSql } from '../../scripts/pr1690-regulatory-tier-activation-control.mjs'

const controlPath='supabase/release-controls/pr1690-regulatory-tier-activation.json'

test('PR1690 control binds exactly three immutable migrations in order', () => {
  const control=loadControl(controlPath)
  assert.equal(control.migrations.length,3)
  assert.deepEqual(control.migrations.map(m=>m.version),['20260829120000','20260829130000','20260829160000'])
  assert.deepEqual(verifyBoundMigrations(control),[
    '8a791744e923596ddc9cd6b1d9848bcb60dc7081',
    'cd9c7b9b96bcbb52a0dd551684de488afa18feda',
    '6d8e29d67b3f9458e9926d1525bfc5dd3fe7c9dc',
  ])
})

test('generator emits three ordered atomic migration plus ledger transactions', () => {
  const control=loadControl(controlPath)
  const sql=buildActivationSql(control)
  assert.equal((sql.match(/^BEGIN;$/gm)??[]).length,3)
  assert.equal((sql.match(/^COMMIT;$/gm)??[]).length,3)
  const positions=control.migrations.map(m=>sql.indexOf(`-- Exact bound migration ${m.version}`))
  assert.ok(positions[0] < positions[1] && positions[1] < positions[2])
  for (const m of control.migrations) {
    assert.ok(sql.includes(`gitblob:${m.git_blob_sha}`))
    assert.ok(sql.includes(`'${m.version}'`))
  }
  assert.doesNotMatch(sql,/supabase\s+db\s+push|--include-all/i)
})
