#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const DECISIONS_FILE = 'supabase/release-controls/pending-production-migration-decisions.json'
const MIGRATIONS_DIR = 'supabase/migrations'
const EXCLUDED_SUFFIX = '.replay-excluded'

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

export function runReplayPreparation({ repositoryRoot = process.cwd(), apply = false } = {}) {
  const decisions = JSON.parse(fs.readFileSync(path.join(repositoryRoot, DECISIONS_FILE), 'utf8'))
  const migrationDirectory = path.join(repositoryRoot, MIGRATIONS_DIR)
  const migrationFiles = fs.readdirSync(migrationDirectory).filter((file) => file.endsWith('.sql'))
  const exclusions = planReplayExclusions({ decisions, migrationFiles })

  if (apply) {
    for (const item of exclusions) {
      const source = path.join(migrationDirectory, item.file)
      const destination = `${source}${EXCLUDED_SUFFIX}`
      if (!fs.existsSync(source)) throw new Error(`Replay exclusion source disappeared: ${item.file}`)
      if (fs.existsSync(destination)) throw new Error(`Replay exclusion destination already exists: ${path.basename(destination)}`)
      fs.renameSync(source, destination)
    }
  }

  return exclusions
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirect) {
  try {
    const apply = process.argv.includes('--apply')
    const exclusions = runReplayPreparation({ apply })
    if (exclusions.length === 0) {
      console.log('Production-faithful replay: no version-alias duplicate files require exclusion.')
    } else {
      console.log(`Production-faithful replay: ${apply ? 'excluded' : 'would exclude'} ${exclusions.length} repository-version alias file(s):`)
      for (const item of exclusions) {
        console.log(`- ${item.file} -> live/repository equivalent ${item.repository_equivalent_versions.join(', ')}`)
      }
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
