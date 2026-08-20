import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import {
  planReplayContentPatches,
  planReplayExclusions,
  planReplayRelocations,
  planReplaySyntheticFoundations,
  planReplayVersionCollisionRenames,
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
const versionCollisionRenames = planReplayVersionCollisionRenames({ migrationFiles })
const syntheticFoundations = planReplaySyntheticFoundations({ migrationFiles })
const contentPatches = planReplayContentPatches({ migrationFiles })

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

test('zero-state replay skips only evidenced production-only, duplicate, and local-ID files', () => {
  assert.deepEqual(zeroStateSkips, [
    '20260714095121_revert_regulatory_signals_orphaned_constraint_drift.sql',
    '20260714224152_create_intel_eval_set_stage0.sql',
    '20260714225601_expose_intel_eval_set_via_api_schema.sql',
    '20260715085610_fix_stale_api_signals_view_missing_reviewer_columns.sql',
    '20260722182917_enable_hv_quality_pipeline_and_promote_crons.sql',
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

test('zero-state skips the production-local cron IDs only when the by-name successor remains', () => {
  const hardcoded = '20260722182917_enable_hv_quality_pipeline_and_promote_crons.sql'
  const byName = '20260722185015_resolve_quality_crons_by_name.sql'
  const planned = planReplayZeroStateSkips({ migrationFiles })

  assert.ok(planned.includes(hardcoded))

  const hardcodedSql = fs.readFileSync(path.join(root, 'supabase/migrations', hardcoded), 'utf8')
  const byNameSql = fs.readFileSync(path.join(root, 'supabase/migrations', byName), 'utf8')
  assert.match(hardcodedSql, /cron\.alter_job\(47, active => true\)/i)
  assert.match(hardcodedSql, /cron\.alter_job\(48, active => true\)/i)
  assert.match(byNameSql, /where jobname = 'hv-quality-pipeline'/i)
  assert.match(byNameSql, /where jobname = 'hv-quality-promote'/i)
  assert.match(byNameSql, /cron\.alter_job\(v_pipeline_id, active => true\)/i)
  assert.match(byNameSql, /cron\.alter_job\(v_promote_id, active => true\)/i)
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
    {
      source: '20260819100621_clinical_evidence_spine_reconcile.sql',
      destination: '20260818212759_replay_clinical_evidence_spine_reconcile.sql',
      before: '20260818212800_clinical_prescriber_governance_preflight.sql',
    },
  ])

  const corridorSource = fs.readFileSync(path.join(root, 'supabase/migrations/20260701230000_corridor_intelligence_tables_stub.sql'), 'utf8')
  assert.match(corridorSource, /reconstructed from the live production catalog for zero-state migration replay/i)
  assert.match(corridorSource, /repository-only replay-fidelity repair and is not a production migration/i)

  const listingsSource = fs.readFileSync(path.join(root, 'supabase/migrations/20260730220050_reconcile_listings_production_columns.sql'), 'utf8')
  assert.match(listingsSource, /shape was established entirely outside recorded history/i)
  assert.match(listingsSource, /below is taken from the live catalog \(pg_attribute \/ pg_get_expr\), not\s*-- inferred/i)

  const clinicalSource = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260819100621_clinical_evidence_spine_reconcile.sql'),
    'utf8',
  )
  const clinicalPreflight = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260818212800_clinical_prescriber_governance_preflight.sql'),
    'utf8',
  )
  assert.match(clinicalSource, /production-shape reconciliation/i)
  assert.match(clinicalSource, /create table if not exists public\.clinical_evidence_snapshots/i)
  assert.match(clinicalSource, /create table if not exists public\.clinical_grade_assessments/i)
  assert.match(clinicalPreflight, /represented by 20260819100621_clinical_evidence_spine_reconcile\.sql/i)
  assert.match(clinicalPreflight, /clinical prescriber os governance preflight failed/i)
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

test('replay disambiguates independent duplicate-version migrations without dropping any body', () => {
  assert.deepEqual(versionCollisionRenames, [
    {
      source: '20260813010000_extend_supply_catalog_equipment_to_australia.sql',
      sibling: '20260813010000_baseline_capture_pipeline_task_queue.sql',
      destination: '20260813010001_replay_extend_supply_catalog_equipment_to_australia.sql',
      before: '20260813020000_baseline_capture_reporting_and_triggers.sql',
    },
    {
      source: '20260820120000_heatmap_conflict_freeze_seed.sql',
      sibling: '20260820120000_clinical_pilot_local_authorities_au_gb_br.sql',
      destination: '20260820120001_replay_heatmap_conflict_freeze_seed.sql',
      before: '20260820130000_hv_pipeline_optimization.sql',
    },
  ])

  const source = fs.readFileSync(
    path.join(root, 'supabase/migrations', versionCollisionRenames[0].source),
    'utf8',
  )
  const sibling = fs.readFileSync(
    path.join(root, 'supabase/migrations', versionCollisionRenames[0].sibling),
    'utf8',
  )
  assert.match(source, /update public\.listings/i)
  assert.match(source, /repository-only pending/i)
  assert.match(sibling, /create table public\.pipeline_tasks/i)
  assert.match(sibling, /create table public\.dead_letter_tasks/i)

  const heatmap = fs.readFileSync(
    path.join(root, 'supabase/migrations', versionCollisionRenames[1].source),
    'utf8',
  )
  const clinical = fs.readFileSync(
    path.join(root, 'supabase/migrations', versionCollisionRenames[1].sibling),
    'utf8',
  )
  assert.match(heatmap, /create or replace function public\.roll_up_market_access_status/i)
  assert.match(heatmap, /rejected_conflict/i)
  assert.match(clinical, /insert into public\.local_authorities/i)
  assert.match(clinical, /'AU'.*'GB'.*'BR'/s)
})

test('duplicate-version replay rename fails closed unless the exact two-file collision and boundary remain', () => {
  const source = '20260813010000_extend_supply_catalog_equipment_to_australia.sql'
  const sibling = '20260813010000_baseline_capture_pipeline_task_queue.sql'
  const boundary = '20260813020000_baseline_capture_reporting_and_triggers.sql'

  assert.deepEqual(planReplayVersionCollisionRenames({ migrationFiles: [] }), [])
  assert.deepEqual(planReplayVersionCollisionRenames({ migrationFiles: [source, sibling] }), [])
  assert.equal(
    planReplayVersionCollisionRenames({ migrationFiles: [source, sibling, boundary] }).length,
    1,
  )
  assert.deepEqual(
    planReplayVersionCollisionRenames({
      migrationFiles: [
        source,
        sibling,
        boundary,
        '20260813010000_unexpected_third_collision.sql',
      ],
    }),
    [],
  )
})

test('replay materializes the missing education policy identities immediately before the recorded ALTER POLICY migration', () => {
  assert.equal(syntheticFoundations.length, 2)
  const foundation = syntheticFoundations.find(
    (item) => item.destination === '20260719083305_replay_education_policy_identities.sql',
  )
  assert.ok(foundation)
  assert.equal(foundation.destination, '20260719083305_replay_education_policy_identities.sql')
  assert.equal(foundation.before, '20260719083306_enforce_clinical_signoff_gate_in_rls.sql')
  assert.match(foundation.content, /policyname = 'education_modules_public_select'/i)
  assert.match(foundation.content, /create policy "education_modules_public_select"/i)
  assert.match(foundation.content, /policyname = 'public read sections of published modules'/i)
  assert.match(foundation.content, /create policy "public read sections of published modules"/i)
  assert.equal((foundation.content.match(/using \(false\)/gi) ?? []).length, 2)

  const productionAlter = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260719083306_enforce_clinical_signoff_gate_in_rls.sql'),
    'utf8',
  )
  assert.match(productionAlter, /Reconstructed from production/i)
  assert.match(productionAlter, /alter policy "education_modules_public_select" on public\.education_modules/i)
  assert.match(productionAlter, /alter policy "public read sections of published modules" on public\.education_module_sections/i)
  assert.match(productionAlter, /requires_clinical_signoff = false or reviewed_by is not null/i)
})

test('replay restores pg_trgm only in the temporary workspace before similarity() is called', () => {
  const foundation = syntheticFoundations.find(
    (item) => item.destination === '20260719140825_replay_pg_trgm_extension.sql',
  )
  assert.ok(foundation)
  assert.equal(
    foundation.before,
    '20260719140826_stage4_dedup_near_duplicate_signals.sql',
  )
  assert.deepEqual(foundation.required, [
    '20260719140826_stage4_dedup_near_duplicate_signals.sql',
  ])
  assert.match(foundation.content, /temporary production-faithful replay workspace/i)
  assert.match(foundation.content, /create extension if not exists pg_trgm with schema extensions/i)

  const dedup = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260719140826_stage4_dedup_near_duplicate_signals.sql'),
    'utf8',
  )
  assert.match(dedup, /similarity\(left\(a\.headline,80\), left\(b\.headline,80\)\)/i)
})

test('pg_trgm replay foundation fails closed when its boundary is absent or already materialized', () => {
  const boundary = '20260719140826_stage4_dedup_near_duplicate_signals.sql'
  const destination = '20260719140825_replay_pg_trgm_extension.sql'

  assert.equal(
    planReplaySyntheticFoundations({ migrationFiles: [] }).some(
      (item) => item.destination === destination,
    ),
    false,
  )
  assert.equal(
    planReplaySyntheticFoundations({ migrationFiles: [boundary] }).some(
      (item) => item.destination === destination,
    ),
    true,
  )
  assert.equal(
    planReplaySyntheticFoundations({ migrationFiles: [boundary, destination] }).some(
      (item) => item.destination === destination,
    ),
    false,
  )
})

test('synthetic education policy foundation fails closed when its boundary or prerequisite is absent', () => {
  const boundary = '20260719083306_enforce_clinical_signoff_gate_in_rls.sql'
  const prerequisite = '20260719083250_add_clinical_signoff_gate_to_education_modules.sql'
  const destination = '20260719083305_replay_education_policy_identities.sql'

  assert.deepEqual(planReplaySyntheticFoundations({ migrationFiles: [] }), [])
  assert.deepEqual(planReplaySyntheticFoundations({ migrationFiles: [boundary] }), [])
  assert.deepEqual(planReplaySyntheticFoundations({ migrationFiles: [prerequisite] }), [])
  assert.deepEqual(planReplaySyntheticFoundations({ migrationFiles: [prerequisite, boundary, destination] }), [])
  assert.equal(planReplaySyntheticFoundations({ migrationFiles: [prerequisite, boundary] }).length, 1)
})

test('replay hardens extant tables while guarding absent production-local staging relations', () => {
  const file = '20260723183914_lock_down_21_anon_exposed_public_tables.sql'
  assert.equal(contentPatches.length, 2)
  const patch = contentPatches.find((item) => item.file === file)
  assert.ok(patch)

  const original = fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8')
  assert.equal(original.includes(patch.anchor), true)
  assert.equal(original.includes(patch.replacement), false)

  const replayCopy = original.replace(patch.anchor, patch.replacement)
  assert.match(replayCopy, /to_regclass\(format\('public\.%I', t\)\) is null/i)
  assert.match(replayCopy, /alter table public\.%I enable row level security/i)
  assert.match(replayCopy, /revoke all on public\.%I from anon, authenticated/i)
  assert.match(replayCopy, /'country_name_aliases'/i)
})

test('replay evaluates source_registry content_type using its reconstructed text-array type', () => {
  const file = '20260816120000_auto_heatmap_from_signals.sql'
  const patch = contentPatches.find((item) => item.file === file)
  assert.ok(patch)

  const original = fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8')
  const columnMigration = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260715130000_stage1_add_content_type_to_source_registry.sql'),
    'utf8',
  )
  assert.match(columnMigration, /content_type text\[\]/i)
  assert.equal(original.includes(patch.anchor), true)
  assert.match(patch.replacement, /coalesce\(s\.content_type, '\{\}'::text\[\]\)/i)
  assert.match(patch.replacement, /&& array\['regulatory', 'legislation', 'official_notice'\]::text\[\]/i)
})

test('production-local relation guard is suppressed when the exact migration is absent', () => {
  assert.deepEqual(planReplayContentPatches({ migrationFiles: [] }), [])
})
