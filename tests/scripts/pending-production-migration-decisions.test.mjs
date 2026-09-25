import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import {
  runValidation,
  validateDecisionData,
} from '../../scripts/check-pending-production-migration-decisions.mjs'

const repositoryRoot = process.cwd()
const decision = JSON.parse(
  fs.readFileSync(
    path.join(repositoryRoot, 'supabase/release-controls/pending-production-migration-decisions.json'),
    'utf8',
  ),
)
const releaseControl = JSON.parse(
  fs.readFileSync(
    path.join(repositoryRoot, 'supabase/release-controls/elite-digest-production-activation.json'),
    'utf8',
  ),
)
const migrationDirectory = path.join(repositoryRoot, 'supabase/migrations')

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

test('current pending migration decision record is internally exact and remains HOLD', () => {
  const result = runValidation({ repositoryRoot })
  assert.equal(result.repositoryOnlyFiles, 82)
  assert.equal(result.repositoryOnlyVersions, 82)
  assert.equal(result.liveOnlyVersions, 54)
  assert.equal(result.activationStatus, 'HOLD')
})

test('retired auth-hardening migration is represented by explicit identity reconciliation', () => {
  assert.equal(decision.repository_only_decisions.some((entry) => entry.version === '20260810222500'), false)
  const identity = JSON.parse(
    fs.readFileSync(
      path.join(repositoryRoot, 'supabase/release-controls/migration-identity-reconciliation-20260916.json'),
      'utf8',
    ),
  )
  assert.deepEqual(
    identity.replacements.find((entry) => entry.retired_version === '20260810222500'),
    {
      retired_version: '20260810222500',
      canonical_version: '20260912103836',
    },
  )
})
test('rejects an altered Elite Digest allowlist binding', () => {
  const mutated = clone(decision)
  mutated.elite_digest_allowlist_unchanged[0].git_blob_sha = '0'.repeat(40)
  const errors = validateDecisionData({ decision: mutated, releaseControl, migrationDirectory })
  assert.ok(errors.some((error) => error.includes('allowlist differs')))
})

test('accepts retired migration identities through explicit reconciliation', () => {
  const retired = ['20260731120000', '20260801150000', '20260802080000']
  for (const version of retired) {
    assert.equal(decision.repository_only_decisions.some((record) => record.version === version), false)
  }
  const errors = validateDecisionData({ decision, releaseControl, migrationDirectory })
  assert.equal(errors.some((error) => error.includes('retired version')), false)
})

test('rejects treating a separately controlled migration as Elite Digest-approved', () => {
  const mutated = clone(decision)
  const record = mutated.repository_only_decisions.find(
    (entry) => entry.version === '20260727160000',
  )
  record.classification = 'approved'
  const errors = validateDecisionData({ decision: mutated, releaseControl, migrationDirectory })
  assert.ok(errors.some((error) => error.includes('approved decision records')))
  assert.ok(errors.some((error) => error.includes('approved decision records')))
})
