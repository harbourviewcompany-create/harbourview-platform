import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  filterAttestedHistoricalRows,
  loadHistoricalAttestations,
} from '../../scripts/filter-attested-historical-migrations.mjs'

function tempManifest(payload) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hv-historical-migrations-'))
  const file = path.join(dir, 'attestations.json')
  fs.writeFileSync(file, JSON.stringify(payload))
  return file
}

const validEntry = {
  version: '20260727213922',
  name: 'historical_one',
  statement_sha256: 'a'.repeat(64),
}

test('filters only an exact attested remote-only migration row', () => {
  const control = { version: 1, migrations: [validEntry] }
  const raw = [
    '   Local          | Remote         | Time (UTC)',
    '------------------|----------------|---------------------',
    '                  | 20260727213922 |',
    '20260801000000    | 20260801000000 |',
    '',
  ].join('\n')

  const result = filterAttestedHistoricalRows(raw, control)
  assert.deepEqual(result.removed, ['20260727213922'])
  assert.doesNotMatch(result.text, /20260727213922/)
  assert.match(result.text, /20260801000000/)
})

test('fails closed when an attested version is no longer a remote-only row', () => {
  const control = { version: 1, migrations: [validEntry] }
  const raw = [
    '   Local          | Remote         | Time (UTC)',
    '20260727213922    | 20260727213922 |',
  ].join('\n')

  assert.throws(
    () => filterAttestedHistoricalRows(raw, control),
    /not present as remote-only rows/,
  )
})

test('rejects duplicate, unsorted and malformed attestation entries', () => {
  assert.throws(
    () => loadHistoricalAttestations(tempManifest({ version: 1, migrations: [validEntry, validEntry] })),
    /Duplicate historical migration version|strictly ascending/,
  )

  assert.throws(
    () => loadHistoricalAttestations(tempManifest({
      version: 1,
      migrations: [{ ...validEntry, statement_sha256: 'not-a-sha' }],
    })),
    /statement_sha256 is invalid/,
  )
})

test('repository attestation manifest is valid and complete for the captured cohort', () => {
  const file = path.resolve('supabase/release-controls/historical-remote-migration-attestations.json')
  const control = loadHistoricalAttestations(file)
  assert.equal(control.project_ref, 'zvxdgdkukjrrwamdpqrg')

  // Was 52 -- the whole 2026-08-12 capture. 50 of those have since been
  // committed to supabase/migrations and their attestations retired. Two remain
  // and must stay uncommitted: 20260731090302 embeds live Adzuna API credentials
  // as vault.create_secret() literals, and 20260730112526 embeds a personal
  // email address. This is a public repository.
  assert.equal(control.migrations.length, 2)
})

/**
 * The invariant behind that count, asserted directly.
 *
 * An attestation exempts a version from the drift gate, so an attested version
 * that is ALSO committed is a contradiction: the exemption is dead weight and
 * filter-attested-historical-migrations.mjs raises HOLD on it. More importantly,
 * the two versions still attested are attested precisely because their SQL must
 * not be published -- so a commit of one of them is a secret leak, not a
 * bookkeeping slip. Checking the count alone would not catch that; checking this
 * does.
 */
test('no attested migration is also committed to the repository', () => {
  const file = path.resolve('supabase/release-controls/historical-remote-migration-attestations.json')
  const control = loadHistoricalAttestations(file)
  const committed = new Set(
    fs.readdirSync(path.resolve('supabase/migrations'))
      .filter(name => name.endsWith('.sql'))
      .map(name => name.slice(0, 14)),
  )

  const contradictions = control.migrations
    .map(entry => entry.version)
    .filter(version => committed.has(version))

  assert.deepEqual(
    contradictions,
    [],
    `attested versions must not exist in supabase/migrations: ${contradictions.join(', ')}`,
  )
})
