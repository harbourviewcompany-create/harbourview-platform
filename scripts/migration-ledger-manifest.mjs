#!/usr/bin/env node

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const VERSION_RE = /^\d{14}$/
const GIT_BLOB_SHA_RE = /^[0-9a-f]{40}$/
const MD5_RE = /^[0-9a-f]{32}$/
const DEFAULT_EQUIVALENCE_FILE = path.join(
  process.cwd(),
  'supabase/release-controls/migration-live-version-equivalences.json',
)

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

export function loadLiveVersionEquivalences(equivalencePath, { allowMissing = false } = {}) {
  if (!fs.existsSync(equivalencePath)) {
    if (allowMissing) return { version: 1, equivalences: [] }
    throw new Error(`Migration live-version equivalence file not found: ${equivalencePath}`)
  }

  const control = JSON.parse(fs.readFileSync(equivalencePath, 'utf8'))
  const entries = control.equivalences

  if (control.version !== 1) {
    throw new Error('Migration live-version equivalence manifest version must be 1')
  }
  if (!Array.isArray(entries)) {
    throw new Error('Migration live-version equivalence manifest must define an equivalences array')
  }

  const liveVersions = new Set()
  const repositoryVersions = new Set()
  for (const entry of entries) {
    if (!VERSION_RE.test(entry.live_version ?? '')) {
      throw new Error(`Invalid live migration version in equivalence manifest: ${entry.live_version}`)
    }
    if (!VERSION_RE.test(entry.repository_version ?? '')) {
      throw new Error(
        `Invalid repository migration version in equivalence manifest: ${entry.repository_version}`,
      )
    }
    if (entry.live_version === entry.repository_version) {
      throw new Error(
        `Live/repository migration equivalence must map different versions: ${entry.live_version}`,
      )
    }
    if (
      typeof entry.file !== 'string' ||
      !entry.file.startsWith(`${entry.repository_version}_`) ||
      !entry.file.endsWith('.sql')
    ) {
      throw new Error(
        `Equivalence filename does not match repository version ${entry.repository_version}: ${entry.file}`,
      )
    }
    if (typeof entry.git_blob_sha !== 'string' || !GIT_BLOB_SHA_RE.test(entry.git_blob_sha)) {
      throw new Error(`Equivalence git_blob_sha is required and invalid for ${entry.file}`)
    }

    const repositoryVersionState = entry.repository_version_state ?? null
    if (repositoryVersionState !== null && repositoryVersionState !== 'history_placeholder') {
      throw new Error(
        `Unsupported repository_version_state for ${entry.live_version}: ${repositoryVersionState}`,
      )
    }
    if (repositoryVersionState === 'history_placeholder') {
      const provenance = entry.provenance ?? {}
      if (
        provenance.repository_history_name_null !== true ||
        provenance.repository_history_statements_null !== true
      ) {
        throw new Error(
          `History-placeholder equivalence requires read-only null name/statements evidence for ${entry.live_version}`,
        )
      }
      if (
        !MD5_RE.test(provenance.production_statement_md5 ?? '') ||
        !Number.isInteger(provenance.production_statement_chars) ||
        provenance.production_statement_chars <= 0
      ) {
        throw new Error(
          `History-placeholder equivalence requires production statement content evidence for ${entry.live_version}`,
        )
      }
    }

    if (liveVersions.has(entry.live_version)) {
      throw new Error(`Duplicate live migration equivalence: ${entry.live_version}`)
    }
    if (repositoryVersions.has(entry.repository_version)) {
      throw new Error(`Duplicate repository migration equivalence: ${entry.repository_version}`)
    }
    liveVersions.add(entry.live_version)
    repositoryVersions.add(entry.repository_version)
  }

  return control
}

function evaluateLiveVersionEquivalences({ repository, remoteSet, equivalences }) {
  const recognizedLiveVersions = new Set()
  const recognizedRepositoryVersions = new Set()
  const historicalAliases = []
  const equivalenceMismatches = []

  for (const entry of equivalences.equivalences ?? []) {
    if (!remoteSet.has(entry.live_version)) continue

    const files = repository.filesByVersion[entry.repository_version] ?? []
    const actualBlobSha = repository.gitBlobShaByFile[entry.file] ?? null
    const directRepositoryVersionAlsoApplied = remoteSet.has(entry.repository_version)
    const repositoryHistoryPlaceholder = entry.repository_version_state === 'history_placeholder'
    const directRepositoryVersionAllowed =
      !directRepositoryVersionAlsoApplied || repositoryHistoryPlaceholder
    const fileExact =
      files.length === 1 &&
      files[0] === entry.file &&
      actualBlobSha === entry.git_blob_sha

    if (!fileExact || !directRepositoryVersionAllowed) {
      equivalenceMismatches.push({
        live_version: entry.live_version,
        repository_version: entry.repository_version,
        repository_version_state: entry.repository_version_state ?? null,
        expected_file: entry.file,
        actual_files: files,
        expected_git_blob_sha: entry.git_blob_sha,
        actual_git_blob_sha: actualBlobSha,
        direct_repository_version_also_applied: directRepositoryVersionAlsoApplied,
      })
      continue
    }

    recognizedLiveVersions.add(entry.live_version)
    recognizedRepositoryVersions.add(entry.repository_version)
    historicalAliases.push({
      live_version: entry.live_version,
      repository_version: entry.repository_version,
      repository_version_state: entry.repository_version_state ?? null,
      file: entry.file,
      git_blob_sha: entry.git_blob_sha,
      provenance: entry.provenance ?? null,
    })
  }

  return {
    recognizedLiveVersions,
    recognizedRepositoryVersions,
    historicalAliases,
    equivalenceMismatches,
  }
}

export function buildManifest({
  repository,
  remote,
  control,
  equivalences = { version: 1, equivalences: [] },
  sourceSha = null,
}) {
  const localSet = new Set(repository.versions)
  const remoteSet = new Set(remote.remoteVersions)
  const approvedVersions = control.approved_migrations.map((migration) => migration.version)
  const approvedSet = new Set(approvedVersions)

  const aliasEvaluation = evaluateLiveVersionEquivalences({
    repository,
    remoteSet,
    equivalences,
  })

  const appliedNotCommitted = [...remoteSet]
    .filter(
      (version) =>
        !localSet.has(version) && !aliasEvaluation.recognizedLiveVersions.has(version),
    )
    .sort()

  const committedNotApplied = [...localSet]
    .filter(
      (version) =>
        !remoteSet.has(version) && !aliasEvaluation.recognizedRepositoryVersions.has(version),
    )
    .sort()

  const approvedPending = committedNotApplied.filter((version) => approvedSet.has(version))
  const unexpectedPending = committedNotApplied.filter((version) => !approvedSet.has(version))
  const approvedAlreadyApplied = approvedVersions.filter(
    (version) =>
      remoteSet.has(version) || aliasEvaluation.recognizedRepositoryVersions.has(version),
  )
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
      aliasEvaluation.equivalenceMismatches.length === 0 &&
      unexpectedPending.length === 0 &&
      approvedAlreadyApplied.length === 0 &&
      exactApprovedPending &&
      approvedFileMismatches.length === 0 &&
      pendingDuplicateVersions.length === 0 &&
      repository.invalidFiles.length === 0,
    requirements: {
      no_remote_only_versions: appliedNotCommitted.length === 0,
      live_version_equivalences_exact: aliasEvaluation.equivalenceMismatches.length === 0,
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
    equivalence_file_version: equivalences.version ?? null,
    parsed_remote_rows: remote.parsedRows,
    counts: {
      repository_versions: repository.versions.length,
      remote_versions: remote.remoteVersions.length,
      applied_not_committed: appliedNotCommitted.length,
      committed_not_applied: committedNotApplied.length,
      approved_pending: approvedPending.length,
      unexpected_pending: unexpectedPending.length,
      historical_aliases: aliasEvaluation.historicalAliases.length,
      equivalence_mismatches: aliasEvaluation.equivalenceMismatches.length,
    },
    approved_migrations: control.approved_migrations,
    applied_not_committed: appliedNotCommitted,
    committed_not_applied: committedNotApplied,
    approved_pending: approvedPending,
    approved_already_applied: approvedAlreadyApplied,
    unexpected_pending: unexpectedPending,
    historical_live_version_aliases: aliasEvaluation.historicalAliases,
    live_version_equivalence_mismatches: aliasEvaluation.equivalenceMismatches,
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
    `- Verified historical aliases: ${manifest.counts.historical_aliases ?? 0}`,
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

  lines.push('', '## Verified historical live-version aliases', '')
  if (manifest.historical_live_version_aliases.length === 0) {
    lines.push('- None')
  } else {
    for (const alias of manifest.historical_live_version_aliases) {
      lines.push(
        `- \`${alias.live_version}\` → \`${alias.repository_version}\` — \`${alias.file}\` @ \`${alias.git_blob_sha}\``,
      )
    }
  }

  lines.push('', '## Live-version equivalence mismatches', '')
  if (manifest.live_version_equivalence_mismatches.length === 0) {
    lines.push('- None')
  } else {
    for (const mismatch of manifest.live_version_equivalence_mismatches) {
      lines.push(
        `- \`${mismatch.live_version}\` → \`${mismatch.repository_version}\` — expected \`${mismatch.expected_file}\` @ \`${mismatch.expected_git_blob_sha}\`, actual SHA \`${mismatch.actual_git_blob_sha ?? 'missing'}\``,
      )
    }
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
  const equivalencePath = args['equivalence-file'] ?? DEFAULT_EQUIVALENCE_FILE
  const equivalences = loadLiveVersionEquivalences(equivalencePath, {
    allowMissing: !args['equivalence-file'],
  })
  const manifest = buildManifest({
    repository,
    remote,
    control,
    equivalences,
    sourceSha: args['source-sha'] ?? process.env.GITHUB_SHA ?? null,
  })
  manifest.mode = args.mode
  manifest.equivalence_file = fs.existsSync(equivalencePath) ? equivalencePath : null

  const remoteDrift = manifest.applied_not_committed.length > 0
  const equivalenceDrift = manifest.live_version_equivalence_mismatches.length > 0
  const approvedStillPending = manifest.approved_pending.length > 0
  const unexpectedPending = manifest.unexpected_pending.length > 0
  const approvedFilesExact = manifest.approved_file_mismatches.length === 0
  const repositoryNamesValid = manifest.invalid_migration_filenames.length === 0
  const allApprovedApplied =
    manifest.approved_already_applied.length === control.approved_migrations.length

  manifest.execution_gate = {
    ok:
      args.mode === 'drift'
        ? !remoteDrift && !equivalenceDrift
        : args.mode === 'activation-preflight'
          ? manifest.activation_gate.ok
          : !remoteDrift &&
            !equivalenceDrift &&
            !approvedStillPending &&
            !unexpectedPending &&
            approvedFilesExact &&
            repositoryNamesValid &&
            allApprovedApplied,
  }

  writeOutput(args['json-out'], `${JSON.stringify(manifest, null, 2)}\n`)
  writeOutput(args['markdown-out'], renderManifestMarkdown(manifest))

  if (args.mode === 'drift') {
    if (remoteDrift || equivalenceDrift) {
      const mismatchLiveVersions = manifest.live_version_equivalence_mismatches.map(
        (entry) => entry.live_version,
      )
      throw new Error(
        `Remote migration drift detected: ${manifest.applied_not_committed.join(', ') || 'none'}; equivalence mismatches: ${mismatchLiveVersions.join(', ') || 'none'}`,
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
      `Postflight ledger verification failed. Approved still pending: ${manifest.approved_pending.join(', ') || 'none'}; approved applied: ${manifest.approved_already_applied.join(', ') || 'none'}; unexpected pending: ${manifest.unexpected_pending.join(', ') || 'none'}; remote-only: ${manifest.applied_not_committed.join(', ') || 'none'}; equivalence mismatches: ${manifest.live_version_equivalence_mismatches.length}; file mismatches: ${manifest.approved_file_mismatches.length}`,
    )
  }

  return manifest
}

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirectExecution) {
  try {
    const manifest = runCli()
    console.log(
      `Migration manifest complete: ${manifest.counts.remote_versions} remote, ${manifest.counts.committed_not_applied} pending, ${manifest.counts.historical_aliases} historical aliases, gate ${manifest.execution_gate.ok ? 'GO' : 'HOLD'}.`,
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
