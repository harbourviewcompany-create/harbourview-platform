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
