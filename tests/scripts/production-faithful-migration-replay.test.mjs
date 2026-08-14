import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { planReplayExclusions } from '../../scripts/prepare-production-faithful-migration-replay.mjs'

const root = process.cwd()
const decisions = JSON.parse(
  fs.readFileSync(path.join(root, 'supabase/release-controls/pending-production-migration-decisions.json'), 'utf8'),
)
const migrationFiles = fs.readdirSync(path.join(root, 'supabase/migrations')).filter((file) => file.endsWith('.sql'))

const exclusions = planReplayExclusions({ decisions, migrationFiles })
const excludedVersions = new Set(exclusions.map((item) => item.version))

test('replay excludes duplicate repository aliases only when the canonical live-version file is also present', () => {
  assert.equal(excludedVersions.has('20260728000000'), true)
  assert.equal(excludedVersions.has('20260728010000'), true)

  const createAlias = exclusions.find((item) => item.version === '20260728000000')
  const renameAlias = exclusions.find((item) => item.version === '20260728010000')
  assert.deepEqual(createAlias.repository_equivalent_versions, ['20260728191340'])
  assert.deepEqual(renameAlias.repository_equivalent_versions, ['20260728192052'])
})

test('replay retains a repository-only stand-in when its live equivalent has no migration file', () => {
  assert.equal(excludedVersions.has('20260728020000'), false)
  assert.equal(migrationFiles.some((file) => file.startsWith('20260729021820_')), false)
})

test('every exclusion is backed by exact-live-name-different-version control evidence', () => {
  const decisionsByVersion = new Map(
    (decisions.repository_only_decisions ?? []).map((decision) => [decision.version, decision]),
  )

  for (const exclusion of exclusions) {
    const decision = decisionsByVersion.get(exclusion.version)
    assert.equal(decision.reason_code, 'exact_live_name_different_version')
    assert.ok(exclusion.repository_equivalent_versions.length > 0)
    for (const equivalentVersion of exclusion.repository_equivalent_versions) {
      assert.ok(migrationFiles.some((file) => file.startsWith(`${equivalentVersion}_`)))
    }
  }
})
