import fs from 'node:fs'
import path from 'node:path'

const expected = [
  '20260730230000_elite_digest_from_pipeline_b.sql',
  '20260730233000_intelligence_self_improve_loop.sql',
  '20260731090000_digest_rank_includes_feedback.sql',
  '20260731100000_run_daily_digest_uses_feedback_rank.sql',
  '20260731110000_feedback_service_aggregates.sql',
  '20260731130000_elite_digest_release_hardening.sql',
  '20260802073000_hv_dedup_assign_restore_hnsw_knn.sql',
  '20260802152500_signal_feedback_api_rpcs.sql',
  '20260802163000_elite_digest_rpc_boundary_hardening.sql',
]
const migrationsDir = path.resolve('supabase/migrations')
const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql'))
const problems = []
const versions = expected.map((file) => file.slice(0, 14))

if (new Set(versions).size !== versions.length) {
  problems.push('Elite Digest migration list contains duplicate versions')
}
if ([...expected].sort().join('\n') !== expected.join('\n')) {
  problems.push('Elite Digest migration list is not in version order')
}
for (const file of expected) {
  if (!files.includes(file)) problems.push(`Missing Elite Digest migration: ${file}`)
  const version = file.slice(0, 14)
  const matches = files.filter((candidate) => candidate.startsWith(`${version}_`))
  if (matches.length !== 1 || matches[0] !== file) {
    problems.push(`Version ${version} is not unique to ${file}: ${matches.join(', ') || 'none'}`)
  }
}
if (files.includes('20260731090000_hv_dedup_assign_restore_hnsw_knn.sql')) {
  problems.push('Superseded duplicate-prefix HNSW migration is still present')
}

if (problems.length) {
  console.error('Elite Digest migration validation failed:')
  for (const problem of problems) console.error(`- ${problem}`)
  process.exit(1)
}
console.log(`Elite Digest migration validation passed for ${expected.length} ordered, unique files.`)
