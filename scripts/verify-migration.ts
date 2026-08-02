// scripts/verify-migration.ts
// Post-migration verification script. Run after applying the migration.
// Checks all schema changes, indexes, and RLS policies.

import { createClient } from '@/lib/supabase/server'

interface VerificationResult {
  check: string
  passed: boolean
  details?: string
}

async function verifyMigration(): Promise<VerificationResult[]> {
  const supabase = await createClient()
  const results: VerificationResult[] = []

  // 1. Check snapshot_id column exists on signals
  const { data: snapshotCol } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'signals')
    .eq('column_name', 'snapshot_id')
    .single()

  results.push({
    check: 'signals.snapshot_id column exists',
    passed: !!snapshotCol,
    details: snapshotCol ? 'Found' : 'MISSING',
  })

  // 2. Check idx_signals_snapshot_id index exists
  const { data: snapshotIdx } = await supabase
    .from('pg_indexes')
    .select('indexname')
    .eq('indexname', 'idx_signals_snapshot_id')
    .single()

  results.push({
    check: 'idx_signals_snapshot_id index exists',
    passed: !!snapshotIdx,
    details: snapshotIdx ? 'Found' : 'MISSING',
  })

  // 3. Check provenance columns on marketplace_candidates
  const provCols = ['raw_html_hash', 'parser_version', 'normaliser_model', 'normaliser_prompt_version', 'scrape_run_id']
  for (const col of provCols) {
    const { data } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'marketplace_candidates')
      .eq('column_name', col)
      .single()

    results.push({
      check: `marketplace_candidates.${col} exists`,
      passed: !!data,
      details: data ? 'Found' : 'MISSING',
    })
  }

  // 4. (removed) countries-table check: this migration no longer creates or
  // seeds `countries` -- see 20260729000000_platform_optimizations.sql for
  // why (a real, unrelated 203-row table already existed under that name).

  // 5. Check ia_extraction_failures table exists
  const { data: failuresTable } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', 'ia_extraction_failures')
    .single()

  results.push({
    check: 'ia_extraction_failures table exists',
    passed: !!failuresTable,
    details: failuresTable ? 'Found' : 'MISSING',
  })

  // 6. Check RLS is enabled on ia_extraction_failures
  const { data: rlsEnabled } = await supabase
    .rpc('check_rls_enabled', { table_name: 'ia_extraction_failures' })

  results.push({
    check: 'ia_extraction_failures RLS enabled',
    passed: rlsEnabled === true,
    details: rlsEnabled ? 'Enabled' : 'DISABLED',
  })

  // 7. Check tier column on scraper_source_state
  const { data: tierCol } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'scraper_source_state')
    .eq('column_name', 'tier')
    .single()

  results.push({
    check: 'scraper_source_state.tier exists',
    passed: !!tierCol,
    details: tierCol ? 'Found' : 'MISSING',
  })

  // 8. Check last_embedded_at on hv_artifacts
  const { data: embeddedCol } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'hv_artifacts')
    .eq('column_name', 'last_embedded_at')
    .single()

  results.push({
    check: 'hv_artifacts.last_embedded_at exists',
    passed: !!embeddedCol,
    details: embeddedCol ? 'Found' : 'MISSING',
  })

  // 9. Check professional_service_providers RLS policies
  const { data: providerPolicies } = await supabase
    .from('pg_policies')
    .select('policyname')
    .eq('tablename', 'professional_service_providers')

  results.push({
    check: 'professional_service_providers has RLS policies',
    passed: (providerPolicies?.length ?? 0) > 0,
    details: `${providerPolicies?.length ?? 0} policies`,
  })

  return results
}

async function main() {
  console.log('\n🔍 Running migration verification...\n')
  const results = await verifyMigration()

  let passed = 0
  let failed = 0

  for (const r of results) {
    const icon = r.passed ? '✅' : '❌'
    console.log(`${icon} ${r.check}: ${r.details}`)
    if (r.passed) passed++
    else failed++
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Results: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    console.log('\n⚠️  Some checks failed. Review the migration before proceeding.')
    process.exit(1)
  } else {
    console.log('\n🎉 All checks passed! Migration is healthy.')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
