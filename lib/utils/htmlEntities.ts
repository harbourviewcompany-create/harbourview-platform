const NAMED_HTML_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  apos: "'",
  bull: '•',
  copy: '©',
  euro: '€',
  gt: '>',
  hellip: '…',
  ldquo: '“',
  lsquo: '‘',
  lt: '<',
  mdash: '—',
  middot: '·',
  nbsp: '\u00a0',
  ndash: '–',
  pound: '£',
  quot: '"',
  rdquo: '”',
  reg: '®',
  rsquo: '’',
  trade: '™',
  yen: '¥',
}

function decodeNumericEntity(token: string): string | null {
  const hexadecimal = token[1]?.toLowerCase() === 'x'
  const digits = hexadecimal ? token.slice(2) : token.slice(1)
  const codePoint = Number.parseInt(digits, hexadecimal ? 16 : 10)
  if (
    !Number.isInteger(codePoint) ||
    codePoint < 0 ||
    codePoint > 0x10ffff ||
    (codePoint >= 0xd800 && codePoint <= 0xdfff)
  ) {
    return null
  }
  return String.fromCodePoint(codePoint)
}

export function decodeHtmlEntities(raw: string): string {
  return raw.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi,
    (entity, token: string) => {
      if (token.startsWith('#')) return decodeNumericEntity(token) ?? entity
      return NAMED_HTML_ENTITIES[token.toLowerCase()] ?? entity
    },
  )
}

export function cleanPlainText(raw: string, maxLength: number): string {
  return decodeHtmlEntities(
    raw
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\u00a0/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLength)
}
