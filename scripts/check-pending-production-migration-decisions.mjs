#!/usr/bin/env node

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import {
  buildManifest,
  parseSupabaseMigrationList,
  readRepositoryMigrations,
} from './migration-ledger-manifest.mjs'

const ALLOWED_CLASSIFICATIONS = new Set([
  'approved',
  'separately_authorized',
  'obsolete',
  'requiring_forward_reconciliation',
])

const EXPECTED_PROVENANCE = Object.freeze({
  repository_commit: '7134bb6cd696779b3429d98272ce1e3cd7e8236c',
  repository_tree: 'c50c393d3b61052886030a16e296f44cf53d75d8',
  control_base_commit: 'f7a28c0e78b0ce693eded1dd7284731b7c3b3d43',
  workflow_run_id: 30766999778,
  artifact_id: 8839263343,
  artifact_sha256: '0fd8a01b6e85e5da2533dbd67a4a74023fddd17cb860e3f27fa271ee0ced12ee',
  source_archive_sha256: '341ecc4e609ee6807b4b08c6eb9dcdd37e76d62cff3f4ab4469fcf0fb438b927',
})

const SHA256_RE = /^[0-9a-f]{64}$/
const SHA1_RE = /^[0-9a-f]{40}$/
const VERSION_RE = /^\d{14}$/
const FORBIDDEN_EXPORT_KEYS = /(?:^|_)(?:secret|token|password|private_key|credential(?:s)?)(?:_value)?$/i
const FORBIDDEN_EXPORT_VALUES = /(?:github_pat_|gh[pousr]_|postgres(?:ql)?:\/\/[^\s]+:[^@\s]+@|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath))
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function canonicalSha256(value) {
  return sha256Buffer(Buffer.from(stableStringify(value)))
}

function exactJsonEqual(left, right) {
  return stableStringify(left) === stableStringify(right)
}

function sortedUnique(values) {
  return [...new Set(values)].sort()
}

function difference(left, right) {
  const rightSet = new Set(right)
  return left.filter((value) => !rightSet.has(value))
}

function inspectRedactedExport(value, pathParts = [], errors = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => inspectRedactedExport(entry, [...pathParts, String(index)], errors))
    return errors
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      const currentPath = [...pathParts, key]
      if (FORBIDDEN_EXPORT_KEYS.test(key)) {
        errors.push(`verified environment export contains forbidden key: ${currentPath.join('.')}`)
      }
      inspectRedactedExport(entry, currentPath, errors)
    }
    return errors
  }
  if (typeof value === 'string' && FORBIDDEN_EXPORT_VALUES.test(value)) {
    errors.push(`verified environment export contains a credential-like value at ${pathParts.join('.')}`)
  }
  return errors
}

export function validateEnvironmentEvidence(environment) {
  const errors = []
  if (environment?.version !== 1) errors.push('environment evidence version must be 1')
  if (environment?.repository !== 'harbourviewcompany-create/harbourview-platform') {
    errors.push('environment evidence repository is incorrect')
  }
  if (environment?.environment_name !== 'production-database') {
    errors.push('environment name must be production-database')
  }
  if (environment?.authoritative_for_activation !== true) {
    errors.push('environment evidence must be authoritative_for_activation')
  }

  if (environment?.status === 'unverified') {
    if (environment.verified_export !== null) {
      errors.push('unverified environment evidence must not contain a verified export')
    }
    if (environment?.administration_path?.redacted_export_obtained !== false) {
      errors.push('unverified environment evidence must record redacted_export_obtained=false')
    }
    if (environment?.last_probe?.result !== 'HTTP 404 Not Found') {
      errors.push('unverified environment evidence must retain the observed HTTP 404 result')
    }
    if (environment?.last_probe?.interpretation !== 'inconclusive') {
      errors.push('unverified environment probe must remain explicitly inconclusive')
    }
    return errors
  }

  if (environment?.status !== 'verified') {
    errors.push('environment status must be unverified or verified')
    return errors
  }

  if (environment?.administration_path?.redacted_export_obtained !== true) {
    errors.push('verified environment evidence requires a redacted Administration-authorized export')
  }
  const verified = environment.verified_export
  if (!verified || typeof verified !== 'object') {
    errors.push('verified environment evidence is missing verified_export')
    return errors
  }
  inspectRedactedExport(verified, ['verified_export'], errors)
  if (verified.authorization !== 'administration_read') {
    errors.push('verified export authorization must be administration_read')
  }
  if (verified.environment_name !== 'production-database') {
    errors.push('verified export environment name is incorrect')
  }
  if (!Number.isInteger(verified.required_reviewer_count) || verified.required_reviewer_count < 1) {
    errors.push('verified export must prove at least one required reviewer')
  }
  const reviewerProofs = verified.required_reviewer_proof_sha256
  if (
    !Array.isArray(reviewerProofs) ||
    reviewerProofs.length !== verified.required_reviewer_count ||
    reviewerProofs.some((value) => !SHA256_RE.test(value)) ||
    new Set(reviewerProofs).size !== reviewerProofs.length
  ) {
    errors.push('verified export reviewer proofs must be unique redacted SHA-256 values')
  }
  if (verified.prevent_self_review !== true) {
    errors.push('verified export must prove prevent_self_review=true')
  }
  const policy = verified.deployment_branch_policy
  if (policy?.custom_branch_policies !== true || policy?.protected_branches !== false) {
    errors.push('verified export must prove custom branch policies only')
  }
  if (!exactJsonEqual(policy?.allowed_branches, ['main'])) {
    errors.push('verified export must permit exactly the main branch')
  }
  if (!exactJsonEqual(policy?.allowed_tags, [])) {
    errors.push('verified export must not permit tag patterns')
  }
  if (verified.secret_values_redacted !== true) {
    errors.push('verified export must explicitly confirm secret value redaction')
  }
  return errors
}

export function validateDecisionData({
  decision,
  integrity,
  environment,
  releaseControl,
  repository,
  parsedRemote,
  artifactManifest,
  artifactManifestSha256,
  remoteMigrationsSha256,
}) {
  const errors = []
  const records = decision.repository_only_decisions ?? []
  const liveOnlyRecords = decision.live_only_reconciliation ?? []
  const canonicalAllowlist = releaseControl.approved_migrations ?? []

  if ((decision.status ?? decision.activation_status) !== 'HOLD') {
    errors.push('decision status must remain HOLD')
  }
  if (integrity.status !== 'HOLD') errors.push('integrity status must remain HOLD')

  for (const [key, expected] of Object.entries(EXPECTED_PROVENANCE)) {
    if (integrity.source?.[key] !== expected) {
      errors.push(`source provenance mismatch for ${key}`)
    }
  }
  for (const field of [
    'artifact_manifest_sha256',
    'remote_migrations_sha256',
    'source_archive_sha256',
    'repository_snapshot_sha256',
    'remote_versions_sha256',
  ]) {
    if (!SHA256_RE.test(integrity.source?.[field] ?? '')) {
      errors.push(`source provenance ${field} must be a SHA-256 value`)
    }
  }
  if (integrity.source?.artifact_manifest_sha256 !== artifactManifestSha256) {
    errors.push('artifact manifest SHA-256 does not match the committed evidence file')
  }
  if (integrity.source?.remote_migrations_sha256 !== remoteMigrationsSha256) {
    errors.push('remote migration ledger SHA-256 does not match the committed evidence file')
  }
  if (integrity.source?.repository_snapshot_sha256 !== canonicalSha256(integrity.repository_migrations)) {
    errors.push('repository snapshot SHA-256 is invalid')
  }
  if (integrity.source?.remote_versions_sha256 !== canonicalSha256(integrity.remote_versions)) {
    errors.push('remote version snapshot SHA-256 is invalid')
  }

  const currentRepositoryRecords = repository.files.map((file) => ({
    version: file.slice(0, 14),
    file,
    git_blob_sha: repository.gitBlobShaByFile[file],
  }))
  if (!exactJsonEqual(integrity.repository_migrations, currentRepositoryRecords)) {
    errors.push('complete repository migration snapshot differs from the current migration directory')
  }
  if (!exactJsonEqual(integrity.remote_versions, parsedRemote.remoteVersions)) {
    errors.push('complete remote version snapshot differs from the committed linked-ledger evidence')
  }

  if (artifactManifest.source_sha !== EXPECTED_PROVENANCE.repository_commit) {
    errors.push('artifact manifest source SHA is not the bound source commit')
  }
  if (!exactJsonEqual(artifactManifest.approved_migrations, canonicalAllowlist)) {
    errors.push('artifact manifest allowlist differs from the canonical release control')
  }

  const derivedManifest = buildManifest({
    repository,
    remote: parsedRemote,
    control: releaseControl,
    sourceSha: EXPECTED_PROVENANCE.repository_commit,
  })
  for (const key of [
    'applied_not_committed',
    'committed_not_applied',
    'approved_pending',
    'approved_already_applied',
    'unexpected_pending',
    'approved_file_mismatches',
    'duplicate_repository_versions',
    'pending_duplicate_versions',
    'invalid_migration_filenames',
  ]) {
    if (!exactJsonEqual(artifactManifest[key], derivedManifest[key])) {
      errors.push(`artifact manifest ${key} differs from independently recomputed state`)
    }
  }
  if (!exactJsonEqual(artifactManifest.counts, derivedManifest.counts)) {
    errors.push('artifact manifest counts differ from independently recomputed state')
  }

  const localByVersion = repository.filesByVersion
  const expectedRepositoryOnlyFiles = derivedManifest.committed_not_applied
    .flatMap((version) => localByVersion[version] ?? [])
    .sort()
  const decisionFiles = records.map((record) => record.file).sort()
  if (!exactJsonEqual(decisionFiles, expectedRepositoryOnlyFiles)) {
    errors.push('decision records do not equal the complete recomputed repository-only file set')
  }

  const recordFiles = new Set()
  for (const record of records) {
    if (!ALLOWED_CLASSIFICATIONS.has(record.classification)) {
      errors.push(`unsupported classification for ${record.file}: ${record.classification}`)
    }
    if (recordFiles.has(record.file)) errors.push(`duplicate decision record for ${record.file}`)
    recordFiles.add(record.file)
    if (!VERSION_RE.test(record.version) || record.version !== record.file.slice(0, 14)) {
      errors.push(`version/file mismatch for ${record.file}`)
    }
    const actualBlob = repository.gitBlobShaByFile[record.file]
    if (!actualBlob || !SHA1_RE.test(record.git_blob_sha ?? '') || actualBlob !== record.git_blob_sha) {
      errors.push(`Git blob mismatch for ${record.file}`)
    }
  }

  const liveOnlyVersions = sortedUnique(liveOnlyRecords.map((record) => record.version))
  if (!exactJsonEqual(liveOnlyVersions, derivedManifest.applied_not_committed)) {
    errors.push('live-only reconciliation records do not equal the complete recomputed remote-only set')
  }
  if (liveOnlyRecords.length !== liveOnlyVersions.length) {
    errors.push('live-only reconciliation versions must be unique')
  }

  const approvedRecords = records
    .filter((record) => record.classification === 'approved')
    .map(({ version, file, git_blob_sha }) => ({ version, file, git_blob_sha }))
  if (!exactJsonEqual(approvedRecords, canonicalAllowlist)) {
    errors.push('approved decision records do not exactly equal the three-file Elite Digest allowlist')
  }
  if (!exactJsonEqual(decision.elite_digest_allowlist_unchanged, canonicalAllowlist)) {
    errors.push('embedded Elite Digest allowlist differs from the canonical release control')
  }

  const classificationCounts = Object.fromEntries(
    [...ALLOWED_CLASSIFICATIONS].map((classification) => [
      classification,
      records.filter((record) => record.classification === classification).length,
    ]),
  )
  const expectedCounts = {
    approved: 3,
    separately_authorized: 7,
    obsolete: 6,
    requiring_forward_reconciliation: 21,
  }
  if (!exactJsonEqual(classificationCounts, expectedCounts)) {
    errors.push('classification totals differ from the reviewed 3/7/6/21 decision set')
  }

  for (const version of ['20260731120000', '20260801150000', '20260802080000']) {
    const matches = records.filter((record) => record.version === version)
    if (matches.length !== 1) errors.push(`expected exactly one decision for ${version}`)
    else if (matches[0].classification !== 'separately_authorized') {
      errors.push(`${version} must remain classified separately_authorized`)
    }
  }

  if (!exactJsonEqual(decision.snapshot?.duplicate_repository_versions, ['20260722120000', '20260729000000'])) {
    errors.push('decision duplicate repository versions differ from recomputed evidence')
  }
  if (!exactJsonEqual(decision.snapshot?.pending_duplicate_versions, ['20260729000000'])) {
    errors.push('decision pending duplicate versions differ from recomputed evidence')
  }
  if (!exactJsonEqual(decision.snapshot?.invalid_filenames, [])) {
    errors.push('decision invalid filename list differs from recomputed evidence')
  }

  errors.push(...validateEnvironmentEvidence(environment))
  return errors
}

export function runValidation({ repositoryRoot = process.cwd() } = {}) {
  const decisionPath = path.join(repositoryRoot, 'supabase/release-controls/pending-production-migration-decisions.json')
  const integrityPath = path.join(repositoryRoot, 'supabase/release-controls/pending-production-migration-integrity.json')
  const environmentPath = path.join(repositoryRoot, 'supabase/release-controls/production-database-environment-evidence.json')
  const releaseControlPath = path.join(repositoryRoot, 'supabase/release-controls/elite-digest-production-activation.json')
  const integrity = readJson(integrityPath)
  const artifactManifestPath = path.join(repositoryRoot, integrity.evidence_files.artifact_manifest)
  const remoteMigrationsPath = path.join(repositoryRoot, integrity.evidence_files.remote_migrations)
  const decision = readJson(decisionPath)
  const environment = readJson(environmentPath)
  const releaseControl = readJson(releaseControlPath)
  const artifactManifest = readJson(artifactManifestPath)
  const parsedRemote = parseSupabaseMigrationList(fs.readFileSync(remoteMigrationsPath, 'utf8'))
  const repository = readRepositoryMigrations(path.join(repositoryRoot, 'supabase/migrations'))

  const errors = validateDecisionData({
    decision,
    integrity,
    environment,
    releaseControl,
    repository,
    parsedRemote,
    artifactManifest,
    artifactManifestSha256: sha256File(artifactManifestPath),
    remoteMigrationsSha256: sha256File(remoteMigrationsPath),
  })
  if (errors.length > 0) {
    throw new Error(`Pending production migration decision validation failed:\n- ${errors.join('\n- ')}`)
  }

  const localVersions = repository.versions
  const remoteVersions = parsedRemote.remoteVersions
  return {
    repositoryFiles: repository.files.length,
    repositoryVersions: localVersions.length,
    remoteVersions: remoteVersions.length,
    repositoryOnlyVersions: difference(localVersions, remoteVersions).length,
    liveOnlyVersions: difference(remoteVersions, localVersions).length,
    environmentStatus: environment.status,
    activationStatus: decision.status ?? decision.activation_status,
  }
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirect) {
  try {
    const result = runValidation()
    console.log(
      `Pending migration controls verified from complete evidence: ${result.repositoryFiles} files / ${result.repositoryVersions} versions, ${result.remoteVersions} remote versions, ${result.repositoryOnlyVersions} repository-only, ${result.liveOnlyVersions} live-only, environment ${result.environmentStatus}, activation ${result.activationStatus}.`,
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
