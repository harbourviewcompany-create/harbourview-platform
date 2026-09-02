import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildIssue,
  filterNewVersions,
  versionsNotYetFlagged,
} from '../../scripts/notify-new-migration-drift.mjs'

test('filterNewVersions keeps only versions strictly after the baseline, sorted', () => {
  const result = filterNewVersions(
    ['20260830150000', '20260830100000', '20260830141000', '20260830200000'],
    '20260830141000',
  )
  // 20260830141000 itself is excluded -- "strictly greater," matching the
  // reconciliation doc's own framing (the baseline IS reconciled).
  assert.deepEqual(result, ['20260830150000', '20260830200000'])
})

test('filterNewVersions returns empty when nothing is newer than the baseline', () => {
  const result = filterNewVersions(['20260830100000', '20260830140000'], '20260830141000')
  assert.deepEqual(result, [])
})

test('filterNewVersions rejects a malformed baseline version', () => {
  assert.throws(() => filterNewVersions(['20260830150000'], 'not-a-version'), /Invalid baseline version/)
})

test('filterNewVersions rejects a malformed applied_not_committed entry', () => {
  assert.throws(
    () => filterNewVersions(['20260830150000', 'bogus'], '20260830141000'),
    /Invalid applied_not_committed version/,
  )
})

test('versionsNotYetFlagged excludes versions already present in an open issue title', () => {
  const openIssues = [
    { title: 'Migration drift: 1 new unattributed live version (20260830150000)', body: 'details' },
  ]
  const result = versionsNotYetFlagged(['20260830150000', '20260830160000'], openIssues)
  assert.deepEqual(result, ['20260830160000'])
})

test('versionsNotYetFlagged excludes versions already present in an open issue body only', () => {
  const openIssues = [{ title: 'Migration drift roundup', body: 'Includes 20260830150000 among others.' }]
  const result = versionsNotYetFlagged(['20260830150000', '20260830160000'], openIssues)
  assert.deepEqual(result, ['20260830160000'])
})

test('versionsNotYetFlagged returns everything when there are no open issues', () => {
  const result = versionsNotYetFlagged(['20260830150000'], [])
  assert.deepEqual(result, ['20260830150000'])
})

test('versionsNotYetFlagged returns nothing when every version is already covered', () => {
  const openIssues = [
    { title: 'Migration drift: 2 new unattributed live versions (20260830150000..20260830160000)', body: '' },
  ]
  const result = versionsNotYetFlagged(['20260830150000', '20260830160000'], openIssues)
  assert.deepEqual(result, [])
})

test('buildIssue produces a singular title for one version', () => {
  const { title } = buildIssue(['20260830150000'], 'abc1234')
  assert.equal(title, 'Migration drift: 1 new unattributed live version (20260830150000)')
})

test('buildIssue produces a range title for multiple versions', () => {
  const { title } = buildIssue(['20260830150000', '20260830160000', '20260830170000'], 'abc1234')
  assert.equal(
    title,
    'Migration drift: 3 new unattributed live versions (20260830150000..20260830170000)',
  )
})

test('buildIssue body includes every version, the source SHA, and a runnable lookup query', () => {
  const { body } = buildIssue(['20260830150000', '20260830160000'], 'abc1234')
  assert.match(body, /abc1234/)
  assert.match(body, /- `20260830150000`/)
  assert.match(body, /- `20260830160000`/)
  assert.match(body, /select version, name from supabase_migrations\.schema_migrations/)
  assert.match(body, /'20260830150000', '20260830160000'/)
})

test('buildIssue body references the reconciliation disposition rules, not a self-fix', () => {
  const { body } = buildIssue(['20260830150000'], 'abc1234')
  assert.match(body, /MIGRATION_DRIFT_RECONCILIATION_20260810\.md/)
  assert.match(body, /migration-live-version-equivalences\.json/)
  assert.match(body, /historical-remote-migration-attestations\.json/)
  assert.match(body, /never a fabricated one/)
})
