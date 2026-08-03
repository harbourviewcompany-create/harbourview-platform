#!/usr/bin/env node

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ALLOWED_CLASSIFICATIONS = new Set([
  'approved',
  'separately_authorized',
  'obsolete',
  'requiring_forward_reconciliation',
])

function gitBlobSha(filePath) {
  const content = fs.readFileSync(filePath)
  return crypto
    .createHash('sha1')
    .update(Buffer.concat([Buffer.from(`blob ${content.length}\0`), content]))
    .digest('hex')
}

export function validateDecisionData({ decision, releaseControl, migrationDirectory }) {
  const errors = []
  const records = decision.repository_only_decisions ?? []
  const liveOnly = decision.live_only_reconciliation ?? []
  const allowlist = decision.elite_digest_allowlist_unchanged ?? []
  const canonicalAllowlist = releaseControl.approved_migrations ?? []

  if ((decision.status ?? decision.activation_status) !== 'HOLD') {
    errors.push('status must remain HOLD')
  }
  if (JSON.stringify(allowlist) !== JSON.stringify(canonicalAllowlist)) {
    errors.push('embedded Elite Digest allowlist differs from the canonical release-control file')
  }

  const recordFiles = new Set()
  for (const record of records) {
    if (!ALLOWED_CLASSIFICATIONS.has(record.classification)) {
      errors.push(`unsupported classification for ${record.file}: ${record.classification}`)
    }
    if (recordFiles.has(record.file)) errors.push(`duplicate decision record for ${record.file}`)
    recordFiles.add(record.file)

    const filePath = path.join(migrationDirectory, record.file)
    if (!fs.existsSync(filePath)) {
      errors.push(`decision file is absent: ${record.file}`)
      continue
    }
    const actual = gitBlobSha(filePath)
    if (actual !== record.git_blob_sha) {
      errors.push(`Git blob mismatch for ${record.file}: expected ${record.git_blob_sha}, got ${actual}`)
    }
    if (record.version !== record.file.slice(0, 14)) {
      errors.push(`version/file mismatch for ${record.file}`)
    }
  }

  if (records.length !== decision.snapshot?.repository_only_files) {
    errors.push(
      `repository-only file count mismatch: snapshot=${decision.snapshot?.repository_only_files}, records=${records.length}`,
    )
  }
  const uniqueVersions = new Set(records.map((record) => record.version))
  if (uniqueVersions.size !== decision.snapshot?.repository_only_versions) {
    errors.push(
      `repository-only version count mismatch: snapshot=${decision.snapshot?.repository_only_versions}, records=${uniqueVersions.size}`,
    )
  }
  if (liveOnly.length !== decision.snapshot?.live_only_versions) {
    errors.push(
      `live-only count mismatch: snapshot=${decision.snapshot?.live_only_versions}, records=${liveOnly.length}`,
    )
  }
  if (new Set(liveOnly.map((record) => record.version)).size !== liveOnly.length) {
    errors.push('live-only reconciliation versions must be unique')
  }

  const approvedRecords = records
    .filter((record) => record.classification === 'approved')
    .map(({ version, file, git_blob_sha }) => ({ version, file, git_blob_sha }))
  if (JSON.stringify(approvedRecords) !== JSON.stringify(canonicalAllowlist)) {
    errors.push('approved decision records do not exactly equal the three-file Elite Digest allowlist')
  }

  for (const version of ['20260731120000', '20260801150000', '20260802080000']) {
    const matches = records.filter((record) => record.version === version)
    if (matches.length !== 1) errors.push(`expected exactly one decision for ${version}`)
    else if (matches[0].classification !== 'separately_authorized') {
      errors.push(`${version} must remain classified separately_authorized`)
    }
  }

  if (decision.environment_verification?.result !== 'HTTP 404 Not Found') {
    errors.push('environment evidence must record the observed HTTP 404 result')
  }
  if (!String(decision.environment_verification?.interpretation ?? '').startsWith('inconclusive')) {
    errors.push('environment result must remain explicitly inconclusive until an admin-authorized read succeeds')
  }

  return errors
}

export function runValidation({ repositoryRoot = process.cwd() } = {}) {
  const decisionPath = path.join(
    repositoryRoot,
    'supabase/release-controls/pending-production-migration-decisions.json',
  )
  const releaseControlPath = path.join(
    repositoryRoot,
    'supabase/release-controls/elite-digest-production-activation.json',
  )
  const decision = JSON.parse(fs.readFileSync(decisionPath, 'utf8'))
  const releaseControl = JSON.parse(fs.readFileSync(releaseControlPath, 'utf8'))
  const errors = validateDecisionData({
    decision,
    releaseControl,
    migrationDirectory: path.join(repositoryRoot, 'supabase/migrations'),
  })
  if (errors.length > 0) {
    throw new Error(`Pending production migration decision validation failed:\n- ${errors.join('\n- ')}`)
  }
  return {
    repositoryOnlyFiles: decision.repository_only_decisions.length,
    repositoryOnlyVersions: decision.snapshot.repository_only_versions,
    liveOnlyVersions: decision.live_only_reconciliation.length,
    activationStatus: decision.status ?? decision.activation_status,
  }
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirect) {
  try {
    const result = runValidation()
    console.log(
      `Pending migration decisions verified: ${result.repositoryOnlyFiles} files / ${result.repositoryOnlyVersions} versions, ${result.liveOnlyVersions} live-only versions, activation ${result.activationStatus}.`,
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
