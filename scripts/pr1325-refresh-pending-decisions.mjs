#!/usr/bin/env node

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const manifestPath = process.argv[2]
const outputPath = process.argv[3]
if (!manifestPath || !outputPath) {
  throw new Error('usage: node scripts/pr1325-refresh-pending-decisions.mjs <manifest.json> <output.json>')
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const decisionPath = 'supabase/release-controls/pending-production-migration-decisions.json'
const current = JSON.parse(fs.readFileSync(decisionPath, 'utf8'))
const migrationDir = 'supabase/migrations'
const files = fs.readdirSync(migrationDir).filter((name) => name.endsWith('.sql')).sort()
const byVersion = new Map()
const blobSha = new Map()
for (const file of files) {
  const version = file.slice(0, 14)
  const list = byVersion.get(version) ?? []
  list.push(file)
  byVersion.set(version, list)
  const content = fs.readFileSync(path.join(migrationDir, file))
  const sha = crypto
    .createHash('sha1')
    .update(Buffer.concat([Buffer.from(`blob ${content.length}\0`), content]))
    .digest('hex')
  blobSha.set(file, sha)
}

const oldByFile = new Map((current.repository_only_decisions ?? []).map((record) => [record.file, record]))
const approvedByVersion = new Map((current.elite_digest_allowlist_unchanged ?? []).map((record) => [record.version, record]))
const targetVersion = '20260810222500'
const refreshed = []
for (const version of manifest.committed_not_applied) {
  const versionFiles = byVersion.get(version) ?? []
  if (versionFiles.length !== 1) {
    throw new Error(`Expected exactly one current migration file for ${version}; found ${versionFiles.length}`)
  }
  const file = versionFiles[0]
  const old = oldByFile.get(file)
  if (old) {
    refreshed.push({ ...old, git_blob_sha: blobSha.get(file) })
    continue
  }
  if (approvedByVersion.has(version)) {
    refreshed.push({
      version,
      file,
      git_blob_sha: blobSha.get(file),
      classification: 'approved',
      reason_code: 'elite_digest_approved',
      live_equivalent_versions: [],
    })
    continue
  }
  if (version === targetVersion) {
    refreshed.push({
      version,
      file,
      git_blob_sha: blobSha.get(file),
      classification: 'separately_authorized',
      reason_code: 'independent_release_not_authorized',
      live_equivalent_versions: [],
    })
    continue
  }
  refreshed.push({
    version,
    file,
    git_blob_sha: blobSha.get(file),
    classification: 'requiring_forward_reconciliation',
    reason_code: 'fresh_snapshot_requires_disposition',
    live_equivalent_versions: [],
  })
}

const oldLive = new Map((current.live_only_reconciliation ?? []).map((record) => [record.version, record]))
const newLiveNames = {
  '20260810220951': 'noop_marker_do_not_use',
  '20260810221004': 'pr1307_media_rollout_verifier',
}
const liveOnly = manifest.applied_not_committed.map(
  (version) => oldLive.get(version) ?? ({ version, name: newLiveNames[version] ?? 'name_not_recovered_in_snapshot' }),
)

const next = {
  ...current,
  status: 'HOLD',
  snapshot: {
    source_commit: '663ecd21b1e1961a5dba5c0ce4f9f1d55f80ee19',
    source_tree: '8ec9c637b47c9e741468cb5e3634384283163ae5',
    workflow_run_id: 31440312872,
    artifact_id: 9082634796,
    artifact_sha256: '530fc65b9b52db7c367a873e14f335fa046a60c2220f8879739c63099117d8c7',
    repository_migration_files: files.length,
    repository_unique_versions: manifest.counts.repository_versions,
    live_versions: manifest.counts.remote_versions,
    repository_only_versions: manifest.counts.committed_not_applied,
    repository_only_files: refreshed.length,
    live_only_versions: manifest.counts.applied_not_committed,
    duplicate_repository_versions: manifest.duplicate_repository_versions.map((entry) => entry.version),
    pending_duplicate_versions: manifest.pending_duplicate_versions.map((entry) => entry.version),
    invalid_filenames: manifest.invalid_migration_filenames,
  },
  reason_codes: {
    ...current.reason_codes,
    fresh_snapshot_requires_disposition:
      'Fresh repository-versus-live evidence surfaced this repository-only migration after the prior decision baseline; explicit release disposition is required before any production activation.',
  },
  repository_only_decisions: refreshed,
  live_only_reconciliation: liveOnly,
}

const target = refreshed.find((record) => record.version === targetVersion)
if (!target || target.file !== '20260810222500_harden_edge_function_cron_auth.sql') {
  throw new Error('Target auth-hardening migration is missing from refreshed decisions')
}
if (target.classification !== 'separately_authorized') {
  throw new Error('Target auth-hardening migration must remain separately_authorized')
}
if (JSON.stringify(next.elite_digest_allowlist_unchanged) !== JSON.stringify(current.elite_digest_allowlist_unchanged)) {
  throw new Error('Elite Digest allowlist changed unexpectedly')
}

fs.writeFileSync(outputPath, `${JSON.stringify(next, null, 2)}\n`)
console.log(`Refreshed ${refreshed.length} repository-only file decisions and ${liveOnly.length} live-only records.`)
