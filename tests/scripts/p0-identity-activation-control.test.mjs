import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  buildActivationSql,
  gitBlobSha,
  loadControl,
  stripOuterTransaction,
  verifyBoundMigration,
} from '../../scripts/p0-identity-activation-control.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const controlPath = path.join(repoRoot, 'supabase/release-controls/p0-identity-org-context-activation.json')
const migrationPath = path.join(repoRoot, 'supabase/migrations/20260814122000_p0_identity_org_context.sql')

function controlForAbsoluteMigration(control) {
  return {
    ...control,
    migration: {
      ...control.migration,
      file: migrationPath,
    },
  }
}

test('release control binds the exact production project, migration version and Git blob', () => {
  const control = loadControl(controlPath)
  assert.equal(control.production_project_ref, 'zvxdgdkukjrrwamdpqrg')
  assert.equal(control.migration.version, '20260814122000')
  assert.equal(control.migration.name, 'p0_identity_org_context')
  assert.equal(control.migration.git_blob_sha, '99437d3dba7d73c14af45beadad7d7616e29e512')
  assert.equal(gitBlobSha(migrationPath), control.migration.git_blob_sha)
})

test('bound migration verifier rejects any alternate migration path', () => {
  const control = controlForAbsoluteMigration(loadControl(controlPath))
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'p0-activation-'))
  const other = path.join(temp, '20260814143000_unrelated.sql')
  fs.writeFileSync(other, 'begin; select 1; commit;\n')
  assert.throws(() => verifyBoundMigration(control, other), /refusing non-bound migration path/)
})

test('outer transaction stripper requires an explicit BEGIN and COMMIT', () => {
  assert.equal(stripOuterTransaction('begin;\nselect 1;\ncommit;'), 'select 1;')
  assert.throws(() => stripOuterTransaction('select 1; commit;'), /must begin with BEGIN/)
  assert.throws(() => stripOuterTransaction('begin; select 1;'), /must end with COMMIT/)
})

test('generated activation SQL contains only the bound migration body plus one ledger insert', () => {
  const control = loadControl(controlPath)
  const migration = fs.readFileSync(migrationPath, 'utf8')
  const activation = buildActivationSql(control, migration)

  assert.match(activation, /Exact bound migration: supabase\/migrations\/20260814122000_p0_identity_org_context\.sql/)
  assert.match(activation, /gitblob:99437d3dba7d73c14af45beadad7d7616e29e512/)
  assert.equal((activation.match(/INSERT INTO supabase_migrations\.schema_migrations/g) ?? []).length, 1)
  assert.equal((activation.match(/^BEGIN;$/gm) ?? []).length, 1)
  assert.equal((activation.match(/^COMMIT;$/gm) ?? []).length, 1)
  assert.doesNotMatch(activation, /supabase\s+db\s+push/i)
  assert.doesNotMatch(activation, /--include-all/i)
  assert.doesNotMatch(activation, /20260814143000|20260814180000|20260815190715/)
})

test('release control freezes the reviewed later-applied set and preflight row snapshot', () => {
  const control = loadControl(controlPath)
  assert.deepEqual(control.expected_later_applied_versions, [
    '20260814134500',
    '20260814135500',
    '20260814143000',
    '20260814143500',
    '20260814144000',
    '20260814150000',
    '20260814151000',
    '20260814180000',
    '20260815190715',
    '20260818120000',
    '20260818130000',
    '20260818133500',
    '20260818133600',
    '20260818133700',
    '20260818140000',
    '20260818150000',
    '20260818160000',
    '20260818192000',
    '20260818210936',
    '20260818212800',
    '20260818212900',
    '20260818213000',
    '20260818213100',
    '20260818213200',
    '20260818213300',
    '20260819100621',
    '20260819125403',
    '20260819150000',
    '20260819151000',
    '20260819152000',
    '20260819153000',
    '20260819170000',
    '20260819210000',
    '20260819232736',
    '20260820100000',
    '20260820100423',
    '20260820140000',
    '20260821120000',
    '20260821121000',
    '20260821190000',
    '20260821220328',
    '20260821220419',
    '20260821220431',
    '20260821220443',
    '20260822130009',
    '20260822173834',
    '20260822214001',
    '20260827185123',
    '20260827185517',
    '20260827234500',
    '20260828004330',
    '20260828111619',
  ])
  assert.deepEqual(control.expected_preflight_snapshot, {
    prefs_rows: 9,
    membership_rows: 3,
    workspace_rows: 4,
    users_with_exactly_one_eligible_membership: 0,
    prefs_rows_that_backfill: 0,
    users_with_multiple_eligible_memberships: 1,
    active_memberships_in_nonactive_workspaces: 0,
    orphan_memberships: 0,
    membership_users_missing_auth: 0,
    pref_users_missing_auth: 0,
  })
})
