import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const ingestion = readFileSync('supabase/migrations/20260815176000_talent_p0_governed_ingestion.sql','utf8')
const functionSource = readFileSync('supabase/functions/talent-job-ingest/index.ts','utf8')
const safety = readFileSync('supabase/migrations/20260815175000_talent_p0_operational_safety.sql','utf8')
const documentsRoute = readFileSync('app/api/talent/documents/route.ts','utf8')

describe('Talent P0 governed ingestion and document safety', () => {
  it('keeps external ingestion off unless the global feature and source rights both allow it', () => {
    expect(ingestion).toContain("api.talent_feature_enabled('external_ingestion')")
    expect(ingestion).toContain('v_rights.storage_allowed IS DISTINCT FROM true')
    expect(safety).toContain("('external_ingestion',false")
  })

  it('stores external observations in validation/ingestible state instead of auto-publishing', () => {
    expect(ingestion).toContain("'open','validation','external','confirmed','ingestible'")
    expect(ingestion).not.toContain("'published','external'")
  })

  it('requires an independent ingestion secret before invoking service-role RPCs', () => {
    expect(functionSource).toContain('TALENT_INGESTION_SECRET')
    expect(functionSource).toContain('matchesRequiredSecret')
    expect(functionSource).toContain("db: { schema: 'api' }")
  })

  it('keeps canonical documents private, size/type restricted, short-lived, and audited', () => {
    expect(documentsRoute).toContain('MAX_BYTES = 10 * 1024 * 1024')
    expect(documentsRoute).toContain("storage.from('talent-private').upload")
    expect(documentsRoute).toContain('createSignedUrl(row.storage_path, 60)')
    expect(safety).toContain('talent_record_document_access')
  })
})
