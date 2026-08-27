import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const source = fs.readFileSync(
  path.join(process.cwd(), 'lib/marketplace/images/public-query.ts'),
  'utf8',
)

describe('public marketplace image query contract', () => {
  it('targets the configured exposed API schema', () => {
    expect(source).toContain("'Accept-Profile': SUPABASE_DB_SCHEMA")
    expect(source).toContain('SUPABASE_DB_SCHEMA')
  })

  it('selects only the public DTO allowlist and never admin provenance columns', () => {
    expect(source).toContain('PUBLIC_MARKETPLACE_IMAGE_COLUMNS')
    for (const forbidden of [
      'source_name',
      'source_url',
      'source_reference',
      'original_storage_path',
      'edited_storage_path',
      'reviewed_by',
      'uploaded_by',
    ]) {
      expect(source).not.toContain(`select: '${forbidden}`)
    }
  })

  it('uses an exposed unique id tie-breaker so paginated ordering is deterministic', () => {
    expect(source).toContain("order: 'image_role.asc,id.asc'")
    expect(source).toContain('return a.id.localeCompare(b.id)')
    expect(source).not.toContain('created_at.asc')
  })

  it('retains the approved-public and known-rights filters', () => {
    expect(source).toContain("review_status: 'eq.APPROVED_PUBLIC'")
    expect(source).toContain("rights_status: 'neq.UNKNOWN'")
  })

  it('chunks and paginates large listing sets instead of imposing an aggregate row cap', () => {
    expect(source).toContain('ITEM_ID_BATCH_SIZE = 80')
    expect(source).toContain('PAGE_SIZE = 500')
    expect(source).toContain('const cardBatches = chunks(ids, ITEM_ID_BATCH_SIZE)')
    expect(source).toContain('const batches = chunks(ids, ITEM_ID_BATCH_SIZE)')
    expect(source).toContain('Promise.all(batches.map(batch => queryPublicImageBatch(batch, signal)))')
    expect(source).toContain('Range: `${rangeStart}-${rangeStart + PAGE_SIZE - 1}`')
    expect(source).toContain('for (let rangeStart = 0; ; rangeStart += PAGE_SIZE)')
    expect(source).toContain('if (page.length < PAGE_SIZE) return rows')
    expect(source).not.toContain('Math.min(ids.length * 12, 500)')
    expect(source).not.toContain('limit:')
  })

  it('fails a paginated batch closed instead of returning partial media coverage', () => {
    expect(source).toContain("if (page === null) throw new Error('MARKETPLACE_MEDIA_QUERY_FAILED')")
    expect(source).toContain('signal?: AbortSignal')
    expect(source).toContain('signal,')
  })
})
