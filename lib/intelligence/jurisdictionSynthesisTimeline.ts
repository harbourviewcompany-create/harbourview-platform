import { inferEventEffectiveAt } from '@/lib/dashboard/signalFreshness'

const DAY_MS = 86_400_000
export const SYNTHESIS_PRIMARY_WINDOW_DAYS = 30
export const SYNTHESIS_FALLBACK_WINDOW_DAYS = 45
export const SYNTHESIS_UPCOMING_WINDOW_DAYS = 90

export type SynthesisTimelineRow = {
  headline: string
  // Quality-layer DTOs deliberately type translated fields as unknown at their
  // boundary. Timeline extraction narrows them before use rather than requiring
  // every caller to cast a partially trusted PostgREST row.
  title_en?: unknown
  summary_en?: unknown
  date?: string | null
  created_at?: string | null
  source_published_at?: string | null
  event_effective_at?: string | null
  observed_at?: string | null
  ingested_at?: string | null
}

function ms(value: string | null | undefined): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function explicitContentDateMs(row: SynthesisTimelineRow): number | null {
  const text = [row.title_en, row.headline, row.summary_en]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')

  const updated = text.match(/\bupdated\s+(?:on\s+)?([A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4})\b/i)?.[1]
  if (updated) {
    const parsed = ms(updated)
    if (parsed != null) return parsed
  }

  const published = text.match(/\bpublished\s+(?:on\s+)?([A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4})\b/i)?.[1]
  if (published) {
    const parsed = ms(published)
    if (parsed != null) return parsed
  }

  const leading = text.match(/^\s*([A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4})\b/)?.[1]
  return leading ? ms(leading) : null
}

export function resolveSynthesisEventAt(row: SynthesisTimelineRow): number | null {
  return ms(row.event_effective_at) ?? ms(inferEventEffectiveAt(row.headline))
}

/**
 * Evidence freshness answers "is this source/current observation recent enough
 * to use?". It is deliberately independent from the event-effective clock.
 * The only event-time override is the legacy rediscovery guard: when an old
 * effective event is paired with a much newer overloaded `date`, the old event
 * prevents the rediscovery from masquerading as fresh evidence.
 */
export function resolveSynthesisEvidenceAt(row: SynthesisTimelineRow, nowMs = Date.now()): number | null {
  const source = ms(row.source_published_at)
  if (source != null) return source

  const embedded = explicitContentDateMs(row)
  if (embedded != null) return embedded

  const event = resolveSynthesisEventAt(row)
  const legacy = ms(row.date)
  if (
    event != null
    && event <= nowMs
    && legacy != null
    && legacy - event > SYNTHESIS_FALLBACK_WINDOW_DAYS * DAY_MS
  ) return event

  return legacy
    ?? ms(row.observed_at)
    ?? ms(row.ingested_at)
    ?? ms(row.created_at)
    ?? (event != null && event <= nowMs ? event : null)
}

export type SynthesisTimelineClassification = {
  kind: 'recent' | 'upcoming' | 'out_of_window'
  evidenceAt: number | null
  eventAt: number | null
}

/**
 * Use the evidence clock only for freshness eligibility and the event clock only
 * for past/present versus upcoming classification. An article published today
 * about a rule effective next month is therefore eligible evidence but can only
 * enter `upcoming`, never `what_changed`.
 */
export function classifySynthesisTimeline(
  row: SynthesisTimelineRow,
  nowMs = Date.now(),
): SynthesisTimelineClassification {
  const evidenceAt = resolveSynthesisEvidenceAt(row, nowMs)
  const eventAt = resolveSynthesisEventAt(row)
  const lowerBound = nowMs - SYNTHESIS_FALLBACK_WINDOW_DAYS * DAY_MS

  if (evidenceAt == null || evidenceAt < lowerBound || evidenceAt > nowMs) {
    return { kind: 'out_of_window', evidenceAt, eventAt }
  }

  if (eventAt != null && eventAt > nowMs) {
    const upcomingUpperBound = nowMs + SYNTHESIS_UPCOMING_WINDOW_DAYS * DAY_MS
    return {
      kind: eventAt <= upcomingUpperBound ? 'upcoming' : 'out_of_window',
      evidenceAt,
      eventAt,
    }
  }

  return { kind: 'recent', evidenceAt, eventAt }
}
