export type StructuredSourceMetadata = {
  records_path?: string
  identity_path?: string
  title_path?: string
  url_path?: string
  record_url_template?: string
  max_records?: number
}

export type StructuredSnapshotCandidate = {
  captured_url: string
  captured_title: string
  captured_text: string
}

function getPath(value: unknown, path: string | undefined): unknown {
  if (!path) return undefined
  return path.split('.').reduce<unknown>((current, key) => {
    if (current == null || typeof current !== 'object' || Array.isArray(current)) return undefined
    return (current as Record<string, unknown>)[key]
  }, value)
}

function scalar(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return null
}

function renderRecordUrl(template: string | undefined, identity: string | null, explicitUrl: string | null, fallbackUrl: string): string {
  if (explicitUrl) {
    try {
      return new URL(explicitUrl, fallbackUrl).toString()
    } catch {
      // Keep the canonical source URL if an upstream URL is malformed.
    }
  }
  if (template && identity) return template.replaceAll('{id}', encodeURIComponent(identity))
  return identity ? `${fallbackUrl}#${encodeURIComponent(identity)}` : fallbackUrl
}

/**
 * Split a structured JSON API response into stable per-record snapshot candidates.
 *
 * The source registry metadata supplies the record-array path and stable identity/title
 * paths. Each record becomes its own snapshot, which prevents a large API payload from
 * being truncated into one opaque 24 KB page and makes change detection record-level.
 */
export function parseStructuredJson(
  raw: string,
  fallbackUrl: string,
  metadata: StructuredSourceMetadata = {},
): StructuredSnapshotCandidate[] {
  const parsed = JSON.parse(raw) as unknown
  const recordsValue = metadata.records_path ? getPath(parsed, metadata.records_path) : parsed
  const records = Array.isArray(recordsValue) ? recordsValue : [recordsValue]
  const configuredMax = Number.isFinite(metadata.max_records) ? Math.trunc(metadata.max_records as number) : 100
  const maxRecords = Math.max(1, Math.min(configuredMax, 250))

  return records
    .filter((record) => record != null)
    .slice(0, maxRecords)
    .map((record, index) => {
      const identity = scalar(getPath(record, metadata.identity_path)) ?? `record-${index + 1}`
      const title = scalar(getPath(record, metadata.title_path)) ?? identity
      const explicitUrl = scalar(getPath(record, metadata.url_path))
      const capturedUrl = renderRecordUrl(metadata.record_url_template, identity, explicitUrl, fallbackUrl)
      const capturedText = JSON.stringify(record)

      return {
        captured_url: capturedUrl,
        captured_title: title.slice(0, 500),
        captured_text: capturedText.slice(0, 64000),
      }
    })
    .filter((candidate) => candidate.captured_text.length >= 2)
}
