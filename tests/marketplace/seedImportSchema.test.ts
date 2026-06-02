import { describe, expect, it } from 'vitest'
import { validateSeedImportRow } from '@/lib/marketplace/seedImportSchema'

describe('marketplace seed import schema', () => {
  it('rejects direct publication attempts from seed rows', () => {
    const result = validateSeedImportRow({
      import_batch_id: 'batch-001',
      record_type: 'used_equipment',
      category_key: 'used_surplus',
      listing_type_key: 'used_surplus_equipment',
      title_internal: 'Internal title',
      title_public_draft: 'Public title',
      public_summary_draft: 'Public summary',
      source_type: 'manual_submission',
      country: 'Canada',
      publication_status: 'published',
    })
    expect(result.ok).toBe(false)
    expect(result.errors).toContain('seed_import_cannot_publish_directly')
  })

  it('keeps restricted categories private by default', () => {
    const result = validateSeedImportRow({
      import_batch_id: 'batch-002',
      record_type: 'supplier',
      category_key: 'cannabis_inventory',
      listing_type_key: 'cannabis_inventory',
      title_internal: 'Internal title',
      title_public_draft: 'Public title',
      public_summary_draft: 'Public summary',
      source_type: 'manual_submission',
      country: 'Canada',
      publication_status: 'draft_public_summary',
    })
    expect(result.normalized.publication_status).toBe('private_only')
  })
})
