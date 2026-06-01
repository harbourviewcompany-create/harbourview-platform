import { isMarketplaceCategoryKey } from './taxonomy'

export const SEED_IMPORT_REQUIRED_COLUMNS = [
  'import_batch_id',
  'record_type',
  'category_key',
  'listing_type_key',
  'title_internal',
  'title_public_draft',
  'public_summary_draft',
  'source_type',
  'country',
  'publication_status',
] as const

const PRIVATE_GATED_CATEGORIES = new Set([
  'cannabis_inventory',
  'genetics',
  'export_ready',
  'import_demand',
  'distressed_businesses',
  'qualified_access',
])

export type SeedImportRow = Record<string, string | undefined>

export type SeedImportValidation = {
  ok: boolean
  errors: string[]
  normalized: SeedImportRow
}

export function validateSeedImportRow(row: SeedImportRow): SeedImportValidation {
  const errors: string[] = []
  for (const column of SEED_IMPORT_REQUIRED_COLUMNS) {
    if (!row[column]?.trim()) errors.push(`missing_${column}`)
  }

  const categoryKey = row.category_key?.trim() ?? ''
  if (categoryKey && !isMarketplaceCategoryKey(categoryKey)) errors.push('invalid_category_key')

  if (row.publication_status === 'published') errors.push('seed_import_cannot_publish_directly')
  if (!row.source_url?.trim() && !['manual_submission', 'buyer_request'].includes(row.source_type ?? '')) errors.push('missing_source_url')

  const publicationStatus = PRIVATE_GATED_CATEGORIES.has(categoryKey) ? 'private_only' : row.publication_status || 'not_publishable'
  const normalized = {
    ...row,
    publication_status: publicationStatus,
  }

  return { ok: errors.length === 0, errors, normalized }
}
