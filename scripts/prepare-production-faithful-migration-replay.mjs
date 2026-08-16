#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const DECISIONS_FILE = 'supabase/release-controls/pending-production-migration-decisions.json'
const MIGRATIONS_DIR = 'supabase/migrations'
const EXCLUDED_SUFFIX = '.replay-excluded'

// Production can contain out-of-band drift or duplicate registrations that a
// later migration repairs/replays even though a repository zero-state replay
// already contains the intended post-state from earlier checked-in history.
// Skip only explicitly evidenced files. This is a temporary replay-only
// exclusion; checked-in history and the production migration ledger are not
// changed.
const REPLAY_ZERO_STATE_SKIPS = [
  '20260714095121_revert_regulatory_signals_orphaned_constraint_drift.sql',
  '20260714224152_create_intel_eval_set_stage0.sql',
  '20260714225601_expose_intel_eval_set_via_api_schema.sql',
  '20260715085610_fix_stale_api_signals_view_missing_reviewer_columns.sql',
]

// Repository-only reconciliation migrations can occasionally have a timestamp
// later than the first historical migration that depends on the production
// state they reconstruct. Relocate only an explicitly evidenced, production-
// unapplied reconstruction/reconciliation file for zero-state replay; the
// checked-in file and production migration ledger remain unchanged.
const REPLAY_RELOCATIONS = [
  {
    source: '20260701230000_corridor_intelligence_tables_stub.sql',
    destination: '20260701180750_replay_corridor_intelligence_tables_stub.sql',
    before: '20260701180751_remote_applied_repair.sql',
  },
  {
    source: '20260730220050_reconcile_listings_production_columns.sql',
    destination: '20260730211140_replay_reconcile_listings_production_columns.sql',
    before: '20260730211147_create_supply_catalog_public_view.sql',
  },
]

function migrationVersion(file) {
  const match = /^(\d{14})_.+\.sql$/.exec(file)
  return match?.[1] ?? null
}

export function planReplayExclusions({ decisions, migrationFiles }) {
  const filesByVersion = new Map()
  for (const file of migrationFiles) {
    const version = migrationVersion(file)
    if (!version) continue
    const existing = filesByVersion.get(version) ?? []
    existing.push(file)
    filesByVersion.set(version, existing)
  }

  const exclusions = []
  for (const decision of decisions.repository_only_decisions ?? []) {
    if (decision.reason_code !== 'exact_live_name_different_version') continue
    if (!Array.isArray(decision.live_equivalent_versions) || decision.live_equivalent_versions.length === 0) continue

    const sourceFiles = filesByVersion.get(decision.version) ?? []
    if (sourceFiles.length !== 1 || sourceFiles[0] !== decision.file) continue

    const repositoryEquivalentVersions = decision.live_equivalent_versions.filter(
      (version) => (filesByVersion.get(version) ?? []).length === 1,
    )
    if (repositoryEquivalentVersions.length === 0) continue

    exclusions.push({
      version: decision.version,
      file: decision.file,
      live_equivalent_versions: decision.live_equivalent_versions,
      repository_equivalent_versions: repositoryEquivalentVersions,
      reason_code: decision.reason_code,
    })
  }

  return exclusions.sort((a, b) => a.version.localeCompare(b.version))
}

export function planReplayZeroStateSkips({ migrationFiles }) {
  const fileSet = new Set(migrationFiles)
  return REPLAY_ZERO_STATE_SKIPS.filter((file) => fileSet.has(file))
}

export function planReplayRelocations({ migrationFiles }) {
  const fileSet = new Set(migrationFiles)
  return REPLAY_RELOCATIONS.filter((item) => {
    if (!fileSet.has(item.source) || fileSet.has(item.destination) || !fileSet.has(item.before)) return false
    const sourceVersion = migrationVersion(item.source)
    const destinationVersion = migrationVersion(item.destination)
    const beforeVersion = migrationVersion(item.before)
    return Boolean(
      sourceVersion &&
        destinationVersion &&
        beforeVersion &&
        sourceVersion > beforeVersion &&
        destinationVersion < beforeVersion,
    )
  })
}

export function runReplayPreparation({ repositoryRoot = process.cwd(), apply = false } = {}) {
  const decisions = JSON.parse(fs.readFileSync(path.join(repositoryRoot, DECISIONS_FILE), 'utf8'))
  const migrationDirectory = path.join(repositoryRoot, MIGRATIONS_DIR)
  const migrationFiles = fs.readdirSync(migrationDirectory).filter((file) => file.endsWith('.sql'))
  const exclusions = planReplayExclusions({ decisions, migrationFiles })
  const zeroStateSkips = planReplayZeroStateSkips({ migrationFiles })
  const relocations = planReplayRelocations({ migrationFiles })

  if (apply) {
    for (const item of exclusions) {
      const source = path.join(migrationDirectory, item.file)
      const destination = `${source}${EXCLUDED_SUFFIX}`
      if (!fs.existsSync(source)) throw new Error(`Replay exclusion source disappeared: ${item.file}`)
      if (fs.existsSync(destination)) throw new Error(`Replay exclusion destination already exists: ${path.basename(destination)}`)
      fs.renameSync(source, destination)
    }
    for (const file of zeroStateSkips) {
      const source = path.join(migrationDirectory, file)
      const destination = `${source}${EXCLUDED_SUFFIX}`
      if (!fs.existsSync(source)) throw new Error(`Replay zero-state skip source disappeared: ${file}`)
      if (fs.existsSync(destination)) throw new Error(`Replay zero-state skip destination already exists: ${path.basename(destination)}`)
      fs.renameSync(source, destination)
    }
    for (const item of relocations) {
      const source = path.join(migrationDirectory, item.source)
      const destination = path.join(migrationDirectory, item.destination)
      if (!fs.existsSync(source)) throw new Error(`Replay relocation source disappeared: ${item.source}`)
      if (fs.existsSync(destination)) throw new Error(`Replay relocation destination already exists: ${item.destination}`)
      fs.renameSync(source, destination)
    }
  }

  return { exclusions, zeroStateSkips, relocations }
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirect) {
  try {
    const apply = process.argv.includes('--apply')
    const { exclusions, zeroStateSkips, relocations } = runReplayPreparation({ apply })
    if (exclusions.length === 0) {
      console.log('Production-faithful replay: no version-alias duplicate files require exclusion.')
    } else {
      console.log(`Production-faithful replay: ${apply ? 'excluded' : 'would exclude'} ${exclusions.length} repository-version alias file(s):`)
      for (const item of exclusions) {
        console.log(`- ${item.file} -> live/repository equivalent ${item.repository_equivalent_versions.join(', ')}`)
      }
    }
    if (zeroStateSkips.length === 0) {
      console.log('Production-faithful replay: no zero-state-inapplicable historical repair/duplicate files require exclusion.')
    } else {
      console.log(`Production-faithful replay: ${apply ? 'excluded' : 'would exclude'} ${zeroStateSkips.length} zero-state-inapplicable historical repair/duplicate file(s):`)
      for (const file of zeroStateSkips) console.log(`- ${file}`)
    }
    if (relocations.length === 0) {
      console.log('Production-faithful replay: no repository-only reconstruction/reconciliation files require earlier replay ordering.')
    } else {
      console.log(`Production-faithful replay: ${apply ? 'relocated' : 'would relocate'} ${relocations.length} repository-only reconstruction/reconciliation file(s):`)
      for (const item of relocations) {
        console.log(`- ${item.source} -> ${item.destination} before ${item.before}`)
      }
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
