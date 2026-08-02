import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  buildManifest,
  loadReleaseControl,
  parseSupabaseMigrationList,
  readRepositoryMigrations,
} from '../../scripts/migration-ledger-manifest.mjs'

const approvedMigrations = [
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
]

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

function bindControlToRepository(repository) {
  return {
    version: 1,
    release: 'elite-digest-production-activation',
    approved_migrations: approvedMigrations.map((migration) => ({
      ...migration,
      git_blob_sha: repository.gitBlobShaByFile[migration.file],
    })),
  }
}

function createApprovedRepository(extraFiles = []) {
  const directory = createMigrationDir([
    '20260731130000_elite_digest_release_hardening.sql',
    ...approvedMigrations.map((migration) => migration.file),
    ...extraFiles,
  ])
  const repository = readRepositoryMigrations(directory)
  return { directory, repository, control: bindControlToRepository(repository) }
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

test('fails when rows parse but no remote version is present', () => {
  assert.throws(
    () =>
      parseSupabaseMigrationList(`
        Local          | Remote         | Time (UTC)
        20260802073000 |                | 2026-08-02 07:30:00
      `),
    /zero remote versions/,
  )
})

test('release control requires a valid Git blob SHA for every approved migration', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-control-'))
  const controlPath = path.join(directory, 'control.json')
  fs.writeFileSync(
    controlPath,
    JSON.stringify({
      version: 1,
      release: 'elite-digest-production-activation',
      approved_migrations: approvedMigrations,
    }),
  )

  assert.throws(() => loadReleaseControl(controlPath), /git_blob_sha is required and invalid/)
})

test('activation gate passes only when the exact content-bound set is pending', () => {
  const { repository, control } = createApprovedRepository()
  const remote = parseSupabaseMigrationList(asciiOutput)
  const manifest = buildManifest({ repository, remote, control, sourceSha: 'fixture-sha' })

  assert.equal(manifest.activation_gate.ok, true)
  assert.deepEqual(
    manifest.approved_pending,
    control.approved_migrations.map((migration) => migration.version),
  )
  assert.deepEqual(manifest.unexpected_pending, [])
  assert.deepEqual(manifest.approved_file_mismatches, [])
})

test('activation gate rejects any unrelated pending migration', () => {
  const { repository, control } = createApprovedRepository([
    '20260801150000_api_expose_quality_and_routing_columns.sql',
  ])
  const remote = parseSupabaseMigrationList(asciiOutput)
  const manifest = buildManifest({ repository, remote, control })

  assert.equal(manifest.activation_gate.ok, false)
  assert.deepEqual(manifest.unexpected_pending, ['20260801150000'])
})

test('activation gate rejects remote-only drift and partial activation', () => {
  const directory = createMigrationDir(approvedMigrations.map((migration) => migration.file))
  const repository = readRepositoryMigrations(directory)
  const control = bindControlToRepository(repository)
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

test('activation gate rejects approved migration content changes', () => {
  const { directory, repository, control } = createApprovedRepository()
  fs.appendFileSync(path.join(directory, approvedMigrations[1].file), '-- changed\n')
  const changedRepository = readRepositoryMigrations(directory)
  const remote = parseSupabaseMigrationList(asciiOutput)
  const manifest = buildManifest({ repository: changedRepository, remote, control })

  assert.equal(repository.gitBlobShaByFile[approvedMigrations[1].file] === changedRepository.gitBlobShaByFile[approvedMigrations[1].file], false)
  assert.equal(manifest.activation_gate.requirements.approved_files_exact, false)
  assert.deepEqual(
    manifest.approved_file_mismatches.map((mismatch) => mismatch.version),
    ['20260802152500'],
  )
})

test('activation gate rejects duplicate versions and invalid filenames', () => {
  const { repository, control } = createApprovedRepository([
    '20260802073000_duplicate_copy.sql',
    'not_a_migration.sql',
  ])
  const remote = parseSupabaseMigrationList(asciiOutput)
  const manifest = buildManifest({ repository, remote, control })

  assert.equal(manifest.activation_gate.ok, false)
  assert.equal(manifest.activation_gate.requirements.no_pending_duplicate_versions, false)
  assert.equal(manifest.activation_gate.requirements.no_invalid_migration_filenames, false)
})
