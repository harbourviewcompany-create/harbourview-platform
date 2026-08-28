import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { canonicalMarketId } from '@/lib/utils/flagEmoji'

const DAY_MS = 86_400_000
export const WEEKLY_SIGNAL_WINDOW_DAYS = 7

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
}

function timestamp(value: string | null | undefined): number | null {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

function toIso(ms: number | null): string | undefined {
  return ms == null ? undefined : new Date(ms).toISOString()
}

function normalizedScope(value: string) {
  return value.trim().toLowerCase()
}

export function isGlobalSignalScope(value: string) {
  const scope = normalizedScope(value)
  return !scope
    || scope === 'all'
    || scope === 'global'
    || scope === 'global market'
    || scope === 'select jurisdiction'
}

export function inferEventEffectiveAt(title: string): string | undefined {
  const text = title.replace(/\s+/g, ' ').trim()
  if (!text) return undefined

  const isoMatch = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/)
  if (isoMatch) {
    const context = text.slice(Math.max(0, (isoMatch.index ?? 0) - 48), isoMatch.index)
    if (/effective|takes? effect|begins?|starts?|deadline|from|by\s*$/i.test(context)) {
      const ms = Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
      return toIso(ms)
    }
  }

  const monthPattern = '(January|February|March|April|May|June|July|August|September|October|November|December)'
  const re = new RegExp(`${monthPattern}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,)?\\s+(20\\d{2})`, 'i')
  const match = re.exec(text)
  if (!match) return undefined

  const context = text.slice(Math.max(0, (match.index ?? 0) - 56), match.index)
  if (!/effective|takes? effect|begins?|starts?|deadline|from|by\s*$/i.test(context)) return undefined

  const month = MONTHS[match[1].toLowerCase()]
  if (month == null) return undefined
  const ms = Date.UTC(Number(match[3]), month, Number(match[2]))
  return toIso(ms)
}

function relativeAgeTimestamp(value: string | undefined, nowMs: number): number | null {
  const text = (value ?? '').trim().toLowerCase()
  if (!text) return null
  if (text === 'just now' || text === 'recently') return nowMs
  const match = text.match(/^(\d+)\s*(h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks)\s+ago$/)
  if (!match) return null
  const amount = Number(match[1])
  const unit = match[2]
  if (!Number.isFinite(amount)) return null
  const multiplier = unit.startsWith('h')
    ? 3_600_000
    : unit.startsWith('d')
      ? DAY_MS
      : 7 * DAY_MS
  return nowMs - amount * multiplier
}

export type SignalFreshnessResolution = {
  at?: string
  basis?: DashboardSignal['freshnessBasis']
}

export function resolveSignalFreshness(signal: DashboardSignal, nowMs = Date.now()): SignalFreshnessResolution {
  const explicitSource = timestamp(signal.sourcePublishedAt)
  if (explicitSource != null) return { at: toIso(explicitSource), basis: 'source_published' }

  const explicitEvent = timestamp(signal.eventEffectiveAt)
  const inferredEvent = timestamp(inferEventEffectiveAt(signal.title))
  const event = explicitEvent ?? inferredEvent
  const legacyPublished = timestamp(signal.publishedAt)

  // Legacy `date` values were historically overloaded with observation time.
  // If the headline itself carries a materially older effective date and no
  // explicit source publication timestamp exists, trust the event date instead
  // of presenting a rediscovery as a new development.
  if (
    event != null
    && legacyPublished != null
    && legacyPublished - event > 45 * DAY_MS
  ) {
    return { at: toIso(event), basis: 'event_effective' }
  }

  if (legacyPublished != null) return { at: toIso(legacyPublished), basis: 'legacy_date' }
  if (event != null) return { at: toIso(event), basis: 'event_effective' }

  const observed = timestamp(signal.observedAt)
  if (observed != null) return { at: toIso(observed), basis: 'observed' }

  const ingested = timestamp(signal.ingestedAt)
  if (ingested != null) return { at: toIso(ingested), basis: 'ingested' }

  // Older server DTOs and deterministic fixtures may only carry a rendered age.
  // Preserve them without inventing a publication date, while explicit/inferred
  // event dates above still override misleading rediscovery labels.
  const relative = relativeAgeTimestamp(signal.timeAgo, nowMs)
  if (relative != null) return { at: toIso(relative), basis: 'relative_age' }

  return {}
}

export function formatSignalAge(value: string | undefined, nowMs = Date.now()): string {
  const ms = timestamp(value)
  if (ms == null) return 'Date unknown'
  const diff = nowMs - ms
  if (diff < 0) {
    const days = Math.ceil(Math.abs(diff) / DAY_MS)
    return days <= 1 ? 'Upcoming' : `In ${days}d`
  }
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

/**
 * Convert a persisted jurisdiction value into canonical tokens without using
 * substring semantics. Public signals commonly store multi-jurisdiction values
 * such as `United States; Michigan`; those must remain matchable while `US`
 * must never match `Australia`.
 */
export function jurisdictionTokens(value: string | null | undefined): string[] {
  const raw = value?.trim()
  if (!raw) return []
  const parts = raw.split(/\s*(?:;|\||\/)\s*/).map(part => part.trim()).filter(Boolean)
  const tokens = parts
    .map(part => canonicalMarketId(part))
    .filter((token): token is string => Boolean(token))
  return [...new Set(tokens)]
}

export function jurisdictionValueMatches(value: string | null | undefined, target: string) {
  const targetId = canonicalMarketId(target)
  if (!targetId) return false
  return jurisdictionTokens(value).includes(targetId)
}

function isGlobalSignal(signal: DashboardSignal) {
  const values = [signal.market, ...(signal.jurisdictions ?? [])]
  return values.some(value => {
    const normalized = value?.trim().toLowerCase()
    return normalized === 'global' || normalized === 'global market'
  })
}

export function signalMatchesJurisdiction(signal: DashboardSignal, countryLabel: string) {
  if (isGlobalSignalScope(countryLabel)) return false
  if (jurisdictionValueMatches(signal.market, countryLabel)) return true
  return (signal.jurisdictions ?? []).some(jurisdiction => jurisdictionValueMatches(jurisdiction, countryLabel))
}

function dedupeKey(signal: DashboardSignal) {
  if (signal.sourceUrl) {
    try {
      const url = new URL(signal.sourceUrl)
      url.hash = ''
      for (const key of [...url.searchParams.keys()]) {
        if (/^(utm_.+|fbclid|gclid)$/i.test(key)) url.searchParams.delete(key)
      }
      url.searchParams.sort()
      return `url:${url.toString().replace(/\/$/, '')}`
    } catch {
      // Fall through to the title key.
    }
  }
  const title = signal.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const market = jurisdictionTokens(signal.market).join('|')
    || (canonicalMarketId(signal.market) ?? '').replace(/[^a-z0-9:]+/g, ' ').trim()
  return `title:${market}:${title}`
}

export function canonicalizeDashboardSignals(
  input: DashboardSignal[],
  countryLabel: string,
  options: { windowDays?: number; limit?: number; nowMs?: number } = {},
): DashboardSignal[] {
  const nowMs = options.nowMs ?? Date.now()
  const windowDays = options.windowDays ?? WEEKLY_SIGNAL_WINDOW_DAYS
  const lowerBound = nowMs - windowDays * DAY_MS
  const globalScope = isGlobalSignalScope(countryLabel)

  const prepared = input
    .map((signal, index) => {
      const freshness = resolveSignalFreshness(signal, nowMs)
      const freshnessMs = timestamp(freshness.at)
      return {
        signal: {
          ...signal,
          freshnessAt: freshness.at,
          freshnessBasis: freshness.basis,
          timeAgo: formatSignalAge(freshness.at, nowMs),
        },
        index,
        freshnessMs,
        contextual: signalMatchesJurisdiction(signal, countryLabel),
        global: isGlobalSignal(signal),
      }
    })
    // Weekly Signals is a current-development surface. A future-only effective
    // date is not current evidence and belongs in forward-looking briefing data.
    .filter(entry => entry.freshnessMs != null && entry.freshnessMs >= lowerBound && entry.freshnessMs <= nowMs)
    // A selected jurisdiction is a strict scope, not a ranking hint. Keep exact
    // selected-jurisdiction rows plus genuinely Global rows only.
    .filter(entry => globalScope || entry.contextual || entry.global)
    .sort((a, b) => {
      if (!globalScope && a.contextual !== b.contextual) {
        return Number(b.contextual) - Number(a.contextual)
      }
      const recency = (b.freshnessMs ?? 0) - (a.freshnessMs ?? 0)
      if (recency) return recency
      const confidence = (b.signal.confidence ?? 0) - (a.signal.confidence ?? 0)
      return confidence || a.index - b.index
    })

  const seen = new Set<string>()
  const deduped: DashboardSignal[] = []
  for (const entry of prepared) {
    const key = dedupeKey(entry.signal)
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(entry.signal)
    if (options.limit && deduped.length >= options.limit) break
  }

  return deduped
}
