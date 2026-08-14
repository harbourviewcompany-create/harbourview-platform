#!/usr/bin/env node

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const BASELINE_SOURCE_SHA = '04e306d520d69d746a5099bf778dc253296710a3'
const CLASSIFICATION_FILE = 'supabase/release-controls/release-closure-migration-classification-20260814.json'
const RELEASE_CONTROL_FILE = 'supabase/release-controls/elite-digest-production-activation.json'

function gitBlobSha(filePath) {
  const content = fs.readFileSync(filePath)
  return crypto
    .createHash('sha1')
    .update(Buffer.concat([Buffer.from(`blob ${content.length}\0`), content]))
    .digest('hex')
}

function migrationFilesByVersion(migrationDirectory) {
  const byVersion = new Map()
  for (const file of fs.readdirSync(migrationDirectory).filter((name) => name.endsWith('.sql'))) {
    const version = file.slice(0, 14)
    const files = byVersion.get(version) ?? []
    files.push(file)
    byVersion.set(version, files)
  }
  return byVersion
}

export function validateReleaseClosureClassification({ classification, releaseControl, migrationDirectory }) {
  const errors = []
  const approved = classification.approved_pending ?? []
  const deferred = classification.intentionally_deferred ?? []
  const retired = classification.superseded_retired ?? []
  const candidate = classification.new_release_closure_candidate
  const byVersion = migrationFilesByVersion(migrationDirectory)

  if (classification.status !== 'HOLD') errors.push('classification status must remain HOLD before production authorization')
  if (classification.baseline?.source_sha !== BASELINE_SOURCE_SHA) errors.push('baseline source SHA changed')

  const expectedCounts = classification.baseline ?? {}
  if (approved.length !== expectedCounts.approved_pending) errors.push('approved_pending count mismatch')
  if (deferred.length !== expectedCounts.intentionally_deferred) errors.push('intentionally_deferred count mismatch')
  if (retired.length !== expectedCounts.superseded_retired) errors.push('superseded_retired count mismatch')
  if (approved.length + deferred.length + retired.length !== expectedCounts.repository_pending_versions) {
    errors.push('baseline classification does not sum to repository_pending_versions')
  }
  if (expectedCounts.repository_pending_versions !== 88) errors.push('August 14 baseline must contain exactly 88 pending versions')
  if (deferred.length !== 84) errors.push('August 14 unresolved set must classify exactly 84 versions as intentionally deferred')

  const canonicalApproved = releaseControl.approved_migrations ?? []
  if (JSON.stringify(approved) !== JSON.stringify(canonicalApproved.map((item) => ({ ...item, evidence: RELEASE_CONTROL_FILE })))) {
    errors.push('approved_pending entries do not exactly match the canonical release control')
  }

  const flattened = [
    ...approved.map((item) => item.version),
    ...deferred,
    ...retired.map((item) => item.version),
  ]
  if (new Set(flattened).size !== flattened.length) errors.push('baseline migration classifications overlap')

  for (const version of flattened) {
    const files = byVersion.get(version) ?? []
    if (files.length !== 1) errors.push(`baseline version ${version} must map to exactly one repository migration file`)
  }

  for (const item of approved) {
    const filePath = path.join(migrationDirectory, item.file)
    if (!fs.existsSync(filePath)) errors.push(`approved migration missing: ${item.file}`)
    else if (gitBlobSha(filePath) !== item.git_blob_sha) errors.push(`approved migration blob mismatch: ${item.file}`)
  }

  if (retired.length !== 1 || retired[0]?.version !== '20260730110000') {
    errors.push('20260730110000 must be the verified superseded/retired baseline migration')
  }
  if (!String(retired[0]?.evidence ?? '').includes('SUPERSEDED pre-HNSW body')) {
    errors.push('20260730110000 supersession evidence is missing')
  }

  if (!candidate || candidate.version !== '20260814124500') errors.push('release-closure security migration candidate is missing')
  if (candidate?.production_authorized !== false) errors.push('release-closure security migration must not be production-authorized by this branch')
  if (candidate) {
    const candidatePath = path.join(migrationDirectory, candidate.file)
    if (!fs.existsSync(candidatePath)) errors.push(`candidate migration missing: ${candidate.file}`)
    else if (gitBlobSha(candidatePath) !== candidate.git_blob_sha) errors.push(`candidate migration blob mismatch: ${candidate.file}`)
    if (flattened.includes(candidate.version)) errors.push('new release-closure candidate must remain outside the historical 88-version baseline')
  }

  return errors
}

export function runValidation({ repositoryRoot = process.cwd() } = {}) {
  const classification = JSON.parse(fs.readFileSync(path.join(repositoryRoot, CLASSIFICATION_FILE), 'utf8'))
  const releaseControl = JSON.parse(fs.readFileSync(path.join(repositoryRoot, RELEASE_CONTROL_FILE), 'utf8'))
  const errors = validateReleaseClosureClassification({
    classification,
    releaseControl,
    migrationDirectory: path.join(repositoryRoot, 'supabase/migrations'),
  })
  if (errors.length) throw new Error(`Release-closure migration classification validation failed:\n- ${errors.join('\n- ')}`)
  return {
    baselinePending: classification.baseline.repository_pending_versions,
    approvedPending: classification.approved_pending.length,
    intentionallyDeferred: classification.intentionally_deferred.length,
    supersededRetired: classification.superseded_retired.length,
    candidateVersion: classification.new_release_closure_candidate.version,
  }
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirect) {
  try {
    const result = runValidation()
    console.log(
      `Release-closure migration classification verified: ${result.baselinePending} baseline pending = ${result.approvedPending} approved + ${result.intentionallyDeferred} deferred + ${result.supersededRetired} retired; candidate ${result.candidateVersion} remains unauthorized.`,
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
