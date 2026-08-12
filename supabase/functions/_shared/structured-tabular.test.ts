import { parseStructuredTabular } from './structured-tabular.ts'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function assertThrows(fn: () => unknown, expectedMessage: string) {
  try {
    fn()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    assert(message.includes(expectedMessage), `expected error containing "${expectedMessage}", received "${message}"`)
    return
  }
  throw new Error(`expected function to throw "${expectedMessage}"`)
}

Deno.test('CSV parser preserves quoted commas and multiline fields with stable identity', () => {
  const raw = [
    'Licence holder,Province,Licence,Notes',
    '"Example Cannabis, Inc.",ON,Cultivation,"Line one',
    'line two"',
  ].join('\n')

  const rows = parseStructuredTabular(raw, 'https://example.test/licences.csv', {
    structured_format: 'csv',
    identity_columns: ['Licence holder', 'Province'],
    title_column: 'Licence holder',
  })

  assert(rows.length === 1, 'expected one CSV record')
  assert(rows[0].captured_title === 'Example Cannabis, Inc.', 'expected quoted title')
  assert(rows[0].captured_url.endsWith('#Example%20Cannabis%2C%20Inc.%7CON'), 'expected deterministic record URL')
  assert(rows[0].captured_text.includes('Line one\\nline two'), 'expected multiline field preserved in JSON text')
})

Deno.test('Health Canada style multi-row HTML table accepts explicit canonical columns', () => {
  const raw = `
    <table>
      <tr>
        <th rowspan="2">Licence holder</th><th rowspan="2">Province / territory</th><th rowspan="2">Licence(s)</th>
        <th colspan="2">Classes authorized to sell</th><th rowspan="2">Client Care</th><th rowspan="2">Date of initial licensing</th>
      </tr>
      <tr><th>Provincial / territorial</th><th>Registered patients</th></tr>
      <tr>
        <td>2143119 ALBERTA LTD. (2nd site)</td><td>AB</td><td>Sales (Medical) / Processing</td>
        <td>Plants / Seeds / Dried / Fresh</td><td>Plants / Seeds / Dried / Fresh</td><td>1-866-842-6449</td><td>2026-06-26</td>
      </tr>
    </table>`

  const rows = parseStructuredTabular(raw, 'https://www.canada.ca/licences', {
    structured_format: 'html_table',
    table_index: 0,
    header_rows: 2,
    columns: ['licence_holder', 'province', 'licences', 'sell_provincial', 'sell_medical', 'client_care', 'initial_licensing_date'],
    identity_columns: ['licence_holder', 'province', 'initial_licensing_date'],
    title_column: 'licence_holder',
  })

  assert(rows.length === 1, 'expected one Health Canada row')
  assert(rows[0].captured_title === '2143119 ALBERTA LTD. (2nd site)', 'expected licence holder title')
  assert(rows[0].captured_text.includes('sell_medical'), 'expected canonical explicit fields')
  assert(rows[0].captured_text.includes('2026-06-26'), 'expected licensing date retained')
})

Deno.test('ODC table rows decode entities and retain public role values', () => {
  const raw = `
    <table>
      <tr><th>Licence holder</th><th>Cultivation</th><th>Production</th><th>Manufacture</th></tr>
      <tr><td>Example &amp; Botanics Pty Ltd</td><td>Y</td><td>Y</td><td>N</td></tr>
    </table>`

  const rows = parseStructuredTabular(raw, 'https://www.odc.gov.au/example', {
    structured_format: 'html_table',
    identity_columns: ['Licence holder'],
    title_column: 'Licence holder',
  })

  assert(rows.length === 1, 'expected one ODC row')
  assert(rows[0].captured_title === 'Example & Botanics Pty Ltd', 'expected entity decoding')
  assert(rows[0].captured_text.includes('"cultivation":"Y"'), 'expected role value preserved')
})

Deno.test('multi-table pages preserve nearest heading as role/category evidence', () => {
  const raw = `
    <h2>Manufacturers</h2>
    <table><tr><th>Name</th><th>Contact details</th></tr><tr><td>Maker Pty Ltd</td><td>maker.example</td></tr></table>
    <h2>Importers</h2>
    <table><tr><th>Name</th><th>Contact details</th></tr><tr><td>Importer Pty Ltd</td><td>importer.example</td></tr></table>`

  const rows = parseStructuredTabular(raw, 'https://example.test/suppliers', {
    structured_format: 'html_table',
    columns: ['name', 'contact_details'],
    identity_columns: ['_table_label', 'name'],
    title_column: 'name',
  })

  assert(rows.length === 2, 'expected both authority tables to be parsed')
  assert(rows[0].captured_text.includes('"_table_label":"Manufacturers"'), 'expected manufacturer role label')
  assert(rows[1].captured_text.includes('"_table_label":"Importers"'), 'expected importer role label')
  assert(rows[0].captured_url !== rows[1].captured_url, 'expected role/category to participate in stable identity')
})

Deno.test('configured identity columns fail closed when authority schema drifts', () => {
  const raw = 'Company,Province\nExample Ltd,'
  assertThrows(
    () => parseStructuredTabular(raw, 'https://example.test/licences.csv', {
      structured_format: 'csv',
      identity_columns: ['Company', 'Province'],
      title_column: 'Company',
    }),
    'missing configured identity column(s): province',
  )
})

Deno.test('tabular parsing never silently falls back to row position identity', () => {
  const raw = 'Company,Province\nExample Ltd,ON'
  assertThrows(
    () => parseStructuredTabular(raw, 'https://example.test/licences.csv', {
      structured_format: 'csv',
      title_column: 'Company',
    }),
    'requires identity_columns',
  )
})

Deno.test('record_offset and max_records support deterministic chunking of large registries', () => {
  const raw = ['id,name', ...Array.from({ length: 12 }, (_, index) => `${index + 1},Company ${index + 1}`)].join('\n')
  const rows = parseStructuredTabular(raw, 'https://example.test/registry.csv', {
    structured_format: 'csv',
    identity_columns: ['id'],
    title_column: 'name',
    record_offset: 5,
    max_records: 3,
  })

  assert(rows.length === 3, 'expected exactly one configured chunk')
  assert(rows[0].captured_title === 'Company 6', 'expected offset to begin at row six')
  assert(rows[2].captured_url.endsWith('#8'), 'expected deterministic final identity')
})

Deno.test('hard record cap bounds accidental oversized authority pages', () => {
  const raw = ['id,name', ...Array.from({ length: 3000 }, (_, index) => `${index + 1},Company ${index + 1}`)].join('\n')
  const rows = parseStructuredTabular(raw, 'https://example.test/registry.csv', {
    structured_format: 'csv',
    identity_columns: ['id'],
    title_column: 'name',
    max_records: 10000,
  })
  assert(rows.length === 2500, 'hard cap must remain 2500 records per fetch')
})
