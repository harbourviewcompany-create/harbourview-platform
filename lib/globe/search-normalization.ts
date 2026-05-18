export function normalizeSearchTerm(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .replace(/[/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenMatchesSearch(query: string, values: string[]) {
  const normalizedQuery = normalizeSearchTerm(query)

  if (!normalizedQuery) return true

  return values.some((value) => normalizeSearchTerm(value).includes(normalizedQuery))
}
