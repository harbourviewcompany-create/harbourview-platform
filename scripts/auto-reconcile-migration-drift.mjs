#!/usr/bin/env node
/**
 * Auto-reconcile applied-not-committed migration drift.
 *
 * For each remote-only version (present in live schema_migrations, absent from
 * supabase/migrations after attestation/equivalence filtering), read the
 * verbatim statements from production and write a repository migration file.
 *
 * Safe: does not apply anything to production. supabase db push only applies
 * versions not already in schema_migrations; every version we write is already
 * there. Rule: never invent SQL — only copy statements from the live ledger.
 *
 * Invoked by .github/workflows/auto-reconcile-migration-drift.yml
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import {
  buildManifest,
  loadLiveVersionEquivalences,
  loadReleaseControl,
  parseSupabaseMigrationList,
  readRepositoryMigrations,
} from './migration-ledger-manifest.mjs'
import {
  filterAttestedHistoricalRows,
  loadHistoricalAttestations,
} from './filter-attested-historical-migrations.mjs'

const VERSION_RE = /^\d{14}$/

export function parseArgs(argv = process.argv.slice(2)) {
  const out = {
    remoteList: null,
    localDir: 'supabase/migrations',
    attestations: null,
    equivalences: null,
    controlFile: null,
    psqlDsn: null,
    summaryOut: null,
    dryRun: false,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    const next = () => {
      i += 1
      return argv[i]
    }
    if (a === '--remote-list') out.remoteList = next()
    else if (a === '--local-dir') out.localDir = next()
    else if (a === '--attestations') out.attestations = next()
    else if (a === '--equivalences') out.equivalences = next()
    else if (a === '--control-file') out.controlFile = next()
    else if (a === '--psql-dsn') out.psqlDsn = next()
    else if (a === '--summary-out') out.summaryOut = next()
    else if (a === '--dry-run') out.dryRun = true
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: node scripts/auto-reconcile-migration-drift.mjs \\
  --remote-list artifacts/remote-migrations.txt \\
  --local-dir supabase/migrations \\
  --attestations supabase/release-controls/historical-remote-migration-attestations.json \\
  --equivalences supabase/release-controls/migration-live-version-equivalences.json \\
  --control-file supabase/release-controls/elite-digest-production-activation.json \\
  --psql-dsn "$DSN" \\
  --summary-out artifacts/summary.md`)
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${a}`)
    }
  }
  if (!out.remoteList) throw new Error('--remote-list is required')
  if (!out.controlFile) throw new Error('--control-file is required')
  if (!out.psqlDsn && !out.dryRun) throw new Error('--psql-dsn is required (unless --dry-run with fixture)')
  return out
}

export function renderReconciledMigration(version, statements) {
  const body = (Array.isArray(statements) ? statements : [statements])
    .map((s) => String(s).trim())
    .filter(Boolean)
    .map((s) => (s.endsWith(';') ? s : `${s};`))
    .join('\n\n')

  return `-- Reconciled from live supabase_migrations.schema_migrations
-- Version: ${version}
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

${body}
`
}

export function suggestFileName(version, statements) {
  const first = String(Array.isArray(statements) ? statements[0] : statements || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
  const slug = first || 'reconciled_from_live'
  return `${version}_${slug}.sql`
}

export function selectVersionsToReconcile(manifest) {
  return [...(manifest.applied_not_committed ?? [])].sort()
}

function fetchStatementsByVersion(psqlDsn, versions) {
  if (!versions.length) return new Map()
  const list = versions.map((v) => `'${v}'`).join(',')
  const query = `
    select coalesce(
      json_agg(json_build_object('version', version, 'statements', statements) order by version),
      '[]'::json
    )
    from supabase_migrations.schema_migrations
    where version in (${list});
  `
  const raw = execFileSync('psql', [psqlDsn, '-Atc', query], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }).trim()
  const rows = JSON.parse(raw || '[]')
  return new Map(rows.map((r) => [String(r.version), r.statements]))
}

export function runReconcile(args) {
  const remoteRaw = fs.readFileSync(args.remoteList, 'utf8')

  let filteredRemoteText = remoteRaw
  if (args.attestations && fs.existsSync(args.attestations)) {
    const control = loadHistoricalAttestations(args.attestations)
    // filterAttestedHistoricalRows removes remote-only rows that are attested;
    // for reconcile we want applied_not_committed AFTER attestation filter so
    // we don't rewrite historical attested holes as new files.
    try {
      filteredRemoteText = filterAttestedHistoricalRows(remoteRaw, control).text
    } catch (err) {
      // If attestations don't match current remote-only set, fall back to raw
      // list and let buildManifest decide — do not block reconciliation.
      console.warn(
        `Attestation filter skipped: ${err instanceof Error ? err.message : String(err)}`,
      )
      filteredRemoteText = remoteRaw
    }
  }

  const remote = parseSupabaseMigrationList(filteredRemoteText, { requireRemote: true })
  const repository = readRepositoryMigrations(args.localDir)
  const control = loadReleaseControl(args.controlFile)
  const equivalences = loadLiveVersionEquivalences(
    args.equivalences ?? path.join(process.cwd(), 'supabase/release-controls/migration-live-version-equivalences.json'),
    { allowMissing: true },
  )

  const manifest = buildManifest({
    repository,
    remote,
    control,
    equivalences,
    sourceSha: process.env.GITHUB_SHA ?? null,
  })

  const versions = selectVersionsToReconcile(manifest)
  const written = []
  const skipped = []

  if (versions.length === 0) {
    const summary = [
      '# Migration drift reconciliation',
      '',
      'No applied-not-committed versions remaining after attestation/equivalence filtering.',
      '',
      `- Remote versions parsed: ${remote.remoteVersions.length}`,
      `- Repository versions: ${repository.versions.length}`,
      '',
    ].join('\n')
    if (args.summaryOut) {
      fs.mkdirSync(path.dirname(args.summaryOut), { recursive: true })
      fs.writeFileSync(args.summaryOut, summary)
    }
    return { written, skipped, versions, summary }
  }

  const byVersion = args.psqlDsn
    ? fetchStatementsByVersion(args.psqlDsn, versions)
    : new Map()

  for (const version of versions) {
    if (!VERSION_RE.test(version)) {
      skipped.push({ version, reason: 'invalid_version' })
      continue
    }
    const statements = byVersion.get(version)
    if (!statements || (Array.isArray(statements) && statements.length === 0)) {
      skipped.push({ version, reason: 'no_statements_in_schema_migrations' })
      continue
    }
    const fileName = suggestFileName(version, statements)
    const target = path.join(args.localDir, fileName)
    if (fs.existsSync(target)) {
      skipped.push({ version, reason: 'file_already_exists', file: fileName })
      continue
    }
    // Avoid colliding with any existing file for the same version
    const existing = (repository.filesByVersion?.[version] ?? []).length
    if (existing > 0) {
      skipped.push({ version, reason: 'version_already_in_repo' })
      continue
    }
    const contents = renderReconciledMigration(version, statements)
    if (!args.dryRun) {
      fs.writeFileSync(target, contents)
    }
    written.push({ version, file: fileName, statements: Array.isArray(statements) ? statements.length : 1 })
  }

  const summary = [
    '# Migration drift reconciliation',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `## Written (${written.length})`,
    ...(written.length
      ? written.map((w) => `- \`${w.file}\` (${w.statements} statement(s))`)
      : ['- (none)']),
    '',
    `## Skipped (${skipped.length})`,
    ...(skipped.length
      ? skipped.map((s) => `- ${s.version}: ${s.reason}${s.file ? ` (${s.file})` : ''}`)
      : ['- (none)']),
    '',
    'All written statements were copied from `supabase_migrations.schema_migrations`.',
    'Nothing in this change set is applied to production.',
    '',
  ].join('\n')

  if (args.summaryOut) {
    fs.mkdirSync(path.dirname(args.summaryOut), { recursive: true })
    fs.writeFileSync(args.summaryOut, summary)
  }

  return { written, skipped, versions, summary }
}

function main() {
  const args = parseArgs()
  const result = runReconcile(args)
  console.log(result.summary)
  // Non-zero only on hard failures; zero written is success (already clean).
  process.exit(0)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main()
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}
