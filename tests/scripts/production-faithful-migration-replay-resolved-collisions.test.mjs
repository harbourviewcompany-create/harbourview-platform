import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { planReplayVersionCollisionRenames } from '../../scripts/prepare-production-faithful-migration-replay.mjs'

const root = process.cwd()
const migrationFiles = fs.readdirSync(path.join(root, 'supabase/migrations')).filter((file) => file.endsWith('.sql'))

const australiaSource = '20260813010000_extend_supply_catalog_equipment_to_australia.sql'
const australiaSibling = '20260813010000_baseline_capture_pipeline_task_queue.sql'
const australiaResolved = '20260813010001_extend_supply_catalog_equipment_to_australia.sql'
const australiaBoundary = '20260813020000_baseline_capture_reporting_and_triggers.sql'

const heatmapSource = '20260820120000_heatmap_conflict_freeze_seed.sql'
const clinicalSibling = '20260820120000_clinical_pilot_local_authorities_au_gb_br.sql'
const heatmapBoundary = '20260820130000_hv_pipeline_optimization.sql'

test('resolved repository tree no longer requires duplicate-version replay renames', () => {
  assert.equal(migrationFiles.includes(australiaSource), false)
  assert.equal(migrationFiles.includes(australiaResolved), true)
  assert.equal(migrationFiles.includes(clinicalSibling), false)
  assert.deepEqual(planReplayVersionCollisionRenames({ migrationFiles }), [])
})

// Body assertions inherited from the superseded
// 'replay disambiguates independent duplicate-version migrations without
// dropping any body' test in production-faithful-migration-replay.test.mjs.
// That test compared the PLANNED rename list against the raw constant, which
// stopped being true once #1623 resolved both collisions in the repository
// itself, so it was removed. Its point — that resolving the collisions moved
// no SQL and lost no body — is still worth asserting, against the files that
// exist after the resolution.
test('resolving the collisions preserved every migration body', () => {
  const read = (file) => fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8')

  // Renamed R100 by #1623 (byte-identical move from ...010000 to ...010001).
  const australia = read(australiaResolved)
  assert.match(australia, /update public\.listings/i)
  assert.match(australia, /repository-only pending/i)

  // The sibling that forced the rename is untouched and still creates both tables.
  const sibling = read(australiaSibling)
  assert.match(sibling, /create table public\.pipeline_tasks/i)
  assert.match(sibling, /create table public\.dead_letter_tasks/i)

  // The heatmap seed kept its version; its colliding partner was withdrawn.
  const heatmap = read(heatmapSource)
  assert.match(heatmap, /create or replace function public\.roll_up_market_access_status/i)
  assert.match(heatmap, /rejected_conflict/i)
})

test('historical duplicate-version replay rules still activate only for the exact old collisions', () => {
  assert.deepEqual(
    planReplayVersionCollisionRenames({
      migrationFiles: [australiaSource, australiaSibling, australiaBoundary],
    }),
    [
      {
        source: australiaSource,
        sibling: australiaSibling,
        destination: '20260813010001_replay_extend_supply_catalog_equipment_to_australia.sql',
        before: australiaBoundary,
      },
    ],
  )

  assert.deepEqual(
    planReplayVersionCollisionRenames({
      migrationFiles: [heatmapSource, clinicalSibling, heatmapBoundary],
    }),
    [
      {
        source: heatmapSource,
        sibling: clinicalSibling,
        destination: '20260820120001_replay_heatmap_conflict_freeze_seed.sql',
        before: heatmapBoundary,
      },
    ],
  )
})
