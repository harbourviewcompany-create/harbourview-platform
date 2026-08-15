import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import {
  ageInDays,
  findUnappliedApproved,
} from '../../scripts/check-approved-migrations-applied.mjs'

test('an approved migration that is not applied is reported', () => {
  const decision = {
    repository_only_decisions: [
      { version: '20260802152500', file: 'b.sql', classification: 'approved' },
    ],
  }
  assert.deepEqual(
    findUnappliedApproved(decision, ['20260801000000']).map((r) => r.version),
    ['20260802152500'],
  )
})

test('only the approved classification trips the gate', () => {
  const decision = {
    repository_only_decisions: [
      { version: '20260101000000', file: 'a.sql', classification: 'requiring_forward_reconciliation' },
      { version: '20260101000001', file: 'b.sql', classification: 'obsolete' },
      { version: '20260101000002', file: 'c.sql', classification: 'separately_authorized' },
      { version: '20260101000003', file: 'd.sql', classification: 'approved' },
    ],
  }
  assert.deepEqual(
    findUnappliedApproved(decision, []).map((r) => r.version),
    ['20260101000003'],
  )
})

/**
 * The ledger records `live_equivalent_versions` for migrations that reached
 * production under a different apply-time version. Ignoring that field would
 * make this gate permanently red with no way for anyone to clear it, which is
 * the failure mode the script's own header argues against.
 */
test('a recorded live equivalent counts as applied', () => {
  const decision = {
    repository_only_decisions: [
      {
        version: '20260802073000',
        file: 'a.sql',
        classification: 'approved',
        live_equivalent_versions: ['20260730104633'],
      },
    ],
  }
  assert.deepEqual(findUnappliedApproved(decision, ['20260730104633']), [])
})

test('a decision file with no records passes instead of throwing', () => {
  assert.deepEqual(findUnappliedApproved({}, []), [])
  assert.deepEqual(findUnappliedApproved({ repository_only_decisions: [] }, []), [])
})

test('age is computed in whole days and rejects malformed versions', () => {
  assert.equal(ageInDays('20260802073000', new Date(Date.UTC(2026, 7, 14, 7, 30, 0))), 12)
  assert.equal(ageInDays('20260802073000', new Date(Date.UTC(2026, 7, 2, 7, 30, 0))), 0)
  assert.equal(ageInDays('nope'), null)
})

/**
 * The gate is only meaningful if it reads the classification the repository
 * actually uses. If `repository_only_decisions` is ever renamed or the
 * `approved` literal changes, every test above still passes while the real
 * check silently reports zero. This reads the committed ledger to catch that.
 */
test('the committed ledger still uses the shape this check depends on', () => {
  const file = path.resolve('supabase/release-controls/pending-production-migration-decisions.json')
  const decision = JSON.parse(fs.readFileSync(file, 'utf8'))

  assert.ok(
    Array.isArray(decision.repository_only_decisions),
    'repository_only_decisions must exist as an array',
  )
  const classifications = new Set(decision.repository_only_decisions.map((r) => r.classification))
  assert.ok(
    classifications.has('approved'),
    `the ledger no longer contains any "approved" record; classifications present: ${[...classifications].join(', ')}`,
  )
})
