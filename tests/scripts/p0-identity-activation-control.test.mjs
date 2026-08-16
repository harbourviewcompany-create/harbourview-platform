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
    '20260814143000',
    '20260814180000',
    '20260815190715',
  ])
  assert.deepEqual(control.expected_preflight_snapshot, {
    prefs_rows: 7,
    membership_rows: 1,
    workspace_rows: 2,
    users_with_exactly_one_eligible_membership: 1,
    prefs_rows_that_backfill: 1,
    users_with_multiple_eligible_memberships: 0,
    active_memberships_in_nonactive_workspaces: 0,
    orphan_memberships: 0,
    membership_users_missing_auth: 0,
    pref_users_missing_auth: 0,
  })
})
