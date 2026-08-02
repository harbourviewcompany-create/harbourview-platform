import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  buildManifest,
  parseSupabaseMigrationList,
  readRepositoryMigrations,
} from '../../scripts/migration-ledger-manifest.mjs'

const control = {
  version: 1,
  release: 'elite-digest-production-activation',
  approved_migrations: [
    {
      version: '20260802073000',
      file: '20260802073000_hv_dedup_assign_restore_hnsw_knn.sql',
    },
    {
      version: '20260802152500',
      file: '20260802152500_signal_feedback_api_rpcs.sql',
    },
    {
      version: '20260802163000',
      file: '20260802163000_elite_digest_rpc_boundary_hardening.sql',
    },
  ],
}

const asciiOutput = `
  Local          | Remote         | Time (UTC)
 ----------------|----------------|---------------------
  20260731130000 | 20260731130000 | 2026-07-31 13:00:00
  20260802073000 |                | 2026-08-02 07:30:00
  20260802152500 |                | 2026-08-02 15:25:00
  20260802163000 |                | 2026-08-02 16:30:00
`

const boxOutput = `
  LOCAL          │ REMOTE         │ TIME (UTC)
 ─────────────────┼────────────────┼───────────────────────
  20260731130000 │ 20260731130000 │ 2026-07-31 13:00:00
  20260802073000 │                │ 2026-08-02 07:30:00
  20260802152500 │                │ 2026-08-02 15:25:00
  20260802163000 │                │ 2026-08-02 16:30:00
`

function createMigrationDir(files) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-manifest-'))
  for (const file of files) fs.writeFileSync(path.join(directory, file), '-- fixture\n')
  return directory
}

test('parses both ASCII and box-drawing Supabase CLI tables', () => {
  const ascii = parseSupabaseMigrationList(asciiOutput)
  const box = parseSupabaseMigrationList(boxOutput)
  assert.deepEqual(ascii, box)
  assert.deepEqual(ascii.remoteVersions, ['20260731130000'])
  assert.equal(ascii.parsedRows, 4)
})

test('fails when a nonempty table produces zero parsed migration rows', () => {
  assert.throws(
    () => parseSupabaseMigrationList('LOCAL | REMOTE | TIME\n-----|--------|-----\n'),
    /no migration rows were parsed/,
  )
})

test('activation gate passes only when the pending set is exactly approved', () => {
  const directory = createMigrationDir([
    '20260731130000_elite_digest_release_hardening.sql',
    ...control.approved_migrations.map((migration) => migration.file),
  ])
  const repository = readRepositoryMigrations(directory)
  const remote = parseSupabaseMigrationList(asciiOutput)
  const manifest = buildManifest({ repository, remote, control, sourceSha: 'fixture-sha' })

  assert.equal(manifest.activation_gate.ok, true)
  assert.deepEqual(
    manifest.approved_pending,
    control.approved_migrations.map((migration) => migration.version),
  )
  assert.deepEqual(manifest.unexpected_pending, [])
})

test('activation gate rejects any unrelated pending migration', () => {
  const directory = createMigrationDir([
    '20260731130000_elite_digest_release_hardening.sql',
    '20260801150000_api_expose_quality_and_routing_columns.sql',
    ...control.approved_migrations.map((migration) => migration.file),
  ])
  const repository = readRepositoryMigrations(directory)
  const remote = parseSupabaseMigrationList(asciiOutput)
  const manifest = buildManifest({ repository, remote, control })

  assert.equal(manifest.activation_gate.ok, false)
  assert.deepEqual(manifest.unexpected_pending, ['20260801150000'])
})

test('activation gate rejects remote-only drift and partial activation', () => {
  const directory = createMigrationDir(control.approved_migrations.map((migration) => migration.file))
  const repository = readRepositoryMigrations(directory)
  const remote = parseSupabaseMigrationList(`
    LOCAL          | REMOTE         | TIME (UTC)
                   | 20260801000000 | 2026-08-01 00:00:00
    20260802073000 | 20260802073000 | 2026-08-02 07:30:00
    20260802152500 |                | 2026-08-02 15:25:00
    20260802163000 |                | 2026-08-02 16:30:00
  `)
  const manifest = buildManifest({ repository, remote, control })

  assert.equal(manifest.activation_gate.ok, false)
  assert.deepEqual(manifest.applied_not_committed, ['20260801000000'])
  assert.deepEqual(manifest.approved_already_applied, ['20260802073000'])
})
