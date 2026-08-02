#!/usr/bin/env node

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const VERSION_RE = /^\d{14}$/
const GIT_BLOB_SHA_RE = /^[0-9a-f]{40}$/

function normalizeCell(value) {
  return value.trim().replace(/^`+|`+$/g, '').trim()
}

export function parseSupabaseMigrationList(rawText, { requireRemote = true } = {}) {
  if (typeof rawText !== 'string' || rawText.trim() === '') {
    throw new Error('Supabase migration list output is empty')
  }

  const localVersions = new Set()
  const remoteVersions = new Set()
  let parsedRows = 0
  let sawHeader = false

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    if (/\bLOCAL\b/i.test(line) && /\bREMOTE\b/i.test(line)) {
      sawHeader = true
    }

    const separator = line.includes('│') ? '│' : line.includes('|') ? '|' : null
    if (!separator) continue

    const columns = line.split(separator).map(normalizeCell)
    if (columns.length < 2) continue

    const local = VERSION_RE.test(columns[0]) ? columns[0] : null
    const remote = VERSION_RE.test(columns[1]) ? columns[1] : null
    if (!local && !remote) continue

    parsedRows += 1
    if (local) localVersions.add(local)
    if (remote) remoteVersions.add(remote)
  }

  if (parsedRows === 0) {
    const context = sawHeader
      ? 'a LOCAL/REMOTE table header was present but no migration rows were parsed'
      : 'no LOCAL/REMOTE migration rows were recognized'
    throw new Error(`Supabase migration list parse failed: ${context}`)
  }

  if (requireRemote && remoteVersions.size === 0) {
    throw new Error(
      'Supabase migration list parse failed: zero remote versions were parsed from a nonempty linked-project result',
    )
  }

  return {
    parsedRows,
    localVersions: [...localVersions].sort(),
    remoteVersions: [...remoteVersions].sort(),
  }
}

export function readRepositoryMigrations(migrationsDir) {
  const entries = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort()

  const filesByVersion = new Map()
  const gitBlobShaByFile = {}
  const invalidFiles = []

  for (const file of entries) {
    const content = fs.readFileSync(path.join(migrationsDir, file))
    gitBlobShaByFile[file] = crypto
      .createHash('sha1')
      .update(Buffer.concat([Buffer.from(`blob ${content.length}\0`), content]))
      .digest('hex')
    const version = file.slice(0, 14)
    if (!VERSION_RE.test(version) || file[14] !== '_') {
      invalidFiles.push(file)
      continue
    }
    const files = filesByVersion.get(version) ?? []
    files.push(file)
    filesByVersion.set(version, files)
  }

  return {
    files: entries,
    versions: [...filesByVersion.keys()].sort(),
    gitBlobShaByFile,
    filesByVersion: Object.fromEntries(
      [...filesByVersion.entries()].map(([version, files]) => [version, files]),
    ),
    duplicateVersions: [...filesByVersion.entries()]
      .filter(([, files]) => files.length > 1)
      .map(([version, files]) => ({ version, files })),
    invalidFiles,
  }
}

export function loadReleaseControl(controlPath) {
  const control = JSON.parse(fs.readFileSync(controlPath, 'utf8'))
  const approved = control.approved_migrations

  if (!Array.isArray(approved) || approved.length === 0) {
    throw new Error('Release control must define a nonempty approved_migrations array')
  }

  const versions = approved.map((migration) => migration.version)
  const files = approved.map((migration) => migration.file)

  if (versions.some((version) => !VERSION_RE.test(version))) {
    throw new Error('Every approved migration version must contain exactly 14 digits')
  }
  if (new Set(versions).size !== versions.length) {
    throw new Error('Approved migration versions must be unique')
  }
  if ([...versions].sort().join('\n') !== versions.join('\n')) {
    throw new Error('Approved migrations must be listed in ascending version order')
  }
  for (const [index, file] of files.entries()) {
    if (!file.startsWith(`${versions[index]}_`) || !file.endsWith('.sql')) {
      throw new Error(`Approved migration filename does not match version ${versions[index]}: ${file}`)
    }
    const expectedBlob = approved[index].git_blob_sha
    if (typeof expectedBlob !== 'string' || !GIT_BLOB_SHA_RE.test(expectedBlob)) {
      throw new Error(`Approved migration git_blob_sha is required and invalid for ${file}`)
    }
  }

  return control
}

export function buildManifest({ repository, remote, control, sourceSha = null }) {
  const localSet = new Set(repository.versions)
  const remoteSet = new Set(remote.remoteVersions)
  const approvedVersions = control.approved_migrations.map((migration) => migration.version)
  const approvedSet = new Set(approvedVersions)

  const appliedNotCommitted = [...remoteSet].filter((version) => !localSet.has(version)).sort()
  const committedNotApplied = [...localSet].filter((version) => !remoteSet.has(version)).sort()
  const approvedPending = committedNotApplied.filter((version) => approvedSet.has(version))
  const unexpectedPending = committedNotApplied.filter((version) => !approvedSet.has(version))
  const approvedAlreadyApplied = approvedVersions.filter((version) => remoteSet.has(version))
  const approvedFileMismatches = []

  for (const migration of control.approved_migrations) {
    const files = repository.filesByVersion[migration.version] ?? []
    const actualBlobSha = repository.gitBlobShaByFile[migration.file] ?? null
    if (
      files.length !== 1 ||
      files[0] !== migration.file ||
      actualBlobSha !== migration.git_blob_sha
    ) {
      approvedFileMismatches.push({
        version: migration.version,
        expected: migration.file,
        actual: files,
        expected_git_blob_sha: migration.git_blob_sha,
        actual_git_blob_sha: actualBlobSha,
      })
    }
  }

  const pendingDuplicateVersions = repository.duplicateVersions.filter(({ version }) =>
    committedNotApplied.includes(version),
  )

  const exactApprovedPending =
    approvedPending.length === approvedVersions.length &&
    approvedPending.every((version, index) => version === approvedVersions[index])

  const activationGate = {
    ok:
      appliedNotCommitted.length === 0 &&
      unexpectedPending.length === 0 &&
      approvedAlreadyApplied.length === 0 &&
      exactApprovedPending &&
      approvedFileMismatches.length === 0 &&
      pendingDuplicateVersions.length === 0 &&
      repository.invalidFiles.length === 0,
    requirements: {
      no_remote_only_versions: appliedNotCommitted.length === 0,
      no_unexpected_pending_versions: unexpectedPending.length === 0,
      all_approved_versions_pending: exactApprovedPending,
      no_approved_version_already_applied: approvedAlreadyApplied.length === 0,
      approved_files_exact: approvedFileMismatches.length === 0,
      no_pending_duplicate_versions: pendingDuplicateVersions.length === 0,
      no_invalid_migration_filenames: repository.invalidFiles.length === 0,
    },
  }

  return {
    generated_at: new Date().toISOString(),
    source_sha: sourceSha,
    release: control.release,
    control_file_version: control.version,
    parsed_remote_rows: remote.parsedRows,
    counts: {
      repository_versions: repository.versions.length,
      remote_versions: remote.remoteVersions.length,
      applied_not_committed: appliedNotCommitted.length,
      committed_not_applied: committedNotApplied.length,
      approved_pending: approvedPending.length,
      unexpected_pending: unexpectedPending.length,
    },
    approved_migrations: control.approved_migrations,
    applied_not_committed: appliedNotCommitted,
    committed_not_applied: committedNotApplied,
    approved_pending: approvedPending,
    approved_already_applied: approvedAlreadyApplied,
    unexpected_pending: unexpectedPending,
    approved_file_mismatches: approvedFileMismatches,
    duplicate_repository_versions: repository.duplicateVersions,
    pending_duplicate_versions: pendingDuplicateVersions,
    invalid_migration_filenames: repository.invalidFiles,
    activation_gate: activationGate,
  }
}

export function renderManifestMarkdown(manifest) {
  const lines = [
    '# Repository-versus-live migration manifest',
    '',
    `- Generated: \`${manifest.generated_at}\``,
    `- Source SHA: \`${manifest.source_sha ?? 'unknown'}\``,
    `- Release: \`${manifest.release}\``,
    `- Mode: \`${manifest.mode ?? 'unspecified'}\``,
    `- Mode gate: **${(manifest.execution_gate?.ok ?? manifest.activation_gate.ok) ? 'GO' : 'HOLD'}**`,
    `- Repository versions: ${manifest.counts.repository_versions}`,
    `- Remote versions: ${manifest.counts.remote_versions}`,
    '',
    '## Approved migration sequence',
    '',
  ]

  for (const migration of manifest.approved_migrations) {
    const state = manifest.approved_pending.includes(migration.version)
      ? 'pending and approved'
      : manifest.approved_already_applied.includes(migration.version)
        ? 'already applied'
        : 'not pending'
    lines.push(`- \`${migration.file}\` — ${state}`)
  }

  const sections = [
    ['Remote-only versions', manifest.applied_not_committed],
    ['All repository-only pending versions', manifest.committed_not_applied],
    ['Unexpected pending versions', manifest.unexpected_pending],
  ]

  for (const [title, values] of sections) {
    lines.push('', `## ${title}`, '')
    if (values.length === 0) {
      lines.push('- None')
    } else {
      for (const value of values) lines.push(`- \`${value}\``)
    }
  }

  lines.push('', '## Gate requirements', '')
  for (const [name, passed] of Object.entries(manifest.activation_gate.requirements)) {
    lines.push(`- ${passed ? 'PASS' : 'FAIL'} — \`${name}\``)
  }

  return `${lines.join('\n')}\n`
}

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`)
    const key = token.slice(2)
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`)
    args[key] = value
    index += 1
  }
  return args
}

function writeOutput(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
}

export function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv)
  const required = ['remote-list', 'local-dir', 'control-file', 'json-out', 'markdown-out', 'mode']
  for (const key of required) {
    if (!args[key]) throw new Error(`Missing required argument --${key}`)
  }
  if (!['drift', 'activation-preflight', 'activation-postflight'].includes(args.mode)) {
    throw new Error(`Unsupported mode: ${args.mode}`)
  }

  const remote = parseSupabaseMigrationList(fs.readFileSync(args['remote-list'], 'utf8'))
  const repository = readRepositoryMigrations(args['local-dir'])
  const control = loadReleaseControl(args['control-file'])
  const manifest = buildManifest({
    repository,
    remote,
    control,
    sourceSha: args['source-sha'] ?? process.env.GITHUB_SHA ?? null,
  })
  manifest.mode = args.mode

  const remoteDrift = manifest.applied_not_committed.length > 0
  const approvedStillPending = manifest.approved_pending.length > 0
  const unexpectedPending = manifest.unexpected_pending.length > 0
  const approvedFilesExact = manifest.approved_file_mismatches.length === 0
  const repositoryNamesValid = manifest.invalid_migration_filenames.length === 0
  const allApprovedApplied =
    manifest.approved_already_applied.length === control.approved_migrations.length

  manifest.execution_gate = {
    ok:
      args.mode === 'drift'
        ? !remoteDrift
        : args.mode === 'activation-preflight'
          ? manifest.activation_gate.ok
          : !remoteDrift &&
            !approvedStillPending &&
            !unexpectedPending &&
            approvedFilesExact &&
            repositoryNamesValid &&
            allApprovedApplied,
  }

  writeOutput(args['json-out'], `${JSON.stringify(manifest, null, 2)}\n`)
  writeOutput(args['markdown-out'], renderManifestMarkdown(manifest))

  if (args.mode === 'drift') {
    if (remoteDrift) {
      throw new Error(
        `Remote migration drift detected: ${manifest.applied_not_committed.join(', ')}`,
      )
    }
    return manifest
  }

  if (args.mode === 'activation-preflight' && !manifest.activation_gate.ok) {
    const failedRequirements = Object.entries(manifest.activation_gate.requirements)
      .filter(([, passed]) => !passed)
      .map(([name]) => name)
    throw new Error(
      `Activation manifest is HOLD. Failed requirements: ${failedRequirements.join(', ')}. Unexpected pending versions: ${manifest.unexpected_pending.join(', ') || 'none'}`,
    )
  }

  if (args.mode === 'activation-postflight' && !manifest.execution_gate.ok) {
    throw new Error(
      `Postflight ledger verification failed. Approved still pending: ${manifest.approved_pending.join(', ') || 'none'}; approved applied: ${manifest.approved_already_applied.join(', ') || 'none'}; unexpected pending: ${manifest.unexpected_pending.join(', ') || 'none'}; remote-only: ${manifest.applied_not_committed.join(', ') || 'none'}; file mismatches: ${manifest.approved_file_mismatches.length}`,
    )
  }

  return manifest
}

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirectExecution) {
  try {
    const manifest = runCli()
    console.log(
      `Migration manifest complete: ${manifest.counts.remote_versions} remote, ${manifest.counts.committed_not_applied} pending, gate ${manifest.execution_gate.ok ? 'GO' : 'HOLD'}.`,
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
