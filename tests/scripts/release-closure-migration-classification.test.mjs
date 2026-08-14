import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { validateReleaseClosureClassification } from '../../scripts/check-release-closure-migration-classification.mjs'

const root = process.cwd()
const classification = JSON.parse(
  fs.readFileSync(
    path.join(root, 'supabase/release-controls/release-closure-migration-classification-20260814.json'),
    'utf8',
  ),
)
const releaseControl = JSON.parse(
  fs.readFileSync(path.join(root, 'supabase/release-controls/elite-digest-production-activation.json'), 'utf8'),
)
const migrationDirectory = path.join(root, 'supabase/migrations')

test('August 14 release-closure classification is complete and content-bound', () => {
  const errors = validateReleaseClosureClassification({
    classification,
    releaseControl,
    migrationDirectory,
  })

  assert.deepEqual(errors, [])
  assert.equal(classification.baseline.repository_pending_versions, 88)
  assert.equal(classification.approved_pending.length, 3)
  assert.equal(classification.intentionally_deferred.length, 84)
  assert.equal(classification.superseded_retired.length, 1)
})

test('new security hardening migration stays outside the historical 88 and is not production-authorized', () => {
  const baselineVersions = new Set([
    ...classification.approved_pending.map((item) => item.version),
    ...classification.intentionally_deferred,
    ...classification.superseded_retired.map((item) => item.version),
  ])

  assert.equal(baselineVersions.size, 88)
  assert.equal(baselineVersions.has(classification.new_release_closure_candidate.version), false)
  assert.equal(classification.new_release_closure_candidate.production_authorized, false)
})
