import { parseStructuredJson } from './structured-json.ts'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

Deno.test('ClinicalTrials records become stable per-study snapshots', () => {
  const raw = JSON.stringify({
    studies: [
      {
        protocolSection: {
          identificationModule: { nctId: 'NCT12345678', briefTitle: 'Cannabidiol Study' },
          statusModule: { overallStatus: 'RECRUITING' },
        },
      },
    ],
  })

  const rows = parseStructuredJson(raw, 'https://clinicaltrials.gov/api/v2/studies', {
    records_path: 'studies',
    identity_path: 'protocolSection.identificationModule.nctId',
    title_path: 'protocolSection.identificationModule.briefTitle',
    record_url_template: 'https://clinicaltrials.gov/study/{id}',
  })

  assert(rows.length === 1, 'expected one study')
  assert(rows[0].captured_title === 'Cannabidiol Study', 'expected study title')
  assert(rows[0].captured_url === 'https://clinicaltrials.gov/study/NCT12345678', 'expected canonical study URL')
  assert(rows[0].captured_text.includes('RECRUITING'), 'expected complete structured record text')
})

Deno.test('Federal Register results retain official record URL and document identity', () => {
  const raw = JSON.stringify({
    results: [
      {
        document_number: '2026-12345',
        title: 'Schedules of Controlled Substances',
        html_url: 'https://www.federalregister.gov/documents/2026/08/10/2026-12345/example',
        type: 'Rule',
      },
    ],
  })

  const rows = parseStructuredJson(raw, 'https://www.federalregister.gov/api/v1/documents.json', {
    records_path: 'results',
    identity_path: 'document_number',
    title_path: 'title',
    url_path: 'html_url',
  })

  assert(rows.length === 1, 'expected one Federal Register record')
  assert(rows[0].captured_title === 'Schedules of Controlled Substances', 'expected document title')
  assert(rows[0].captured_url.includes('/2026-12345/'), 'expected document-specific URL')
})

Deno.test('openFDA enforcement records get deterministic fallback URLs', () => {
  const raw = JSON.stringify({
    results: [
      {
        recall_number: 'D-1234-2026',
        product_description: 'Cannabis-derived product',
        recalling_firm: 'Example Firm',
        classification: 'Class II',
      },
    ],
  })

  const sourceUrl = 'https://api.fda.gov/drug/enforcement.json?search=cannabis&limit=100'
  const rows = parseStructuredJson(raw, sourceUrl, {
    records_path: 'results',
    identity_path: 'recall_number',
    title_path: 'product_description',
  })

  assert(rows.length === 1, 'expected one recall')
  assert(rows[0].captured_url.endsWith('#D-1234-2026'), 'expected stable recall identity in URL')
  assert(rows[0].captured_text.includes('Example Firm'), 'expected full enforcement record')
})

Deno.test('configured max_records bounds oversized API payloads', () => {
  const raw = JSON.stringify({ results: Array.from({ length: 300 }, (_, i) => ({ id: `id-${i}`, title: `row-${i}` })) })
  const rows = parseStructuredJson(raw, 'https://example.test/api', {
    records_path: 'results',
    identity_path: 'id',
    title_path: 'title',
    max_records: 500,
  })
  assert(rows.length === 250, 'hard cap must remain 250 records per source fetch')
})
