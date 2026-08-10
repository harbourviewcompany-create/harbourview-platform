import assert from 'node:assert/strict'
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
  assert.equal(result.repositoryOnlyFiles, 86)
  assert.equal(result.repositoryOnlyVersions, 86)
  assert.equal(result.liveOnlyVersions, 54)
  assert.equal(result.activationStatus, 'HOLD')
})

test('auth-hardening migration remains separately authorized and content-bound', () => {
  const record = decision.repository_only_decisions.find(
    (entry) => entry.version === '20260810222500',
  )
  assert.ok(record)
  assert.equal(record.file, '20260810222500_harden_edge_function_cron_auth.sql')
  assert.equal(record.git_blob_sha, 'c7174bb141a07431b020ef0c0c57a702ae44bb5a')
  assert.equal(record.classification, 'separately_authorized')
  assert.equal(record.reason_code, 'independent_release_not_authorized')
})

test('rejects an altered Elite Digest allowlist binding', () => {
  const mutated = clone(decision)
  mutated.elite_digest_allowlist_unchanged[0].git_blob_sha = '0'.repeat(40)
  const errors = validateDecisionData({ decision: mutated, releaseControl, migrationDirectory })
  assert.ok(errors.some((error) => error.includes('allowlist differs')))
})

test('rejects removal of an exact pending-migration decision', () => {
  const mutated = clone(decision)
  mutated.repository_only_decisions = mutated.repository_only_decisions.filter(
    (record) => record.version !== '20260731120000',
  )
  const errors = validateDecisionData({ decision: mutated, releaseControl, migrationDirectory })
  assert.ok(errors.some((error) => error.includes('repository-only file count mismatch')))
  assert.ok(errors.some((error) => error.includes('expected exactly one decision for 20260731120000')))
})

test('rejects treating a separately controlled migration as Elite Digest-approved', () => {
  const mutated = clone(decision)
  const record = mutated.repository_only_decisions.find(
    (entry) => entry.version === '20260802080000',
  )
  record.classification = 'approved'
  const errors = validateDecisionData({ decision: mutated, releaseControl, migrationDirectory })
  assert.ok(errors.some((error) => error.includes('approved decision records')))
  assert.ok(errors.some((error) => error.includes('20260802080000 must remain classified')))
})
