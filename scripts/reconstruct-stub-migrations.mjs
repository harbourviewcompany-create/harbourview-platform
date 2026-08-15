#!/usr/bin/env node
// Reconstruct placeholder migration files from the statements production
// actually ran.
//
// THE PROBLEM
//
// 167 files in supabase/migrations carry no DDL. Each contains only a comment
// saying it was applied directly to production via Supabase MCP and exists to
// satisfy local/remote migration history parity, followed by `SELECT 1;`.
//
// That is invisible to every gate the repository has:
//
//   - `Compare repository and live migration ledgers` compares VERSION NUMBERS.
//     A placeholder has the right version, so drift reads as clean.
//   - `check-placeholder-landmines` greps five English phrases
//     ("// TODO: implement", "rest of the file unchanged", ...). None of them
//     is the phrase these files use, so it passes.
//   - `check-migration-sql-parses.mjs` parses `SELECT 1;` happily.
//
// Only a real replay catches it, and `production-security-hardening.yml` --
// the one workflow that runs `supabase db reset --local` -- was `paths`-filtered
// to five files until 2026-08-14, so it effectively never fired.
//
// Consequence: the repository cannot rebuild production. Replay dies at the
// first migration that depends on schema a placeholder was supposed to create.
// Observed 2026-08-14:
//
//   ERROR: relation "public.education_content_citations" does not exist (42P01)
//   At statement: 5
//   alter policy education_content_citations_service_write
//     on public.education_content_citations
//
// `20260720093632_create_education_content_citations.sql` is a placeholder, so
// the table is never created locally, so a later ALTER POLICY on it fails.
//
// WHY THIS IS SAFE
//
// Rewriting an already-applied migration cannot change production. `supabase
// db push` applies only versions absent from supabase_migrations.schema_migrations,
// and every version this script rewrites is present there -- that is exactly
// the precondition it enforces before writing a single byte.
//
// The one placeholder that is NOT applied to production
// (20260724000000_fix_entity_decode_blanking_bug_in_signal_extraction.sql,
// verified 2026-08-14) is therefore skipped: it has no statements to recover,
// and filling it in would turn a repository-only repair into a production
// schema change. That asymmetry is the whole reason for the guard.
//
// USAGE
//
//   DATABASE_URL='postgresql://...' node scripts/reconstruct-stub-migrations.mjs
//   DATABASE_URL='postgresql://...' node scripts/reconstruct-stub-migrations.mjs --dry-run
//   ... --only 20260720093632,20260720093647
//
// Requires read access to supabase_migrations.schema_migrations. Read-only
// against the database; the only writes are to files in supabase/migrations.

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'

const MIGRATION_DIR = 'supabase/migrations'
const STUB_MARKER = 'No DDL executed by this file'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const onlyArg = args.find((a) => a.startsWith('--only'))
const only = onlyArg
  ? (onlyArg.includes('=') ? onlyArg.split('=')[1] : args[args.indexOf(onlyArg) + 1])
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : null

function findStubs() {
  return fs
    .readdirSync(MIGRATION_DIR)
    .filter((f) => f.endsWith('.sql'))
    .filter((f) => fs.readFileSync(path.join(MIGRATION_DIR, f), 'utf8').includes(STUB_MARKER))
    .map((file) => ({ file, version: file.slice(0, 14) }))
    .filter((s) => (only ? only.includes(s.version) : true))
    .sort((a, b) => a.version.localeCompare(b.version))
}

function header(version) {
  return `-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by \`SELECT 1;\`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so \`supabase db reset --local\` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version ${version}.
--
-- Rewriting this file cannot affect production: ${version} is already recorded
-- in schema_migrations, so \`supabase db push\` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

`
}

export function renderMigration(version, statements) {
  let body = statements
    .map((s) => String(s).replace(/\s+$/, ''))
    .filter((s) => s.length > 0)
    .map((s) => (s.endsWith(';') ? s : `${s};`))
    .join('\n\n')
  return `${header(version)}${body}\n`
}

async function main() {
  const stubs = findStubs()
  if (stubs.length === 0) {
    console.log('No placeholder migrations found. Nothing to reconstruct.')
    return
  }
  console.log(`Found ${stubs.length} placeholder migration(s).`)

  const connectionString = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL
  if (!connectionString) {
    console.error(
      '\nDATABASE_URL (or SUPABASE_DB_URL) is required. It must point at the production\n' +
        'project so the original statements can be read back. Read-only access to\n' +
        'supabase_migrations.schema_migrations is sufficient.',
    )
    process.exit(2)
  }

  // Deliberately shells out to psql rather than taking a `pg` dependency.
  // The Supabase CLI already puts psql on the path in CI, and this repository
  // has a standing hazard around dependency bumps: Dependabot pull requests
  // never run `Next.js Build`, so a new runtime dependency is exactly the kind
  // of change its CI is weakest at catching (AGENT_OPERATING_FACTS.md §2).
  const versionList = stubs.map((s) => s.version).join(',')
  const query = `
    select coalesce(json_agg(json_build_object('version', version, 'statements', statements)), '[]'::json)
    from supabase_migrations.schema_migrations
    where version = any(string_to_array('${versionList}', ','))
  `

  let rows
  try {
    const raw = execFileSync('psql', [connectionString, '-Atc', query], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
    rows = JSON.parse(raw)
  } catch (error) {
    console.error('Failed to read schema_migrations via psql.')
    console.error(error.stderr ?? error.message)
    process.exit(1)
  }

  let written = 0
  let skippedUnapplied = 0
  {
    const byVersion = new Map(rows.map((r) => [r.version, r.statements]))

    for (const { file, version } of stubs) {
      const statements = byVersion.get(version)
      if (!statements) {
        // Not applied to production: filling this in would be a schema change,
        // not a repository repair. Never write it.
        console.warn(`SKIP ${file}: version not in schema_migrations (not applied to production)`)
        skippedUnapplied++
        continue
      }
      if (!Array.isArray(statements) || statements.length === 0) {
        console.warn(`SKIP ${file}: no statements recorded for ${version}`)
        continue
      }
      const contents = renderMigration(version, statements)
      if (contents.includes(STUB_MARKER)) {
        console.warn(`SKIP ${file}: rendered output still matches the placeholder marker`)
        continue
      }
      if (!dryRun) fs.writeFileSync(path.join(MIGRATION_DIR, file), contents)
      console.log(
        `${dryRun ? 'would write' : 'wrote'} ${file} (${statements.length} statement(s), ${contents.length} bytes)`,
      )
      written++
    }
  }

  console.log(`\n${written} file(s) ${dryRun ? 'would be ' : ''}reconstructed.`)
  if (skippedUnapplied > 0) {
    console.log(
      `${skippedUnapplied} skipped because they are not applied to production — these need a\n` +
        'deliberate decision, not reconstruction. See the header of this script.',
    )
  }
  console.log('\nNext: run the replay gate to confirm the tree rebuilds:')
  console.log('  supabase start && supabase db reset --local')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
