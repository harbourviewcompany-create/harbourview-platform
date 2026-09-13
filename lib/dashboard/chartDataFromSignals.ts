import type { CommandCentreSignal } from '@/lib/dashboard/commandCentreLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'

export type TimelinePoint = {
  date: string
  signals: number
  score: number
  country?: string
  id?: string
  type?: 'regulatory' | 'opportunity' | 'market'
}

export type OpportunityBar = {
  country: string
  score: number
  signals: number
  riskLevel?: 'low' | 'medium' | 'high'
  trend?: 'up' | 'down' | 'stable'
  id?: string
}

function formatDateKey(raw: string): string {
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10)
  return d.toISOString().slice(0, 10)
}

function riskFromScore(score: number): 'low' | 'medium' | 'high' {
  if (score >= 75) return 'low'
  if (score >= 50) return 'medium'
  return 'high'
}

function resolveSignalDate(signal: DashboardSignal): string {
  return (
    signal.freshnessAt ||
    signal.sourcePublishedAt ||
    signal.eventEffectiveAt ||
    signal.publishedAt ||
    signal.observedAt ||
    signal.ingestedAt ||
    new Date().toISOString()
  )
}

function resolveCountry(signal: DashboardSignal): string {
  if (signal.jurisdiction?.trim()) return signal.jurisdiction.trim().toUpperCase()
  if (signal.jurisdictions?.length) return String(signal.jurisdictions[0]).toUpperCase()
  if (signal.market?.trim()) return signal.market.trim().toUpperCase()
  return 'UNKNOWN'
}

/**
 * Live feed path: DashboardSignal[] from /api/dashboard/signals
 * (same DTO as Command Centre Weekly Signals).
 */
export function chartDataFromDashboardSignals(signals: DashboardSignal[]): {
  timeline: TimelinePoint[]
  opportunities: OpportunityBar[]
} {
  const byDate = new Map<string, { count: number; scoreSum: number; country?: string; id?: string }>()
  const byCountry = new Map<string, { count: number; scoreSum: number; id?: string }>()

  for (const signal of signals) {
    const dateKey = formatDateKey(resolveSignalDate(signal))
    const score = Number.isFinite(signal.confidence) ? Math.round(signal.confidence) : 0
    const country = resolveCountry(signal)

    const dateBucket = byDate.get(dateKey) ?? { count: 0, scoreSum: 0 }
    dateBucket.count += 1
    dateBucket.scoreSum += score
    dateBucket.country = country
    dateBucket.id = signal.id
    byDate.set(dateKey, dateBucket)

    const countryBucket = byCountry.get(country) ?? { count: 0, scoreSum: 0 }
    countryBucket.count += 1
    countryBucket.scoreSum += score
    countryBucket.id = signal.id
    byCountry.set(country, countryBucket)
  }

  const timeline: TimelinePoint[] = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, bucket]) => ({
      date,
      signals: bucket.count,
      score: bucket.count ? Math.round(bucket.scoreSum / bucket.count) : 0,
      country: bucket.country,
      id: bucket.id,
      type: 'market' as const,
    }))

  const opportunities: OpportunityBar[] = [...byCountry.entries()]
    .map(([country, bucket]) => {
      const score = bucket.count ? Math.round(bucket.scoreSum / bucket.count) : 0
      return {
        country,
        score,
        signals: bucket.count,
        riskLevel: riskFromScore(score),
        trend: 'stable' as const,
        id: bucket.id,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)

  return { timeline, opportunities }
}

/**
 * Legacy / admin path: CommandCentreSignal[] from commandCentreLiveData.
 */
export function chartDataFromSignals(signals: CommandCentreSignal[]): {
  timeline: TimelinePoint[]
  opportunities: OpportunityBar[]
} {
  const byDate = new Map<string, { count: number; scoreSum: number; country?: string; id?: string }>()
  const byCountry = new Map<string, { count: number; scoreSum: number; id?: string }>()

  for (const signal of signals) {
    const dateKey = formatDateKey(signal.date)
    const score = Number.isFinite(signal.score) ? signal.score : 0

    const dateBucket = byDate.get(dateKey) ?? { count: 0, scoreSum: 0 }
    dateBucket.count += 1
    dateBucket.scoreSum += score
    if (signal.country) dateBucket.country = signal.country
    if (signal.id) dateBucket.id = signal.id
    byDate.set(dateKey, dateBucket)

    const countryKey = (signal.country || 'Unknown').toUpperCase()
    const countryBucket = byCountry.get(countryKey) ?? { count: 0, scoreSum: 0 }
    countryBucket.count += 1
    countryBucket.scoreSum += score
    if (signal.id) countryBucket.id = signal.id
    byCountry.set(countryKey, countryBucket)
  }

  const timeline: TimelinePoint[] = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, bucket]) => ({
      date,
      signals: bucket.count,
      score: bucket.count ? Math.round(bucket.scoreSum / bucket.count) : 0,
      country: bucket.country ?? undefined,
      id: bucket.id,
      type: 'market' as const,
    }))

  const opportunities: OpportunityBar[] = [...byCountry.entries()]
    .map(([country, bucket]) => {
      const score = bucket.count ? Math.round(bucket.scoreSum / bucket.count) : 0
      return {
        country,
        score,
        signals: bucket.count,
        riskLevel: riskFromScore(score),
        trend: 'stable' as const,
        id: bucket.id,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)

  return { timeline, opportunities }
}
