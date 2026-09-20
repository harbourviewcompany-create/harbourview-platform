import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseArgs,
  renderReconciledMigration,
  suggestFileName,
  selectVersionsToReconcile,
} from '../../scripts/auto-reconcile-migration-drift.mjs'

test('parseArgs requires remote-list and control-file', () => {
  assert.throws(() => parseArgs([]), /remote-list/)
  assert.throws(
    () => parseArgs(['--remote-list', 'x.txt', '--dry-run']),
    /control-file/,
  )
})

test('renderReconciledMigration copies statements verbatim with header', () => {
  const sql = renderReconciledMigration('20260919160000', [
    'alter table public.t add column if not exists c text',
    'select 1',
  ])
  assert.match(sql, /Version: 20260919160000/)
  assert.match(sql, /alter table public\.t add column if not exists c text;/)
  assert.match(sql, /select 1;/)
  assert.match(sql, /Do not invent SQL/)
})

test('suggestFileName embeds version and slug', () => {
  const name = suggestFileName('20260919160000', ['CREATE TABLE foo (id int)'])
  assert.equal(name.startsWith('20260919160000_'), true)
  assert.equal(name.endsWith('.sql'), true)
  assert.match(name, /create_table_foo/)
})

test('selectVersionsToReconcile returns sorted applied_not_committed', () => {
  const versions = selectVersionsToReconcile({
    applied_not_committed: ['20260902000002', '20260902000001'],
  })
  assert.deepEqual(versions, ['20260902000001', '20260902000002'])
})
