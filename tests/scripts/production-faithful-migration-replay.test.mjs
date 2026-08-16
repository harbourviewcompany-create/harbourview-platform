import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import {
  planReplayExclusions,
  planReplayRelocations,
  planReplayZeroStateSkips,
} from '../../scripts/prepare-production-faithful-migration-replay.mjs'

const root = process.cwd()
const decisions = JSON.parse(
  fs.readFileSync(path.join(root, 'supabase/release-controls/pending-production-migration-decisions.json'), 'utf8'),
)
const migrationFiles = fs.readdirSync(path.join(root, 'supabase/migrations')).filter((file) => file.endsWith('.sql'))

const exclusions = planReplayExclusions({ decisions, migrationFiles })
const excludedVersions = new Set(exclusions.map((item) => item.version))
const zeroStateSkips = planReplayZeroStateSkips({ migrationFiles })
const relocations = planReplayRelocations({ migrationFiles })

test('replay handles duplicate aliases only while their repository files still exist', () => {
  for (const [aliasVersion, canonicalVersion] of [
    ['20260728000000', '20260728191340'],
    ['20260728010000', '20260728192052'],
    ['20260728020000', '20260729021820'],
  ]) {
    const aliasPresent = migrationFiles.some((file) => file.startsWith(`${aliasVersion}_`))
    const canonicalPresent = migrationFiles.some((file) => file.startsWith(`${canonicalVersion}_`))
    assert.equal(canonicalPresent, true)
    if (aliasPresent) {
      assert.equal(excludedVersions.has(aliasVersion), true)
      const exclusion = exclusions.find((item) => item.version === aliasVersion)
      assert.ok(exclusion.repository_equivalent_versions.includes(canonicalVersion))
    } else {
      assert.equal(excludedVersions.has(aliasVersion), false)
    }
  }
})

test('planner does not exclude an alias when its canonical live-version file is absent', () => {
  const synthetic = {
    repository_only_decisions: [
      {
        version: '20990101000000',
        file: '20990101000000_stand_in.sql',
        reason_code: 'exact_live_name_different_version',
        live_equivalent_versions: ['20990101000001'],
      },
    ],
  }

  assert.deepEqual(
    planReplayExclusions({ decisions: synthetic, migrationFiles: ['20990101000000_stand_in.sql'] }),
    [],
  )
})

test('every exclusion is backed by exact-live-name-different-version control evidence', () => {
  const decisionsByVersion = new Map(
    (decisions.repository_only_decisions ?? []).map((decision) => [decision.version, decision]),
  )

  for (const exclusion of exclusions) {
    const decision = decisionsByVersion.get(exclusion.version)
    assert.equal(decision.reason_code, 'exact_live_name_different_version')
    assert.ok(exclusion.repository_equivalent_versions.length > 0)
    for (const equivalentVersion of exclusion.repository_equivalent_versions) {
      assert.ok(migrationFiles.some((file) => file.startsWith(`${equivalentVersion}_`)))
    }
  }
})

test('zero-state replay skips only evidenced production-only repair and duplicate registration files', () => {
  assert.deepEqual(zeroStateSkips, [
    '20260714095121_revert_regulatory_signals_orphaned_constraint_drift.sql',
    '20260714224152_create_intel_eval_set_stage0.sql',
    '20260714225601_expose_intel_eval_set_via_api_schema.sql',
    '20260715085610_fix_stale_api_signals_view_missing_reviewer_columns.sql',
  ])

  const originalRegulatory = fs.readFileSync(path.join(root, 'supabase/migrations/20260312000000_regulatory_signals_v1.sql'), 'utf8')
  const noOpTwin = fs.readFileSync(path.join(root, 'supabase/migrations/20260714094735_revert_regulatory_signals_orphaned_constraint_drift.sql'), 'utf8')
  const reconstructedRepair = fs.readFileSync(path.join(root, 'supabase/migrations/20260714095121_revert_regulatory_signals_orphaned_constraint_drift.sql'), 'utf8')
  const canonicalEval = fs.readFileSync(path.join(root, 'supabase/migrations/20260714120000_create_intel_eval_set_stage0.sql'), 'utf8')
  const duplicateEval = fs.readFileSync(path.join(root, 'supabase/migrations/20260714224152_create_intel_eval_set_stage0.sql'), 'utf8')
  const canonicalApi = fs.readFileSync(path.join(root, 'supabase/migrations/20260714120100_expose_intel_eval_set_via_api_schema.sql'), 'utf8')
  const widenedApi = fs.readFileSync(path.join(root, 'supabase/migrations/20260714120300_expose_needs_human_in_eval_view.sql'), 'utf8')
  const duplicateApi = fs.readFileSync(path.join(root, 'supabase/migrations/20260714225601_expose_intel_eval_set_via_api_schema.sql'), 'utf8')
  const canonicalSignalsView = fs.readFileSync(path.join(root, 'supabase/migrations/20260715085540_fix_stale_api_signals_view_missing_reviewer_columns.sql'), 'utf8')
  const reconstructedSignalsView = fs.readFileSync(path.join(root, 'supabase/migrations/20260715085610_fix_stale_api_signals_view_missing_reviewer_columns.sql'), 'utf8')

  assert.match(originalRegulatory, /constraint regulatory_signals_slug_not_empty/i)
  assert.match(originalRegulatory, /constraint regulatory_signals_private_summary_not_empty/i)
  assert.match(originalRegulatory, /constraint regulatory_signals_source_url_not_empty/i)
  assert.match(originalRegulatory, /constraint regulatory_signals_publication_gate/i)
  assert.match(noOpTwin, /exact restoration was already applied to production under the\s*-- neighboring version 20260714095121/i)
  assert.match(reconstructedRepair, /Reconstructed from production/i)
  assert.match(reconstructedRepair, /repository-only repair of replay fidelity/i)

  assert.match(canonicalEval, /production-recorded statement for version\s*-- 20260714224152, the duplicate registration of this same migration/i)
  assert.match(canonicalEval, /20260714224152 stays a no-op: by the time replay\s*-- reaches it the table exists/i)
  assert.match(duplicateEval, /Reconstructed from production/i)
  assert.match(duplicateEval, /create table public\.intel_eval_set/i)

  assert.match(canonicalApi, /real work was already applied to production under\s*-- the neighboring version 20260714225601/i)
  assert.match(widenedApi, /drop view if exists api\.intel_eval_labeling/i)
  assert.match(widenedApi, /create view api\.intel_eval_labeling/i)
  assert.match(duplicateApi, /Reconstructed from production/i)
  assert.match(duplicateApi, /create view api\.intel_eval_labeling/i)

  assert.match(canonicalSignalsView, /real work was already applied to production under the neighboring\s*-- version 20260715085610/i)
  assert.match(canonicalSignalsView, /cannot drop columns from view/i)
  assert.match(reconstructedSignalsView, /Reconstructed from production/i)
  assert.match(reconstructedSignalsView, /create or replace view api\.signals/i)
})

test('zero-state skips are suppressed when their exact historical files are absent', () => {
  assert.deepEqual(planReplayZeroStateSkips({ migrationFiles: [] }), [])
  assert.deepEqual(
    planReplayZeroStateSkips({ migrationFiles: ['20260715085610_fix_stale_api_signals_view_missing_reviewer_columns.sql'] }),
    ['20260715085610_fix_stale_api_signals_view_missing_reviewer_columns.sql'],
  )
})

test('replay relocates only evidenced reconstruction files before their first dependencies', () => {
  assert.deepEqual(relocations, [
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
  ])

  const corridorSource = fs.readFileSync(path.join(root, 'supabase/migrations/20260701230000_corridor_intelligence_tables_stub.sql'), 'utf8')
  assert.match(corridorSource, /reconstructed from the live production catalog for zero-state migration replay/i)
  assert.match(corridorSource, /repository-only replay-fidelity repair and is not a production migration/i)

  const listingsSource = fs.readFileSync(path.join(root, 'supabase/migrations/20260730220050_reconcile_listings_production_columns.sql'), 'utf8')
  assert.match(listingsSource, /shape was established entirely outside recorded history/i)
  assert.match(listingsSource, /below is taken from the live catalog \(pg_attribute \/ pg_get_expr\), not\s*-- inferred/i)
})

test('replay relocation is suppressed unless source, destination boundary and ordering evidence are all present', () => {
  assert.deepEqual(
    planReplayRelocations({
      migrationFiles: [
        '20260730220050_reconcile_listings_production_columns.sql',
        '20260730211140_replay_reconcile_listings_production_columns.sql',
        '20260730211147_create_supply_catalog_public_view.sql',
      ],
    }),
    [],
  )
  assert.deepEqual(planReplayRelocations({ migrationFiles: ['20260730220050_reconcile_listings_production_columns.sql'] }), [])
  assert.deepEqual(
    planReplayRelocations({
      migrationFiles: [
        '20260701230000_corridor_intelligence_tables_stub.sql',
        '20260701180750_replay_corridor_intelligence_tables_stub.sql',
        '20260701180751_remote_applied_repair.sql',
      ],
    }),
    [],
  )
})
