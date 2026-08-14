import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260802073000_hv_dedup_assign_restore_hnsw_knn.sql',
)

function functionBody(): string {
  return fs.readFileSync(migrationPath, 'utf8')
}

describe('hv_dedup_assign pgvector operator resolution', () => {
  it('does not restore the public-only SECURITY DEFINER search_path that reproduces SQLSTATE 42883', () => {
    const sql = functionBody()

    expect(sql).not.toMatch(/set\s+search_path\s+to\s+'public'\s*\n/i)
    expect(sql).not.toMatch(/set\s+search_path\s*=\s*public\s*;/i)
  })

  it('pins pg_catalog, public and extensions so the unqualified pgvector <=> operator resolves', () => {
    const sql = functionBody()

    expect(sql).toMatch(
      /set\s+search_path\s+to\s+'pg_catalog'\s*,\s*'public'\s*,\s*'extensions'/i,
    )
    expect(sql).toContain('t.embedding_1024 <=> b.embedding_1024')
  })

  it('keeps the search-path repair documented as a narrow SECURITY DEFINER boundary', () => {
    const sql = functionBody()

    expect(sql).toContain('SECURITY DEFINER search')
    expect(sql).toContain('pgvector operator')
    expect(sql).not.toMatch(/search_path[^\n]*(auth|storage|vault|net|cron)/i)
  })
})
