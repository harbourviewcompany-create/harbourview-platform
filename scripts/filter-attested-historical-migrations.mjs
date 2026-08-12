#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const VERSION_RE = /^\d{14}$/
const SHA256_RE = /^[0-9a-f]{64}$/

function normalizeCell(value) {
  return value.trim().replace(/^`+|`+$/g, '').trim()
}

export function loadHistoricalAttestations(filePath) {
  const control = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  if (control.version !== 1) throw new Error('Historical migration attestation manifest version must be 1')
  if (!Array.isArray(control.migrations) || control.migrations.length === 0) {
    throw new Error('Historical migration attestation manifest must define a nonempty migrations array')
  }

  const seen = new Set()
  let previousVersion = ''
  for (const entry of control.migrations) {
    if (!VERSION_RE.test(entry.version ?? '')) throw new Error(`Invalid historical migration version: ${entry.version}`)
    if (seen.has(entry.version)) throw new Error(`Duplicate historical migration version: ${entry.version}`)
    if (previousVersion && entry.version <= previousVersion) {
      throw new Error('Historical migration attestations must be strictly ascending by version')
    }
    if (typeof entry.name !== 'string' || !entry.name.trim()) {
      throw new Error(`Historical migration name is required for ${entry.version}`)
    }
    if (!SHA256_RE.test(entry.statement_sha256 ?? '')) {
      throw new Error(`Historical migration statement_sha256 is invalid for ${entry.version}`)
    }
    seen.add(entry.version)
    previousVersion = entry.version
  }
  return control
}

export function filterAttestedHistoricalRows(rawText, control) {
  if (typeof rawText !== 'string' || rawText.trim() === '') throw new Error('Supabase migration list output is empty')

  const attested = new Set(control.migrations.map((entry) => entry.version))
  const seenRemoteOnly = new Set()
  const output = []
  const removed = []

  for (const rawLine of rawText.split(/\r?\n/)) {
    const trimmed = rawLine.trim()
    const separator = trimmed.includes('│') ? '│' : trimmed.includes('|') ? '|' : null
    if (!separator) {
      output.push(rawLine)
      continue
    }

    const columns = trimmed.split(separator).map(normalizeCell)
    const local = VERSION_RE.test(columns[0] ?? '') ? columns[0] : null
    const remote = VERSION_RE.test(columns[1] ?? '') ? columns[1] : null

    if (!local && remote && attested.has(remote)) {
      seenRemoteOnly.add(remote)
      removed.push(remote)
      continue
    }
    output.push(rawLine)
  }

  const missing = [...attested].filter((version) => !seenRemoteOnly.has(version)).sort()
  if (missing.length > 0) {
    throw new Error(`Attested historical migrations were not present as remote-only rows: ${missing.join(', ')}`)
  }

  return {
    text: `${output.join('\n').replace(/\n+$/, '')}\n`,
    removed: removed.sort(),
  }
}

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`)
    const key = arg.slice(2)
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`)
    args[key] = value
    index += 1
  }
  return args
}

export function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv)
  for (const key of ['remote-list', 'attestations', 'filtered-out', 'audit-out']) {
    if (!args[key]) throw new Error(`Missing required argument --${key}`)
  }

  const control = loadHistoricalAttestations(args.attestations)
  const result = filterAttestedHistoricalRows(fs.readFileSync(args['remote-list'], 'utf8'), control)

  fs.mkdirSync(path.dirname(args['filtered-out']), { recursive: true })
  fs.writeFileSync(args['filtered-out'], result.text)
  fs.writeFileSync(
    args['audit-out'],
    `${JSON.stringify({
      manifest_version: control.version,
      project_ref: control.project_ref ?? null,
      captured_at: control.captured_at ?? null,
      attested_count: control.migrations.length,
      filtered_remote_only_count: result.removed.length,
      filtered_versions: result.removed,
    }, null, 2)}\n`,
  )

  console.log(`GO: verified and separated ${result.removed.length} attested historical remote-only migration versions.`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    runCli()
  } catch (error) {
    console.error(`HOLD: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}
