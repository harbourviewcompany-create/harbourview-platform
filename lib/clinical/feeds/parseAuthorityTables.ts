/**
 * Parse markdown-style and HTML tables from authority pages into row arrays.
 */

export function parseMarkdownTables(markdown: string): Array<{ headers: string[]; rows: string[][] }> {
  const tables: Array<{ headers: string[]; rows: string[][] }> = []
  const lines = markdown.split(/\r?\n/)
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!/^\|/.test(line) || !line.includes('|')) {
      i++
      continue
    }
    const headerCells = splitMdRow(line)
    const next = lines[i + 1] ?? ''
    if (!/^\|[\s:-]+/.test(next)) {
      i++
      continue
    }
    i += 2
    const rows: string[][] = []
    while (i < lines.length && /^\|/.test(lines[i])) {
      rows.push(splitMdRow(lines[i]))
      i++
    }
    if (headerCells.length >= 2 && rows.length > 0) {
      tables.push({ headers: headerCells, rows })
    }
  }
  return tables
}

function splitMdRow(line: string): string[] {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())
}

export function parseHtmlTables(html: string): Array<{ headers: string[]; rows: string[][] }> {
  const tables: Array<{ headers: string[]; rows: string[][] }> = []
  const tableRe = /<table[\s\S]*?<\/table>/gi
  let tm: RegExpExecArray | null
  while ((tm = tableRe.exec(html)) !== null) {
    const block = tm[0]
    const headers: string[] = []
    const thRe = /<th[^>]*>([\s\S]*?)<\/th>/gi
    let th: RegExpExecArray | null
    while ((th = thRe.exec(block)) !== null) {
      headers.push(stripTags(th[1]))
    }
    const rows: string[][] = []
    const trRe = /<tr[\s\S]*?<\/tr>/gi
    let tr: RegExpExecArray | null
    let first = true
    while ((tr = trRe.exec(block)) !== null) {
      const cells: string[] = []
      const tdRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
      let td: RegExpExecArray | null
      while ((td = tdRe.exec(tr[0])) !== null) {
        cells.push(stripTags(td[1]))
      }
      if (cells.length === 0) continue
      if (first && headers.length === 0) {
        // header row was td-based
        first = false
        if (cells.every((c) => /dosage|active|sponsor|form|qty/i.test(c))) {
          headers.push(...cells)
          continue
        }
      }
      first = false
      if (headers.length && cells.length === headers.length) rows.push(cells)
      else if (!headers.length && cells.length >= 3) rows.push(cells)
    }
    if (rows.length) tables.push({ headers: headers.length ? headers : ['col0', 'col1', 'col2', 'col3'], rows })
  }
  return tables
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

export function detectCategoryFromContext(textBefore: string): string | null {
  const m = textBefore.match(/Category\s*([1-5])\s*:?\s*([^\n|]{0,80})/i)
  if (!m) return null
  return `Category ${m[1]}: ${m[2].trim()}`
}
