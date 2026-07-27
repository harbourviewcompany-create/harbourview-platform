// Minimal, dependency-free PDF writer for simple single-font text reports
// (Helvetica / Helvetica-Bold, US Letter, automatic word-wrap + pagination).
//
// Deliberately hand-rolled instead of adding a PDF library (jsPDF, pdf-lib,
// etc.): a new dependency means a package.json + lockfile change this sandbox
// cannot regenerate/verify with npm install, and this document's needs
// (headings, paragraphs, bullet lists, one font family) don't need a general
// PDF renderer. Output is verified against the PDF spec by round-tripping
// through pypdf in this PR's evidence log entry.
//
// ENCODING NOTE — read before touching escapePdfText/toWinAnsiBytes:
// This repo already has one documented bug where a naive JS string -> byte
// conversion mangled non-ASCII punctuation (github-bridge's get_file, which
// uses atob() and corrupted em-dashes in HANDOFF.md). The same failure mode
// applies here: Buffer.from(str, 'latin1') truncates each UTF-16 code unit to
// its low byte, so an em dash (U+2014) becomes byte 0x14 (a control
// character), not the WinAnsiEncoding em-dash (0x97). toWinAnsiBytes() maps
// the common editorial punctuation (curly quotes, en/em dash, bullet,
// ellipsis, nbsp) to their correct single-byte WinAnsi codes before any
// latin1 buffer conversion happens, with an ASCII fallback for anything
// further outside WinAnsi's range (falls back to '?' rather than corrupting
// silently). Playbook content is editorial prose and will contain exactly
// these characters, so this isn't a hypothetical edge case.

const PAGE_WIDTH = 612 // US Letter, points
const PAGE_HEIGHT = 792
const MARGIN = 56
const LINE_HEIGHT = 14
const BODY_SIZE = 10
const H1_SIZE = 18
const H2_SIZE = 12

const WINANSI_MAP: Record<number, number> = {
  0x2018: 0x91, 0x2019: 0x92, // ‘ ’
  0x201c: 0x93, 0x201d: 0x94, // “ ”
  0x2013: 0x96, 0x2014: 0x97, // – —
  0x2022: 0x95, // •
  0x2026: 0x85, // …
  0x00a0: 0x20, // nbsp -> space
}
const ASCII_FALLBACK: Record<number, string> = {
  0x2018: "'", 0x2019: "'", 0x201c: '"', 0x201d: '"',
  0x2013: '-', 0x2014: '-', 0x2022: '*', 0x2026: '...', 0x00a0: ' ',
}

function toWinAnsiBytes(str: string): string {
  let out = ''
  for (const ch of String(str ?? '')) {
    const code = ch.codePointAt(0) ?? 63
    if (code < 0x80) { out += ch; continue }
    if (WINANSI_MAP[code] !== undefined) { out += String.fromCharCode(WINANSI_MAP[code]); continue }
    if (code <= 0xff) { out += ch; continue } // already a valid WinAnsi/latin1 byte
    out += ASCII_FALLBACK[code] ?? '?'
  }
  return out
}

function escapePdfText(s: string): string {
  const winAnsi = toWinAnsiBytes(s)
  return winAnsi
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r?\n/g, ' ')
}

// Helvetica AFM widths (1000 units/em) for the printable ASCII range, plus
// the WinAnsi punctuation codes this doc actually uses. Used only to decide
// word-wrap points — approximate for bold runs, which are short labels here.
const HELVETICA_WIDTHS: Record<number, number> = {
  32: 278, 33: 278, 34: 355, 35: 556, 36: 556, 37: 889, 38: 667, 39: 191, 40: 333, 41: 333,
  42: 389, 43: 584, 44: 278, 45: 333, 46: 278, 47: 278, 48: 556, 49: 556, 50: 556, 51: 556,
  52: 556, 53: 556, 54: 556, 55: 556, 56: 556, 57: 556, 58: 278, 59: 278, 60: 584, 61: 584,
  62: 584, 63: 556, 64: 1015, 65: 667, 66: 667, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778,
  72: 722, 73: 278, 74: 500, 75: 667, 76: 556, 77: 833, 78: 722, 79: 778, 80: 667, 81: 778,
  82: 722, 83: 667, 84: 611, 85: 722, 86: 667, 87: 944, 88: 667, 89: 667, 90: 611, 91: 278,
  92: 278, 93: 278, 94: 469, 95: 556, 96: 333, 97: 556, 98: 556, 99: 500, 100: 556, 101: 556,
  102: 278, 103: 556, 104: 556, 105: 222, 106: 222, 107: 500, 108: 222, 109: 833, 110: 556,
  111: 556, 112: 556, 113: 556, 114: 333, 115: 500, 116: 278, 117: 556, 118: 500, 119: 722,
  120: 500, 121: 500, 122: 500, 123: 334, 124: 260, 125: 334, 126: 584,
  0x91: 222, 0x92: 222, 0x93: 333, 0x94: 333, 0x96: 333, 0x97: 556, 0x95: 350, 0x85: 500,
}

function textWidth(text: string, size: number): number {
  let w = 0
  for (const ch of toWinAnsiBytes(text)) w += HELVETICA_WIDTHS[ch.charCodeAt(0)] || 556
  return (w / 1000) * size
}

function wrapText(text: string, size: number, maxWidth: number): string[] {
  const words = String(text ?? '').split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (textWidth(candidate, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

type Page = { ops: string[] }

export class PdfDoc {
  private pages: Page[] = []
  private page!: Page
  private cursorY = PAGE_HEIGHT - MARGIN

  constructor() {
    this.newPage()
  }

  private newPage() {
    this.page = { ops: [] }
    this.pages.push(this.page)
    this.cursorY = PAGE_HEIGHT - MARGIN
  }

  private ensureSpace(h: number) {
    if (this.cursorY - h < MARGIN) this.newPage()
  }

  private writeLine(text: string, size: number, bold: boolean) {
    this.ensureSpace(LINE_HEIGHT)
    const font = bold ? 'F2' : 'F1'
    this.page.ops.push(`BT /${font} ${size} Tf ${MARGIN} ${this.cursorY} Td (${escapePdfText(text)}) Tj ET`)
    this.cursorY -= size <= BODY_SIZE ? LINE_HEIGHT : size + 6
  }

  heading(text: string) {
    this.ensureSpace(H1_SIZE + 10)
    this.cursorY -= 4
    this.writeLine(text, H1_SIZE, true)
    this.cursorY -= 6
  }

  subheading(text: string) {
    this.cursorY -= 4
    this.writeLine(text, H2_SIZE, true)
    this.cursorY -= 2
  }

  paragraph(text: string, opts?: { bold?: boolean }) {
    const maxWidth = PAGE_WIDTH - 2 * MARGIN
    for (const line of wrapText(text, BODY_SIZE, maxWidth)) this.writeLine(line, BODY_SIZE, !!opts?.bold)
  }

  bullet(text: string) {
    const maxWidth = PAGE_WIDTH - 2 * MARGIN - 14
    wrapText(text, BODY_SIZE, maxWidth).forEach((line, i) => {
      this.ensureSpace(LINE_HEIGHT)
      const prefix = i === 0 ? `${String.fromCharCode(0x95)} ` : '  '
      this.page.ops.push(
        `BT /F1 ${BODY_SIZE} Tf ${MARGIN + 10} ${this.cursorY} Td (${escapePdfText(prefix + line)}) Tj ET`,
      )
      this.cursorY -= LINE_HEIGHT
    })
  }

  spacer(pts = LINE_HEIGHT) {
    this.cursorY -= pts
  }

  build(): Buffer {
    let nextId = 3
    const fontF1Id = nextId++
    const fontF2Id = nextId++
    const pageIds: number[] = []
    const contentIds: number[] = []
    for (let i = 0; i < this.pages.length; i++) {
      pageIds.push(nextId++)
      contentIds.push(nextId++)
    }

    const objs: Record<number, string | { stream: string }> = {}
    objs[1] = `<< /Type /Catalog /Pages 2 0 R >>`
    objs[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`
    objs[fontF1Id] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`
    objs[fontF2Id] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`

    this.pages.forEach((page, i) => {
      const pageId = pageIds[i]
      const contentId = contentIds[i]
      objs[pageId] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Resources << /Font << /F1 ${fontF1Id} 0 R /F2 ${fontF2Id} 0 R >> >> /Contents ${contentId} 0 R >>`
      objs[contentId] = { stream: page.ops.join('\n') }
    })

    const ids = Object.keys(objs).map(Number)
    const maxId = Math.max(...ids)
    const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n', 'latin1')]
    let pos = chunks[0].length
    const offsets = new Array(maxId + 1).fill(0)

    for (let id = 1; id <= maxId; id++) {
      const val = objs[id]
      if (val === undefined) continue
      offsets[id] = pos
      if (typeof val === 'string') {
        const buf = Buffer.from(`${id} 0 obj\n${val}\nendobj\n`, 'latin1')
        chunks.push(buf)
        pos += buf.length
      } else {
        const streamBytes = Buffer.from(val.stream, 'latin1')
        const head = Buffer.from(`${id} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`, 'latin1')
        const tail = Buffer.from(`\nendstream\nendobj\n`, 'latin1')
        chunks.push(head)
        pos += head.length
        chunks.push(streamBytes)
        pos += streamBytes.length
        chunks.push(tail)
        pos += tail.length
      }
    }

    const xrefStart = pos
    let xref = `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`
    for (let id = 1; id <= maxId; id++) xref += `${String(offsets[id] || 0).padStart(10, '0')} 00000 n \n`
    chunks.push(Buffer.from(xref, 'latin1'))
    chunks.push(Buffer.from(`trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`, 'latin1'))

    return Buffer.concat(chunks)
  }
}
