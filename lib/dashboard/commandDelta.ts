/**
 * Since-last-visit state for the Command overview.
 *
 * Implements docs/COMMAND_SURFACE_SPEC.md §4.1. The overview previously showed
 * three inventory counters ("Attention 9 / Recent intelligence 1") that were
 * identical on every visit by every user in a jurisdiction. This module turns
 * the per-user `command_last_viewed_at` stamp into the one thing a command
 * surface owes its reader: what changed since they last looked.
 *
 * WHAT IS DELIBERATELY NOT COUNTED
 * --------------------------------
 * Marketplace opportunities. `NormalizedListing` carries no timestamp of any
 * kind, so "2 new opportunities" could only ever be guessed. Spec §3 is explicit
 * that this surface must not present unverifiable freshness, so opportunities
 * keep a plain count and stay out of the delta. Restoring them to it requires a
 * listing timestamp in the projection first, not a heuristic here.
 *
 * ON TIMESTAMP TRUST
 * ------------------
 * Spec §3 records that signal freshness is frequently batch-assigned at pipeline
 * run time (196 reviewed rows across 41 countries carried 12 distinct timestamps
 * on 2026-09-16). `freshnessBasis` is the repository's own record of how much a
 * given row's timestamp is worth, so `describeFreshness` renders an observed or
 * ingested stamp as "observed", never as publication. A delta built on these
 * timestamps is honest about being a delta of *what the pipeline recorded*.
 */

/** Matches DashboardSignal['freshnessBasis']; kept structural so this module stays dependency-free. */
export type FreshnessBasis =
  | 'source_published'
  | 'event_effective'
  | 'legacy_date'
  | 'observed'
  | 'ingested'
  | 'relative_age'

export type DeltaSignal = {
  freshnessAt?: string
  freshnessBasis?: FreshnessBasis | string
  timeAgo?: string
}

export type CommandDelta = {
  /**
   * `first-visit` — no stored stamp, so no delta can be claimed; show counts.
   * `quiet`       — a stamp exists and genuinely nothing is new since it.
   * `changed`     — at least one new signal or watch-rule hit since the stamp.
   */
  state: 'first-visit' | 'quiet' | 'changed'
  /** Human phrase for the stamp, e.g. "Since Tuesday". Empty on first visit. */
  sinceLabel: string
  newSignals: number
  watchRuleHits: number
}

const DAY_MS = 86_400_000
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** Timestamps a reader may fairly read as "when this happened". */
const PUBLICATION_BASES = new Set<string>(['source_published', 'event_effective'])

function parse(value: string | null | undefined): number | null {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? null : ms
}

/** Calendar days between two instants, in the reader's own timezone. */
function calendarDaysBetween(earlierMs: number, laterMs: number): number {
  const a = new Date(earlierMs)
  const b = new Date(laterMs)
  const aMidnight = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const bMidnight = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return Math.round((bMidnight - aMidnight) / DAY_MS)
}

/**
 * "Since earlier today" / "Since yesterday" / "Since Tuesday" / "Since 12 Sep".
 *
 * Weekday naming is only used inside six days, past which a weekday is ambiguous
 * ("Tuesday" could be this week or last) and an explicit date is clearer.
 */
export function formatSinceLabel(lastViewedAt: string | null | undefined, nowMs: number = Date.now()): string {
  const stampMs = parse(lastViewedAt)
  if (stampMs === null || stampMs > nowMs) return ''

  const days = calendarDaysBetween(stampMs, nowMs)
  if (days <= 0) return 'Since earlier today'
  if (days === 1) return 'Since yesterday'
  if (days < 7) return `Since ${WEEKDAYS[new Date(stampMs).getDay()]}`

  const stamp = new Date(stampMs)
  return `Since ${stamp.getDate()} ${MONTHS[stamp.getMonth()]}`
}

/**
 * Whether a signal is new relative to the stored view stamp.
 * A signal with no resolvable freshness is never counted as new — an unknown
 * timestamp is not evidence of recency.
 */
export function isNewSince(signal: DeltaSignal, lastViewedAt: string | null | undefined): boolean {
  const stampMs = parse(lastViewedAt)
  if (stampMs === null) return false
  const freshnessMs = parse(signal.freshnessAt)
  if (freshnessMs === null) return false
  return freshnessMs > stampMs
}

/**
 * Age phrasing that does not overstate what the timestamp means.
 *
 * A `source_published` or `event_effective` stamp is a real event time, so its
 * age reads plainly ("2 days ago"). Everything else is Harbourview's own
 * observation of a row and is labelled as such, per spec §4.3.
 */
export function describeFreshness(signal: DeltaSignal): string {
  const age = signal.timeAgo?.trim()
  if (!age) return ''
  const basis = typeof signal.freshnessBasis === 'string' ? signal.freshnessBasis : ''
  if (PUBLICATION_BASES.has(basis)) return age
  return `Observed ${age}`
}

export function buildCommandDelta({
  signals,
  watchRuleHits = 0,
  lastViewedAt,
  nowMs = Date.now(),
}: {
  signals: DeltaSignal[]
  watchRuleHits?: number
  lastViewedAt?: string | null
  nowMs?: number
}): CommandDelta {
  const sinceLabel = formatSinceLabel(lastViewedAt, nowMs)

  if (!sinceLabel) {
    return { state: 'first-visit', sinceLabel: '', newSignals: 0, watchRuleHits }
  }

  const newSignals = signals.reduce(
    (count, signal) => (isNewSince(signal, lastViewedAt) ? count + 1 : count),
    0,
  )

  return {
    state: newSignals > 0 || watchRuleHits > 0 ? 'changed' : 'quiet',
    sinceLabel,
    newSignals,
    watchRuleHits,
  }
}

/** Sentence for the delta line. Callers render the empty string as "no delta line". */
export function formatDeltaSentence(delta: CommandDelta): string {
  if (delta.state === 'first-visit') return ''

  const parts: string[] = []
  if (delta.newSignals > 0) {
    parts.push(`${delta.newSignals} new ${delta.newSignals === 1 ? 'signal' : 'signals'}`)
  }
  if (delta.watchRuleHits > 0) {
    parts.push(`${delta.watchRuleHits} watch ${delta.watchRuleHits === 1 ? 'rule' : 'rules'} fired`)
  }

  if (parts.length === 0) return `${delta.sinceLabel}: nothing new in this context`
  return `${delta.sinceLabel}: ${parts.join(' · ')}`
}
