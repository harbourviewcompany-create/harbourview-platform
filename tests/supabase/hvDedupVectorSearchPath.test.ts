import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const historicalMigrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260802073000_hv_dedup_assign_restore_hnsw_knn.sql',
)

const forwardRepairPath = path.join(
  process.cwd(),
  'supabase/migrations/20260814143000_fix_hv_dedup_assign_search_path.sql',
)

function read(file: string): string {
  return fs.readFileSync(file, 'utf8')
}

describe('hv_dedup_assign pgvector operator resolution', () => {
  it('preserves the already-applied 20260802073000 historical search_path contract', () => {
    const sql = read(historicalMigrationPath)

    expect(sql).toMatch(/set\s+search_path\s+to\s+'public'/i)
    expect(sql).toContain('t.embedding_1024 <=> b.embedding_1024')
  })

  it('repairs operator resolution only in the forward 20260814143000 migration', () => {
    const sql = read(forwardRepairPath)

    expect(sql).toMatch(
      /set\s+search_path\s+to\s+'pg_catalog'\s*,\s*'public'\s*,\s*'extensions'/i,
    )
    expect(sql).toContain('t.embedding_1024 <=> b.embedding_1024')
    expect(sql).toContain('WHY A NEW VERSION RATHER THAN EDITING 20260802073000')
  })

  it('keeps browser EXECUTE closed after the forward repair', () => {
    const sql = read(forwardRepairPath)

    expect(sql).toMatch(/revoke all privileges on function public\.hv_dedup_assign/i)
    expect(sql).toMatch(/from PUBLIC, anon, authenticated/i)
    expect(sql).toMatch(/grant execute on function public\.hv_dedup_assign[\s\S]*to service_role/i)
  })
})
