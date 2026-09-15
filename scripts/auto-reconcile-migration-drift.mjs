#!/usr/bin/env node
// Automated migration-drift reconciliation.
//
// Problem this solves: production migrations keep getting applied via
// direct execute_sql (bypassing apply_migration), so they exist live but
// have no corresponding committed file. migration-drift-check.yml already
// *detects* this every push/hour -- this script *fixes* it, so the fix
// doesn't depend on a human (or an AI agent) noticing and hand-writing the
// reconstruction, which cannot keep pace with how often this repo takes
// new migrations.
//
// What it does, each run:
//   1. Takes the real `supabase migration list --linked` output (passed in
//      by the calling workflow -- this script never talks to Supabase
//      itself, to keep it testable and to avoid embedding credentials).
//   2. Runs it through the existing filter/manifest scripts to get the
//      authoritative list of remote-only ("applied_not_committed") versions.
//   3. For each one NOT already covered by an equivalence entry, queries
//      supabase_migrations.schema_migrations (via the psql connection the
//      calling workflow already has open) for its name + verbatim
//      statements, and writes a new migration file with a standard
//      "Reconstructed from production" header -- the same convention used
//      throughout this repo's history for this exact situation.
//   4. Writes a short summary to stdout the workflow uses for the PR body.
//
// Deliberately does NOT:
//   - touch the committed_not_applied direction (files with no live
//     version) -- that requires human judgement per
//     pending-production-migration-decisions.json, not blind automation.
//   - auto-merge anything. This produces a PR; full CI (typecheck, build,
//     the feature-specific verify suites) still has to pass before a human
//     or an agent merges it.
//   - ever invent SQL. Every statement written here is copied verbatim
//     from what's already live.

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? fallback : process.argv[i + 1]
}

const remoteListPath = arg('remote-list')
const localDir = arg('local-dir', 'supabase/migrations')
const attestationsPath = arg('attestations')
const equivalencesPath = arg('equivalences')
const controlFile = arg('control-file')
const psqlDsn = arg('psql-dsn') // full postgres:// connection string, already URL-encoded
const summaryOut = arg('summary-out', 'artifacts/auto-reconcile-summary.md')

if (!remoteListPath || !attestationsPath || !equivalencesPath || !controlFile || !psqlDsn) {
  console.error('Usage: auto-reconcile-migration-drift.mjs --remote-list <f> --local-dir <d> --attestations <f> --equivalences <f> --control-file <f> --psql-dsn <dsn> [--summary-out <f>]')
  process.exit(2)
}

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8' })
}

// --- Step 1: filter attested historical remote-only versions ---
const filteredOut = 'artifacts/auto-reconcile-filtered-remote.txt'
run('node', [
  'scripts/filter-attested-historical-migrations.mjs',
  '--remote-list', remoteListPath,
  '--attestations', attestationsPath,
  '--filtered-out', filteredOut,
  '--audit-out', 'artifacts/auto-reconcile-attestation-audit.json',
])

// --- Step 2: run the manifest in drift mode to get the authoritative pending list ---
let manifestFailed = false
try {
  run('node', [
    'scripts/migration-ledger-manifest.mjs',
    '--remote-list', filteredOut,
    '--local-dir', localDir,
    '--control-file', controlFile,
    '--equivalence-file', equivalencesPath,
    '--json-out', 'artifacts/auto-reconcile-manifest.json',
    '--markdown-out', 'artifacts/auto-reconcile-manifest.md',
    '--mode', 'drift',
    '--source-sha', process.env.GITHUB_SHA || 'local',
  ])
} catch {
  // mode=drift exits non-zero when it finds applied_not_committed drift --
  // that's the expected, actionable case this script exists to fix, not a
  // real failure. Any other failure (parse error, missing file) still shows
  // up because manifest.json won't have the shape we expect below and the
  // subsequent JSON.parse will throw.
  manifestFailed = true
}

const manifest = JSON.parse(readFileSync('artifacts/auto-reconcile-manifest.json', 'utf8'))
const remoteOnly = manifest.applied_not_committed || []

if (!manifestFailed || remoteOnly.length === 0) {
  writeFileSync(summaryOut, 'No applied-not-committed migration drift found. Nothing to reconcile.\n')
  console.log('GO: no drift to reconcile.')
  process.exit(0)
}

console.log(`Found ${remoteOnly.length} applied-not-committed version(s): ${remoteOnly.join(', ')}`)

// --- Step 3: for each drifted version, pull name + statements and write a file ---
const written = []
for (const version of remoteOnly) {
  const query = `select coalesce(name, '') as name, coalesce(array_to_string(statements, E'\\n'), '') as stmt from supabase_migrations.schema_migrations where version = '${version}';`
  const raw = run('psql', [psqlDsn, '-X', '-v', 'ON_ERROR_STOP=1', '-A', '-t', '-F', '\u0001', '-c', query])
  const [name, statements] = raw.trim().split('\u0001')

  if (!statements || statements.trim().length === 0) {
    console.log(`  skip ${version}: no statements recorded (likely a history_placeholder-style row, needs a human equivalence entry, not a new file)`)
    continue
  }

  const safeName = (name && name.trim().length > 0 ? name.trim() : `auto_reconcile_${version}`)
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .slice(0, 80)
  const filename = `${version}_${safeName}.sql`
  const filepath = join(localDir, filename)

  if (existsSync(filepath)) {
    console.log(`  skip ${version}: ${filename} already exists locally`)
    continue
  }

  const header = `-- Reconstructed from production by auto-reconcile-migration-drift.mjs.
-- This version was applied directly against production (outside
-- apply_migration) and had no corresponding repository file, which is
-- exactly what "Compare repository and live migration ledgers" checks for.
-- Statements below are verbatim from supabase_migrations.schema_migrations
-- for version ${version}. Adding this file cannot affect production: the
-- version is already applied, so a future \`supabase db push\` skips it.
-- Auto-generated -- review before merging, same as any other PR.

`
  writeFileSync(filepath, header + statements + '\n')
  written.push(filename)
  console.log(`  wrote ${filename}`)
}

const summaryLines = [
  `Auto-reconciled ${written.length} of ${remoteOnly.length} applied-not-committed migration version(s).`,
  '',
  ...written.map((f) => `- \`${f}\``),
]
if (written.length < remoteOnly.length) {
  summaryLines.push('', '**Needs a human:** one or more versions had no recorded statements (likely a `history_placeholder` case) or a naming collision, and were skipped. Check the job log above.')
}
writeFileSync(summaryOut, summaryLines.join('\n') + '\n')

if (written.length === 0) {
  console.log('Nothing new was written (all drifted versions were skipped -- see log above).')
  process.exit(0)
}

console.log(`Wrote ${written.length} file(s). Workflow should commit and open a PR.`)
