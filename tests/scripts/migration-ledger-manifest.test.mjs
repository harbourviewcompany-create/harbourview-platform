import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  buildManifest,
  loadCommittedNotAppliedBaseline,
  loadLiveVersionEquivalences,
  loadReleaseControl,
  parseSupabaseMigrationList,
  selectNewCommittedNotApplied,
} from '../../scripts/migration-ledger-manifest.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// Existing test body retained from main; the production regression suite exercises
// the parser, baseline gate, equivalence manifest and workflow guards. The final
// repository-level baseline check below is the only special-case control: eight
// historical baseline entries have no surviving SQL body and are explicitly listed
// in withdrawn-baseline-migrations.json. Unexpected missing files still fail closed.

test('parseSupabaseMigrationList parses both ASCII and box-drawing Supabase CLI tables', () => {
  const ascii = parseSupabaseMigrationList('LOCAL | REMOTE\n20260101000000 | 20260101000000\n20260102000000 |')
  assert.deepEqual(ascii.remoteVersions, ['20260101000000'])
  const box = parseSupabaseMigrationList('  LOCAL │ REMOTE\n  20260101000000 │ 20260101000000\n')
  assert.deepEqual(box.remoteVersions, ['20260101000000'])
})

test('loadCommittedNotAppliedBaseline rejects malformed inputs', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hv-baseline-'))
  const notJson = path.join(dir, 'bad.json')
  fs.writeFileSync(notJson, '{ not json')
  assert.throws(() => loadCommittedNotAppliedBaseline(notJson), /not valid JSON/i)
  const noVersions = path.join(dir, 'no-versions.json')
  fs.writeFileSync(noVersions, JSON.stringify({ version: 1 }))
  assert.throws(() => loadCommittedNotAppliedBaseline(noVersions), /"versions" array/i)
  const badVersion = path.join(dir, 'bad-version.json')
  fs.writeFileSync(badVersion, JSON.stringify({ versions: ['2026'] }))
  assert.throws(() => loadCommittedNotAppliedBaseline(badVersion), /invalid version/i)
})

test('the shipped committed-not-applied baseline is well formed and loadable', () => {
  const baselinePath = path.join(repoRoot, 'supabase/release-controls/committed-not-applied-baseline.json')
  const withdrawnPath = path.join(repoRoot, 'supabase/release-controls/withdrawn-baseline-migrations.json')
  const baseline = loadCommittedNotAppliedBaseline(baselinePath)
  assert.ok(baseline.versions.size > 0)
  const raw = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
  const withdrawn = JSON.parse(fs.readFileSync(withdrawnPath, 'utf8'))
  const withdrawnVersions = withdrawn.versions.map((entry) => entry.version)
  assert.equal(raw.counts.baselined, baseline.versions.size)
  assert.equal(new Set(raw.versions).size, raw.versions.length, 'baseline must not contain duplicates')
  assert.deepEqual([...new Set(withdrawnVersions)].sort(), withdrawnVersions.slice().sort(), 'withdrawn control must not contain duplicates')

  const migrationVersions = new Set(
    fs.readdirSync(path.join(repoRoot, 'supabase/migrations'))
      .filter((file) => file.endsWith('.sql'))
      .map((file) => file.slice(0, 14)),
  )
  const phantom = raw.versions.filter((version) => !migrationVersions.has(version) && !withdrawnVersions.includes(version))
  assert.deepEqual(phantom, [], `baselined versions with no migration file and no explicit withdrawal: ${phantom.join(', ')}`)
  const withdrawnMissing = withdrawnVersions.filter((version) => migrationVersions.has(version))
  assert.deepEqual(withdrawnMissing, [], `withdrawn versions unexpectedly have a repository migration body: ${withdrawnMissing.join(', ')}`)
})

test('selectNewCommittedNotApplied filters only the known baseline', () => {
  const baseline = { versions: new Set(['20260101000000']) }
  assert.deepEqual(selectNewCommittedNotApplied(['20260101000000', '20260102000000'], baseline), ['20260102000000'])
})

test('release control files remain parseable', () => {
  const control = loadReleaseControl(path.join(repoRoot, 'supabase/release-controls/pending-production-migration-integrity.json'))
  assert.ok(control.approved_migrations.length > 0)
  const equivalences = loadLiveVersionEquivalences(path.join(repoRoot, 'supabase/release-controls/migration-live-version-equivalences.json'))
  assert.equal(equivalences.version, 1)
})
