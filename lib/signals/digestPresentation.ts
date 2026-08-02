export type DigestConfidenceRow = {
  id: string
  quality_confidence: unknown
}

export function qualityConfidenceToPercent(value: unknown): number | null {
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN

  if (!Number.isFinite(numeric)) return null
  const percentage = numeric >= 0 && numeric <= 1 ? numeric * 100 : numeric
  return Math.round(Math.min(100, Math.max(0, percentage)))
}

export function buildDigestConfidenceMap(
  rows: readonly DigestConfidenceRow[] | null | undefined,
): Map<string, number> {
  const result = new Map<string, number>()
  for (const row of rows ?? []) {
    if (!row || typeof row.id !== 'string' || row.id.length === 0) continue
    const percentage = qualityConfidenceToPercent(row.quality_confidence)
    if (percentage !== null) result.set(row.id, percentage)
  }
  return result
}
