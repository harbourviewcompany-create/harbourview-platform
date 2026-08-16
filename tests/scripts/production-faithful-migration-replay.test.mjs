import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import {
  planReplayExclusions,
  planReplayRelocations,
} from '../../scripts/prepare-production-faithful-migration-replay.mjs'

const root = process.cwd()
const decisions = JSON.parse(
  fs.readFileSync(path.join(root, 'supabase/release-controls/pending-production-migration-decisions.json'), 'utf8'),
)
const migrationFiles = fs.readdirSync(path.join(root, 'supabase/migrations')).filter((file) => file.endsWith('.sql'))

const exclusions = planReplayExclusions({ decisions, migrationFiles })
const excludedVersions = new Set(exclusions.map((item) => item.version))
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

  const corridorSource = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260701230000_corridor_intelligence_tables_stub.sql'),
    'utf8',
  )
  assert.match(corridorSource, /reconstructed from the live production catalog for zero-state migration replay/i)
  assert.match(corridorSource, /repository-only replay-fidelity repair and is not a production migration/i)

  const listingsSource = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260730220050_reconcile_listings_production_columns.sql'),
    'utf8',
  )
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
  assert.deepEqual(
    planReplayRelocations({ migrationFiles: ['20260730220050_reconcile_listings_production_columns.sql'] }),
    [],
  )
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
