import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import {
  runValidation,
  validateDecisionData,
  validateEnvironmentEvidence,
} from '../../scripts/check-pending-production-migration-decisions.mjs'
import {
  parseSupabaseMigrationList,
  readRepositoryMigrations,
} from '../../scripts/migration-ledger-manifest.mjs'

const repositoryRoot = process.cwd()
const controlsDir = path.join(repositoryRoot, 'supabase/release-controls')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}
function clone(value) {
  return structuredClone(value)
}
function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}
function fixture() {
  const integrity = readJson(path.join(controlsDir, 'pending-production-migration-integrity.json'))
  const artifactManifestPath = path.join(repositoryRoot, integrity.evidence_files.artifact_manifest)
  const remoteMigrationsPath = path.join(repositoryRoot, integrity.evidence_files.remote_migrations)
  return {
    decision: readJson(path.join(controlsDir, 'pending-production-migration-decisions.json')),
    integrity,
    environment: readJson(path.join(controlsDir, 'production-database-environment-evidence.json')),
    releaseControl: readJson(path.join(controlsDir, 'elite-digest-production-activation.json')),
    repository: readRepositoryMigrations(path.join(repositoryRoot, 'supabase/migrations')),
    parsedRemote: parseSupabaseMigrationList(fs.readFileSync(remoteMigrationsPath, 'utf8')),
    artifactManifest: readJson(artifactManifestPath),
    artifactManifestSha256: sha256File(artifactManifestPath),
    remoteMigrationsSha256: sha256File(remoteMigrationsPath),
  }
}
function errorsFor(mutator) {
  const data = fixture()
  mutator(data)
  return validateDecisionData(data)
}

const expectedProvenanceFields = [
  'repository_commit',
  'repository_tree',
  'control_base_commit',
  'workflow_run_id',
  'artifact_id',
  'artifact_sha256',
  'source_archive_sha256',
]

test('current controls recompute the full repository and remote universes and remain HOLD', () => {
  const result = runValidation({ repositoryRoot })
  assert.deepEqual(result, {
    repositoryFiles: 784,
    repositoryVersions: 782,
    remoteVersions: 798,
    repositoryOnlyVersions: 36,
    liveOnlyVersions: 52,
    environmentStatus: 'unverified',
    activationStatus: 'HOLD',
  })
})

test('rejects every bound source commit, tree, run, artifact ID and artifact digest mutation', () => {
  for (const field of expectedProvenanceFields) {
    const errors = errorsFor(({ integrity }) => {
      integrity.source[field] = typeof integrity.source[field] === 'number' ? 1 : '0'.repeat(40)
    })
    assert.ok(errors.some((error) => error.includes(`source provenance mismatch for ${field}`)), field)
  }
})

test('rejects a coordinated repository-only decision removal even when self-reported counts are adjusted', () => {
  const errors = errorsFor(({ decision }) => {
    decision.repository_only_decisions.pop()
    decision.snapshot.repository_only_files -= 1
    decision.snapshot.repository_only_versions -= 1
  })
  assert.ok(errors.some((error) => error.includes('complete recomputed repository-only file set')))
})

test('rejects a coordinated live-only removal even when the self-reported count is adjusted', () => {
  const errors = errorsFor(({ decision }) => {
    decision.live_only_reconciliation.pop()
    decision.snapshot.live_only_versions -= 1
  })
  assert.ok(errors.some((error) => error.includes('complete recomputed remote-only set')))
})

test('rejects any missing, added or content-changed repository migration in the complete snapshot', () => {
  const missing = errorsFor(({ integrity }) => integrity.repository_migrations.pop())
  assert.ok(missing.some((error) => error.includes('complete repository migration snapshot')))

  const changed = errorsFor(({ integrity }) => {
    integrity.repository_migrations[0].git_blob_sha = '0'.repeat(40)
  })
  assert.ok(changed.some((error) => error.includes('repository snapshot SHA-256')))
  assert.ok(changed.some((error) => error.includes('complete repository migration snapshot')))
})

test('rejects remote ledger evidence or normalized remote-version drift', () => {
  const parsed = errorsFor(({ parsedRemote }) => parsedRemote.remoteVersions.pop())
  assert.ok(parsed.some((error) => error.includes('complete remote version snapshot')))

  const bound = errorsFor(({ integrity }) => integrity.remote_versions.pop())
  assert.ok(bound.some((error) => error.includes('remote version snapshot SHA-256')))
  assert.ok(bound.some((error) => error.includes('complete remote version snapshot')))
})

test('rejects artifact manifest drift even if a caller supplies the original file digest', () => {
  const errors = errorsFor(({ artifactManifest }) => artifactManifest.unexpected_pending.pop())
  assert.ok(errors.some((error) => error.includes('artifact manifest unexpected_pending')))
})

test('rejects altered Elite Digest bindings or classification broadening', () => {
  const allowlistErrors = errorsFor(({ decision }) => {
    decision.elite_digest_allowlist_unchanged[0].git_blob_sha = '0'.repeat(40)
  })
  assert.ok(allowlistErrors.some((error) => error.includes('embedded Elite Digest allowlist')))

  const classificationErrors = errorsFor(({ decision }) => {
    decision.repository_only_decisions.find(
      (record) => record.version === '20260802080000',
    ).classification = 'approved'
  })
  assert.ok(classificationErrors.some((error) => error.includes('approved decision records')))
  assert.ok(classificationErrors.some((error) => error.includes('20260802080000 must remain classified')))
})

test('rejects duplicate-prefix and invalid-filename evidence mutation', () => {
  const duplicateErrors = errorsFor(({ decision }) => {
    decision.snapshot.pending_duplicate_versions = []
  })
  assert.ok(duplicateErrors.some((error) => error.includes('pending duplicate versions')))

  const filenameErrors = errorsFor(({ decision }) => {
    decision.snapshot.invalid_filenames = ['invented.sql']
  })
  assert.ok(filenameErrors.some((error) => error.includes('invalid filename list')))
})

test('accepts the explicit unverified environment state and a fully redacted verified transition', () => {
  const current = fixture().environment
  assert.deepEqual(validateEnvironmentEvidence(current), [])

  const verified = clone(current)
  verified.status = 'verified'
  verified.administration_path.redacted_export_obtained = true
  verified.verified_export = {
    authorization: 'administration_read',
    captured_at: '2026-08-03T06:00:00Z',
    environment_name: 'production-database',
    required_reviewer_count: 2,
    required_reviewer_proof_sha256: ['1'.repeat(64), '2'.repeat(64)],
    prevent_self_review: true,
    deployment_branch_policy: {
      custom_branch_policies: true,
      protected_branches: false,
      allowed_branches: ['main'],
      allowed_tags: [],
    },
    secret_values_redacted: true,
  }
  assert.deepEqual(validateEnvironmentEvidence(verified), [])
})

test('rejects false-GO environment exports with no reviewers, self-review, extra branches, tags or credential material', () => {
  const current = fixture().environment
  function verified() {
    const value = clone(current)
    value.status = 'verified'
    value.administration_path.redacted_export_obtained = true
    value.verified_export = {
      authorization: 'administration_read',
      environment_name: 'production-database',
      required_reviewer_count: 1,
      required_reviewer_proof_sha256: ['1'.repeat(64)],
      prevent_self_review: true,
      deployment_branch_policy: {
        custom_branch_policies: true,
        protected_branches: false,
        allowed_branches: ['main'],
        allowed_tags: [],
      },
      secret_values_redacted: true,
    }
    return value
  }

  const cases = [
    ['reviewer', (value) => { value.verified_export.required_reviewer_count = 0; value.verified_export.required_reviewer_proof_sha256 = [] }],
    ['prevent_self_review', (value) => { value.verified_export.prevent_self_review = false }],
    ['main branch', (value) => { value.verified_export.deployment_branch_policy.allowed_branches.push('develop') }],
    ['tag patterns', (value) => { value.verified_export.deployment_branch_policy.allowed_tags.push('v*') }],
    ['forbidden key', (value) => { value.verified_export.secret_value = 'redacted' }],
    ['credential-like value', (value) => { value.verified_export.note = 'github_pat_example' }],
  ]
  for (const [label, mutate] of cases) {
    const value = verified()
    mutate(value)
    assert.notDeepEqual(validateEnvironmentEvidence(value), [], label)
  }
})

test('workflow is fail-closed, validates exact commit objects and pins security-sensitive actions', () => {
  const workflow = fs.readFileSync(
    path.join(repositoryRoot, '.github/workflows/pending-migration-decision-verification.yml'),
    'utf8',
  )
  assert.match(workflow, /actions\/checkout@11d5960a326750d5838078e36cf38b85af677262/)
  assert.match(workflow, /actions\/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020/)
  assert.doesNotMatch(workflow, /actions\/(?:checkout|setup-node)@v\d/)
  assert.match(workflow, /fetch-depth:\s*0/)
  assert.match(workflow, /persist-credentials:\s*false/)
  assert.match(workflow, /set -euo pipefail/)
  assert.match(workflow, /git cat-file -e "\$\{BASE_SHA\}\^\{commit\}"/)
  assert.match(workflow, /git cat-file -e "\$\{HEAD_SHA\}\^\{commit\}"/)
  assert.match(workflow, /git diff --name-only "\$BASE_SHA" "\$HEAD_SHA"/)
})

test('remediation evidence distinguishes automatic integrations from manual deployment actions', () => {
  const evidence = fs.readFileSync(
    path.join(repositoryRoot, 'docs/control/PENDING_PRODUCTION_MIGRATION_REMEDIATION_EVIDENCE_2026-08-02.md'),
    'utf8',
  )
  assert.match(evidence, /automatic repository integrations/i)
  assert.match(evidence, /no manual deployment/i)
  assert.doesNotMatch(evidence, /no deployment was created[,.]/i)
})
