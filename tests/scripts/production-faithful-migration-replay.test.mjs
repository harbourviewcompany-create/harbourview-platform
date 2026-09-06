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
    {
      source: '20260821120000_talent_job_board.sql',
      destination: '20260820235959_replay_talent_job_board.sql',
      before: '20260821000000_performance_advisor_fixes.sql',
    },
  ])

  // 20260821000000 ALTERs four talent_* policies; every talent table and policy
  // it names is created by 20260821120000, which sorts later. The relocated file
  // depends on nothing but auth.users and its own tables, so moving it is safe.
  const talentSource = fs.readFileSync(path.join(root, 'supabase/migrations/20260821120000_talent_job_board.sql'), 'utf8')
  assert.match(talentSource, /create table if not exists public\.talent_alerts/i)
  assert.match(talentSource, /create table if not exists public\.talent_opportunities/i)
  const advisorSource = fs.readFileSync(path.join(root, 'supabase/migrations/20260821000000_performance_advisor_fixes.sql'), 'utf8')
  assert.match(advisorSource, /ALTER POLICY talent_alerts_own ON public\.talent_alerts/i)

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
  assert.equal(syntheticFoundations.length, 3)
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
  assert.equal(contentPatches.length, 13)
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

test('replay reconciles the legacy and Prescriber OS clinical contracts additively', () => {
  const file = '20260818213000_clinical_prescriber_os_reconciliation.sql'
  const patch = contentPatches.find((item) => item.file === file)
  assert.ok(patch)

  const legacy = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260816150000_clinical_evidence_operating_system.sql'),
    'utf8',
  )
  const prescriber = fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8')
  assert.match(legacy, /No claim rows are inferred or seeded by this migration/i)
  assert.match(legacy, /claim_key text not null/i)
  assert.match(legacy, /statement text not null/i)
  assert.match(prescriber, /create table if not exists public\.clinical_evidence_claims/i)
  assert.match(prescriber, /concept_id uuid references public\.clinical_concepts/i)
  assert.match(prescriber, /status text not null default 'review-required'/i)
  assert.equal(prescriber.includes(patch.anchor), true)
  assert.match(patch.replacement, /alter table public\.clinical_concepts/i)
  assert.match(patch.replacement, /review_status = 'published' then 'active' else 'retired'/i)
  assert.match(patch.replacement, /alter table public\.clinical_concept_aliases/i)
  assert.match(patch.replacement, /add column if not exists claim_text text not null/i)
  assert.match(patch.replacement, /add column if not exists primary_source_url text not null/i)
  assert.match(patch.replacement, /alter column claim_key drop not null/i)
  assert.match(patch.replacement, /alter column source_locator set not null/i)
})

test('production-local relation guard is suppressed when the exact migration is absent', () => {
  assert.deepEqual(planReplayContentPatches({ migrationFiles: [] }), [])
})

test('replay reconstructs the Colombia briefing that no repository migration seeds', () => {
  const foundation = syntheticFoundations.find(
    (item) => item.destination === '20260830135959_replay_colombia_country_briefing.sql',
  )
  assert.ok(foundation)
  assert.equal(foundation.before, '20260830140000_full_regulatory_tier_coverage.sql')

  // The coverage migration asserts CO's stored tier equals the tier derived from
  // its briefing text, so a replay with no CO briefing derives null and fails.
  const coverage = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260830140000_full_regulatory_tier_coverage.sql'),
    'utf8',
  )
  assert.match(coverage, /Canonical evidence regression for LS\/MA\/CO\/KE/i)

  // No repository migration INSERTs a CO briefing; the americas seeds skip it and
  // 20260623100137 only UPDATEs a row it assumes exists.
  const americasSeeds = [
    '20260621233459_seed_briefings_americas_a.sql',
    '20260621233543_seed_briefings_americas_b.sql',
    '20260621233640_seed_briefings_americas_c.sql',
    '20260621233743_seed_briefings_americas_d.sql',
  ]
  for (const seed of americasSeeds) {
    const body = fs.readFileSync(path.join(root, 'supabase/migrations', seed), 'utf8')
    assert.equal(/,'CO',/.test(body), false, `${seed} unexpectedly seeds a CO briefing`)
  }

  assert.match(foundation.content, /insert into public\.cc_jurisdiction_briefings/i)
  assert.match(foundation.content, /\$hvco\$CO\$hvco\$/)
  assert.match(foundation.content, /where not exists/i)
  assert.match(foundation.content, /never a production migration or a migration-ledger entry/i)
})

test('replay guards production-only relations and routines instead of failing on them', () => {
  const guarded = [
    ['20260822000000_service_role_policy_scoping.sql', /to_regclass\('job_search\.opportunities'\) is not null/i],
    ['20260822000000_service_role_policy_scoping.sql', /to_regclass\('public\.country_intel_backup_20260630'\) is not null/i],
    ['20260901022725_pin_search_path_on_mutable_functions.sql', /to_regprocedure\('public\.hv_gemini_embed_backfill_tick\(integer\)'\) is not null/i],
    ['20260901022725_pin_search_path_on_mutable_functions.sql', /to_regprocedure\('public\.hv_local_classify_gate\(vector\)'\) is not null/i],
    ['20260902021703_fix_search_path_regression_missing_extensions_schema.sql', /to_regprocedure\('public\.hv_gemini_embed_backfill_tick\(integer\)'\) is not null/i],
    ['20260902021703_fix_search_path_regression_missing_extensions_schema.sql', /to_regprocedure\('public\.hv_local_classify_gate\(vector\)'\) is not null/i],
    ['20260902021818_fix_search_path_quoting_regression.sql', /to_regprocedure\('public\.hv_gemini_embed_backfill_tick\(integer\)'\) is not null/i],
    ['20260902021818_fix_search_path_quoting_regression.sql', /to_regprocedure\('public\.hv_local_classify_gate\(vector\)'\) is not null/i],
  ]

  for (const [file, guard] of guarded) {
    const patch = contentPatches.find((item) => item.file === file && guard.test(item.replacement))
    assert.ok(patch, `no guarding patch for ${file} matching ${guard}`)
    const original = fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8')
    assert.equal(original.includes(patch.anchor), true)
    assert.equal(original.includes(patch.replacement), false)
  }
})

test('replay reconciles every non-canonical territory row, not just the original six', () => {
  const file = '20260822134600_reconcile_legacy_heatmap_territory_rows.sql'
  const patch = contentPatches.find((item) => item.file === file)
  assert.ok(patch)

  const original = fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8')
  assert.equal(original.includes(patch.anchor), true)

  // The shipped file only recognises a 297-row/6-legacy-row replay. Repository
  // history now produces 309 rows, and its exact (iso, iso3, slug) tuple match
  // finds five of six because 20260609000000 seeds VI as 'us-virgin-islands'.
  assert.match(original, /v_total = 297 and v_legacy = 6/)
  assert.match(original, /'united-states-virgin-islands'/)
  const seed = fs.readFileSync(path.join(root, 'supabase/migrations/20260609000000_seed_countries_all_191_v1.sql'), 'utf8')
  assert.match(seed, /'us-virgin-islands'/)

  assert.match(patch.replacement, /v_replay_only constant text\[\]/i)
  for (const iso of ['AS', 'AW', 'AX', 'CW', 'GG', 'GI', 'GS', 'GU', 'HM', 'IM', 'JE', 'MO', 'MP', 'NC', 'PF', 'SX', 'TF', 'VI']) {
    assert.match(patch.replacement, new RegExp(`'${iso}'`))
  }
  // Production's canonical shape stays a strict no-op.
  assert.match(patch.replacement, /if v_total = 291 then/i)
})

test('replay compares market_access_status as text so either column shape works', () => {
  const file = '20260901021633_document_medical_only_reclassification_via_rpc.sql'
  const patch = contentPatches.find((item) => item.file === file)
  assert.ok(patch)

  const original = fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8')
  assert.equal(original.includes(patch.anchor), true)
  assert.match(patch.anchor, /WHERE market_access_status IS DISTINCT FROM \(CASE regulatory_tier/)
  assert.match(patch.replacement, /WHERE market_access_status::text IS DISTINCT FROM \(CASE regulatory_tier/)
  // The SET clause keeps its enum cast; only the predicate changes.
  assert.match(original, /END::market_access_status\nWHERE/)
})
