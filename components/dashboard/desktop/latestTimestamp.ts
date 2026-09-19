/** Pick the newest ISO-ish timestamp from heterogeneous records. */
export function latestTimestamp(
  rows: Array<Record<string, unknown> | null | undefined> | null | undefined,
  keys: string[] = ['observedAt', 'publishedAt', 'updatedAt', 'createdAt', 'updated_at', 'published_at', 'last_changed_at', 'created_at'],
): string | null {
  if (!rows?.length) return null
  let best: string | null = null
  let bestMs = -Infinity
  for (const row of rows) {
    if (!row) continue
    for (const key of keys) {
      const raw = row[key]
      if (typeof raw !== 'string' || !raw) continue
      const ms = Date.parse(raw)
      if (Number.isFinite(ms) && ms > bestMs) {
        bestMs = ms
        best = raw
      }
    }
  }
  return best
}
