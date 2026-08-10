import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  buildManifest,
  loadLiveVersionEquivalences,
  loadReleaseControl,
  parseSupabaseMigrationList,
  readRepositoryMigrations,
} from '../../scripts/migration-ledger-manifest.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

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

function bindEquivalence(repository, {
  liveVersion = '20260803123456',
  repositoryVersion = '20260803090000',
  file = '20260803090000_historical_source.sql',
} = {}) {
  return {
    version: 1,
    equivalences: [
      {
        live_version: liveVersion,
        repository_version: repositoryVersion,
        file,
        git_blob_sha: repository.gitBlobShaByFile[file],
        provenance: { type: 'fixture' },
      },
    ],
  }
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

test('live-version equivalence manifest requires a valid content hash', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-equivalence-'))
  const controlPath = path.join(directory, 'equivalences.json')
  fs.writeFileSync(
    controlPath,
    JSON.stringify({
      version: 1,
      equivalences: [
        {
          live_version: '20260803123456',
          repository_version: '20260803090000',
          file: '20260803090000_historical_source.sql',
          git_blob_sha: 'not-a-sha',
        },
      ],
    }),
  )

  assert.throws(
    () => loadLiveVersionEquivalences(controlPath),
    /git_blob_sha is required and invalid/,
  )
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

  assert.equal(
    repository.gitBlobShaByFile[approvedMigrations[1].file] ===
      changedRepository.gitBlobShaByFile[approvedMigrations[1].file],
    false,
  )
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

test('verified historical alias consumes both the live and authored repository versions', () => {
  const { repository, control } = createApprovedRepository([
    '20260803090000_historical_source.sql',
  ])
  const equivalences = bindEquivalence(repository)
  const remote = parseSupabaseMigrationList(`
    LOCAL          | REMOTE         | TIME (UTC)
    20260731130000 | 20260731130000 | 2026-07-31 13:00:00
                   | 20260803123456 | 2026-08-03 12:34:56
    20260802073000 |                | 2026-08-02 07:30:00
    20260802152500 |                | 2026-08-02 15:25:00
    20260802163000 |                | 2026-08-02 16:30:00
    20260803090000 |                | 2026-08-03 09:00:00
  `)
  const manifest = buildManifest({ repository, remote, control, equivalences })

  assert.deepEqual(manifest.applied_not_committed, [])
  assert.equal(manifest.committed_not_applied.includes('20260803090000'), false)
  assert.deepEqual(
    manifest.historical_live_version_aliases.map((entry) => entry.live_version),
    ['20260803123456'],
  )
  assert.deepEqual(manifest.live_version_equivalence_mismatches, [])
})

test('historical alias hash mismatch fails closed as remote-only drift', () => {
  const { directory, repository, control } = createApprovedRepository([
    '20260803090000_historical_source.sql',
  ])
  const equivalences = bindEquivalence(repository)
  fs.appendFileSync(path.join(directory, '20260803090000_historical_source.sql'), '-- tampered\n')
  const changedRepository = readRepositoryMigrations(directory)
  const remote = parseSupabaseMigrationList(`
    LOCAL          | REMOTE         | TIME (UTC)
    20260731130000 | 20260731130000 | 2026-07-31 13:00:00
                   | 20260803123456 | 2026-08-03 12:34:56
    20260802073000 |                | 2026-08-02 07:30:00
    20260802152500 |                | 2026-08-02 15:25:00
    20260802163000 |                | 2026-08-02 16:30:00
    20260803090000 |                | 2026-08-03 09:00:00
  `)
  const manifest = buildManifest({
    repository: changedRepository,
    remote,
    control,
    equivalences,
  })

  assert.deepEqual(manifest.applied_not_committed, ['20260803123456'])
  assert.equal(manifest.committed_not_applied.includes('20260803090000'), true)
  assert.equal(manifest.live_version_equivalence_mismatches.length, 1)
  assert.equal(manifest.activation_gate.requirements.live_version_equivalences_exact, false)
  assert.equal(manifest.activation_gate.ok, false)
})

test('repository equivalence manifest is pinned to the exact canonical migration blobs', () => {
  const repository = readRepositoryMigrations(path.join(repoRoot, 'supabase/migrations'))
  const equivalences = loadLiveVersionEquivalences(
    path.join(
      repoRoot,
      'supabase/release-controls/migration-live-version-equivalences.json',
    ),
  )
  const fakeRemote = {
    parsedRows: equivalences.equivalences.length,
    remoteVersions: equivalences.equivalences.map((entry) => entry.live_version),
  }
  const fakeControl = {
    version: 1,
    release: 'equivalence-contract-test',
    approved_migrations: [
      {
        version: '20260802073000',
        file: '20260802073000_hv_dedup_assign_restore_hnsw_knn.sql',
        git_blob_sha:
          repository.gitBlobShaByFile['20260802073000_hv_dedup_assign_restore_hnsw_knn.sql'],
      },
    ],
  }

  const manifest = buildManifest({
    repository,
    remote: fakeRemote,
    control: fakeControl,
    equivalences,
  })

  assert.equal(manifest.live_version_equivalence_mismatches.length, 0)
  assert.equal(
    manifest.historical_live_version_aliases.length,
    equivalences.equivalences.length,
  )
})

test('canonicalized live-only migrations preserve the exact recovered SQL statements', () => {
  const signalQualitySql = fs
    .readFileSync(
      path.join(
        repoRoot,
        'supabase/migrations/20260808112235_expose_signal_quality_to_api.sql',
      ),
      'utf8',
    )
    .trim()

  const grantHardeningSql = fs
    .readFileSync(
      path.join(
        repoRoot,
        'supabase/migrations/20260808205222_harden_marketplace_item_images_anon_grants.sql',
      ),
      'utf8',
    )
    .trim()

  assert.equal(
    signalQualitySql,
    `create or replace view api.signals_with_quality
with (security_invoker = true)
as
select
  id, date, cat, pri, score, headline, summary, source, url, verification,
  tier, lang, company, country, in_network, lane_r, lane_e, lane_t, top_lane,
  query_pack, commercial_impact, reviewed, action, created_at, embedding_1024,
  embedding_model, embedded_at, reviewed_by, reviewed_at, editorial_title,
  editorial_blurb, country_iso2,
  quality_label, quality_confidence, content_type, impact,
  title_en, summary_en, lang_detected, is_representative, cluster_rep_id,
  analysis
from public.signals;

revoke all on api.signals_with_quality from public, anon;
grant select on api.signals_with_quality to authenticated, service_role;

comment on view api.signals_with_quality is
  'public.signals plus the Pipeline B quality columns. Deliberately NOT granted to anon: it carries internal classifier verdicts and the generated analysis payload. api.signals remains the anon-readable projection.';

create or replace view api.admin_dashboard_counts
with (security_invoker = true)
as
select
  pending_listings,
  pending_buyer_requests,
  new_inquiries,
  pending_matches,
  pending_disclosures
from public.admin_dashboard_counts;

revoke all on api.admin_dashboard_counts from public, anon;
grant select on api.admin_dashboard_counts to authenticated, service_role;

comment on view api.admin_dashboard_counts is
  'Review-queue counters for the Command Centre. security_invoker, so the counts a caller sees are the rows their own role may read.';`,
  )

  assert.equal(
    grantHardeningSql,
    'REVOKE INSERT, UPDATE, DELETE ON TABLE public.marketplace_item_images FROM anon;',
  )
})
