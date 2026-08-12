export type StructuredTabularFormat = 'csv' | 'html_table'

export type StructuredTabularMetadata = {
  structured_format?: StructuredTabularFormat
  delimiter?: string
  table_index?: number
  table_indexes?: number[]
  table_labels?: string[]
  header_rows?: number
  columns?: string[]
  identity_columns?: string[]
  title_column?: string
  url_column?: string
  record_url_template?: string
  max_records?: number
  record_offset?: number
}

export type StructuredTabularSnapshotCandidate = {
  captured_url: string
  captured_title: string
  captured_text: string
}

type ParsedTable = {
  headers: string[]
  rows: string[][]
  tableIndex: number
  tableLabel: string
}

const DEFAULT_MAX_RECORDS = 500
const HARD_MAX_RECORDS = 2500

function decodeEntities(input: string): string {
  const named: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—',
  }
  return input
    .replace(/&#(\d+);/g, (_match, value) => String.fromCodePoint(Number(value)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, value) => String.fromCodePoint(parseInt(value, 16)))
    .replace(/&([a-zA-Z]+);/g, (match, name) => named[name] ?? match)
}

function textContent(input: string): string {
  return decodeEntities(input)
    .replace(/<br\s*\/?>/gi, ' / ')
    .replace(/<\/?(?:li|p|div|h[1-6])\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeHeader(value: string, index: number): string {
  const normalized = textContent(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return normalized || `column_${index + 1}`
}

function uniqueHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>()
  return headers.map((header, index) => {
    const base = normalizeHeader(header, index)
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)
    return count === 1 ? base : `${base}_${count}`
  })
}

function parseCsvRows(raw: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index]
    const next = raw[index + 1]
    if (quoted) {
      if (char === '"' && next === '"') { field += '"'; index += 1 }
      else if (char === '"') quoted = false
      else field += char
      continue
    }
    if (char === '"') quoted = true
    else if (char === delimiter) { row.push(field.trim()); field = '' }
    else if (char === '\n') {
      row.push(field.trim())
      if (row.some((cell) => cell.length > 0)) rows.push(row)
      row = []; field = ''
    } else if (char !== '\r') field += char
  }
  row.push(field.trim())
  if (row.some((cell) => cell.length > 0)) rows.push(row)
  if (quoted) throw new Error('Structured CSV source ended inside a quoted field')
  return rows
}

function cellSpan(cell: string): number {
  const match = cell.match(/\bcolspan\s*=\s*["']?(\d+)/i)
  const value = Number(match?.[1] ?? 1)
  return Number.isFinite(value) && value > 0 ? Math.min(Math.trunc(value), 50) : 1
}

function parseHtmlRow(block: string): string[] {
  const cells = [...block.matchAll(/<(th|td)\b[^>]*>[\s\S]*?<\/\1>/gi)]
  const values: string[] = []
  for (const match of cells) {
    const cell = match[0]
    const value = textContent(cell)
    const span = cellSpan(cell)
    for (let index = 0; index < span; index += 1) values.push(value)
  }
  return values
}

function selectedTableIndexes(metadata: StructuredTabularMetadata, tableCount: number): number[] {
  const requested = Array.isArray(metadata.table_indexes) && metadata.table_indexes.length > 0
    ? metadata.table_indexes
    : typeof metadata.table_index === 'number'
      ? [metadata.table_index]
      : Array.from({ length: tableCount }, (_, index) => index)
  const normalized = [...new Set(requested.map((value) => Math.max(0, Math.trunc(value))))]
  for (const index of normalized) {
    if (index >= tableCount) throw new Error(`Structured HTML source is missing configured table_index ${index}`)
  }
  return normalized
}

function parseOneHtmlTable(table: string, tableIndex: number, tableLabel: string, metadata: StructuredTabularMetadata): ParsedTable {
  const rowBlocks = [...table.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)].map((match) => match[0])
  if (rowBlocks.length === 0) throw new Error(`Structured HTML table ${tableIndex} contains no rows`)
  const configuredHeaderRows = metadata.header_rows
  const inferredHeaderRows = rowBlocks.findIndex((row) => !/<th\b/i.test(row))
  const headerRows = Math.max(0, Math.trunc(configuredHeaderRows ?? (inferredHeaderRows > 0 ? inferredHeaderRows : 1)))
  const parsed = rowBlocks.map(parseHtmlRow).filter((row) => row.length > 0)
  if (parsed.length <= headerRows) throw new Error(`Structured HTML table ${tableIndex} contains no data rows`)
  const explicitColumns = metadata.columns?.map((value, index) => normalizeHeader(value, index)) ?? []
  const headerSource = parsed[Math.max(0, headerRows - 1)] ?? []
  const headers = explicitColumns.length > 0 ? uniqueHeaders(explicitColumns) : uniqueHeaders(headerSource)
  return { headers, rows: parsed.slice(headerRows), tableIndex, tableLabel }
}

function parseHtmlTables(raw: string, metadata: StructuredTabularMetadata): ParsedTable[] {
  const matches = [...raw.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)]
  if (matches.length === 0) throw new Error('Structured HTML source contains no table')
  const indexes = selectedTableIndexes(metadata, matches.length)
  return indexes.map((tableIndex, selectedIndex) => {
    const match = matches[tableIndex]
    const prefix = raw.slice(0, match.index ?? 0)
    const headings = [...prefix.matchAll(/<h[2-4]\b[^>]*>([\s\S]*?)<\/h[2-4]>/gi)]
    const inferredLabel = textContent(headings.at(-1)?.[1] ?? '')
    return parseOneHtmlTable(
      match[0],
      tableIndex,
      metadata.table_labels?.[selectedIndex]?.trim() || inferredLabel || `table_${tableIndex}`,
      metadata,
    )
  })
}

function parseCsvTable(raw: string, metadata: StructuredTabularMetadata): ParsedTable {
  const delimiter = typeof metadata.delimiter === 'string' && metadata.delimiter.length === 1 ? metadata.delimiter : ','
  const parsed = parseCsvRows(raw.replace(/^\uFEFF/, ''), delimiter)
  if (parsed.length < 2) throw new Error('Structured CSV source contains no data rows')
  const headerRows = Math.max(1, Math.trunc(metadata.header_rows ?? 1))
  const explicitColumns = metadata.columns?.map((value, index) => normalizeHeader(value, index)) ?? []
  const headerSource = parsed[Math.max(0, headerRows - 1)] ?? []
  const headers = explicitColumns.length > 0 ? uniqueHeaders(explicitColumns) : uniqueHeaders(headerSource)
  return { headers, rows: parsed.slice(headerRows), tableIndex: 0, tableLabel: metadata.table_labels?.[0]?.trim() || 'csv' }
}

function rowRecord(table: ParsedTable, row: string[]): Record<string, string> {
  return {
    _table_index: String(table.tableIndex),
    _table_label: table.tableLabel,
    ...Object.fromEntries(table.headers.map((header, index) => [header, (row[index] ?? '').trim()])),
  }
}

function stableIdentity(record: Record<string, string>, identityColumns: string[] | undefined, rowNumber: number): string {
  if (!identityColumns?.length) throw new Error('Structured tabular source requires identity_columns for stable record identity')
  const normalizedColumns = identityColumns.map((column, index) => column.startsWith('_') ? column : normalizeHeader(column, index))
  const missing = normalizedColumns.filter((column) => !record[column]?.trim())
  if (missing.length > 0) {
    throw new Error(`Structured tabular source record ${rowNumber} is missing configured identity column(s): ${missing.join(', ')}`)
  }
  return normalizedColumns.map((column) => record[column].trim()).join('|')
}

function renderRecordUrl(template: string | undefined, identity: string, explicitUrl: string | undefined, fallbackUrl: string): string {
  if (explicitUrl?.trim()) {
    try { return new URL(explicitUrl.trim(), fallbackUrl).toString() } catch { /* stable fallback below */ }
  }
  if (template) return template.replaceAll('{id}', encodeURIComponent(identity))
  return `${fallbackUrl}#${encodeURIComponent(identity)}`
}

/**
 * Split authoritative CSV or HTML tables into stable record-level snapshots.
 * Row position is never used as identity. When no HTML table index is configured,
 * every table is parsed and tagged with `_table_index` plus the nearest authority
 * heading as `_table_label`, preserving category/role provenance on multi-table pages.
 */
export function parseStructuredTabular(raw: string, fallbackUrl: string, metadata: StructuredTabularMetadata): StructuredTabularSnapshotCandidate[] {
  const format = metadata.structured_format
  if (format !== 'csv' && format !== 'html_table') throw new Error(`Unsupported structured tabular format: ${String(format ?? 'missing')}`)
  const tables = format === 'csv' ? [parseCsvTable(raw, metadata)] : parseHtmlTables(raw, metadata)
  const configuredMax = typeof metadata.max_records === 'number' && Number.isFinite(metadata.max_records) ? Math.trunc(metadata.max_records) : DEFAULT_MAX_RECORDS
  const maxRecords = Math.max(1, Math.min(configuredMax, HARD_MAX_RECORDS))
  const offset = Math.max(0, Math.trunc(metadata.record_offset ?? 0))
  const titleColumn = metadata.title_column ? normalizeHeader(metadata.title_column, 0) : null
  const urlColumn = metadata.url_column ? normalizeHeader(metadata.url_column, 0) : null
  const records = tables.flatMap((table) => table.rows.filter((row) => row.some((cell) => cell.trim().length > 0)).map((row) => ({ table, row })))
  return records.slice(offset, offset + maxRecords).map(({ table, row }, index) => {
    const record = rowRecord(table, row)
    const sourceRowNumber = offset + index + 1
    const identity = stableIdentity(record, metadata.identity_columns, sourceRowNumber)
    const title = (titleColumn ? record[titleColumn] : '')?.trim() || identity
    const explicitUrl = urlColumn ? record[urlColumn] : undefined
    return {
      captured_url: renderRecordUrl(metadata.record_url_template, identity, explicitUrl, fallbackUrl),
      captured_title: title.slice(0, 500),
      captured_text: JSON.stringify(record).slice(0, 64000),
    }
  })
}
