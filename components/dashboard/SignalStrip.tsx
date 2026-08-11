'use client'

import Link from 'next/link'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { SignalFeedbackButtons } from '@/components/dashboard/SignalFeedbackButtons'

export type { DashboardSignal }

const TYPE_COLORS: Record<string, string> = {
  REGULATION:   'border-amber-500/30   text-amber-400   bg-amber-500/[0.06]',
  MARKET:       'border-emerald-500/30 text-emerald-400 bg-emerald-500/[0.06]',
  TRADE:        'border-violet-500/30  text-violet-400  bg-violet-500/[0.06]',
  COMPLIANCE:   'border-sky-500/30     text-sky-400     bg-sky-500/[0.06]',
  'SUPPLY CHAIN':'border-orange-500/30 text-orange-400  bg-orange-500/[0.06]',
  INVESTMENT:   'border-blue-500/30    text-blue-400    bg-blue-500/[0.06]',
  INTEL:        'border-yellow-500/30  text-yellow-400  bg-yellow-500/[0.06]',
  STORY:        'border-amber-400/30   text-amber-300   bg-amber-400/[0.06]',
  RESEARCH:     'border-sky-400/30     text-sky-300     bg-sky-400/[0.06]',
  NEWS:         'border-stone-400/30   text-stone-300   bg-stone-400/[0.06]',
}

function PulseDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
    </span>
  )
}

function qualityMeta(s: DashboardSignal): string {
  const parts: string[] = []
  if (s.corroborationCount && s.corroborationCount > 1) {
    parts.push(`${s.corroborationCount} sources`)
  }
  if (s.translated && s.originalLanguageLabel) {
    parts.push(`via ${s.originalLanguageLabel}`)
  }
  return parts.length ? ` · ${parts.join(' · ')}` : ''
}

/** Hours since event from DashboardSignal.timeAgo strings. Mirrors quality.ts bands. */
function hoursFromTimeAgo(timeAgo: string): number | null {
  const t = timeAgo.trim()
  if (t === 'Just now') return 0
  const h = /^(\d+)h ago$/i.exec(t)
  if (h) return Number(h[1])
  const d = /^(\d+)d ago$/i.exec(t)
  if (d) return Number(d[1]) * 24
  const w = /^(\d+)w ago$/i.exec(t)
  if (w) return Number(w[1]) * 24 * 7
  return null
}

type FeedFreshness = 'live' | 'recent' | 'stale' | 'unknown'

function inferFeedFreshness(signals: DashboardSignal[]): FeedFreshness {
  if (signals.length === 0) return 'unknown'
  let newest = Number.POSITIVE_INFINITY
  let any = false
  for (const s of signals) {
    const hours = hoursFromTimeAgo(s.timeAgo)
    if (hours === null) continue
    any = true
    if (hours < newest) newest = hours
  }
  if (!any) return 'unknown'
  if (newest <= 36) return 'live'
  if (newest <= 24 * 5) return 'recent'
  return 'stale'
}

function FreshnessBadge({ band, isLive }: { band: FeedFreshness; isLive: boolean }) {
  // Prefer content-derived band; fall back to parent isLive only when unknown.
  const effective: FeedFreshness =
    band !== 'unknown' ? band : isLive ? 'live' : 'unknown'

  if (effective === 'live') {
    return (
      <span className="flex items-center gap-1.5 text-[9px]" style={{ color: 'rgba(93,202,165,0.65)' }}>
        <PulseDot />
        <span className="uppercase tracking-[0.1em]">Live</span>
      </span>
    )
  }
  if (effective === 'recent') {
    return (
      <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: 'rgba(198,165,90,0.55)' }}>
        Recent
      </span>
    )
  }
  if (effective === 'stale') {
    return (
      <span
        className="text-[9px] uppercase tracking-[0.1em]"
        style={{ color: 'rgba(224,128,128,0.75)' }}
        title="Newest signal in this strip is older than 5 days"
      >
        Stale
      </span>
    )
  }
  return (
    <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: 'rgba(243,240,234,0.2)' }}>
      Updating
    </span>
  )
}

export interface SignalStripProps {
  signals?: DashboardSignal[]
  isLive?: boolean
}

export function SignalStrip({ signals = [], isLive = false }: SignalStripProps) {
  const freshness = inferFeedFreshness(signals)

  return (
    <aside
      className="flex flex-col overflow-y-auto px-3.5 py-4"
      style={{ borderLeft: '1px solid rgba(198,165,90,0.1)', background: 'rgba(4,9,18,0.6)' }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
          Market signals
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/signals/search"
            className="text-[9px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
            style={{ color: 'rgba(198,165,90,0.55)' }}
            title="Semantic search over reviewed signals (Intel / Operator)"
          >
            Search
          </Link>
          <FreshnessBadge band={freshness} isLive={isLive} />
        </div>
      </div>

      {freshness === 'stale' && signals.length > 0 && (
        <p
          className="mb-2 text-[9px] leading-snug"
          style={{ color: 'rgba(224,128,128,0.65)' }}
        >
          Feed content is older than 5 days. Ops monitors alert on promotion silence; search the corpus for the latest match.
        </p>
      )}

      {signals.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2">
          <p className="text-center text-[10px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.35)' }}>
            No quality-gated signals in this view yet. New items appear after classify + promote.
          </p>
          <Link href="/dashboard/signals/search" className="text-[10px]" style={{ color: 'rgba(198,165,90,0.55)' }}>
            Search the corpus →
          </Link>
          <Link href="/signals" className="text-[10px]" style={{ color: 'rgba(198,165,90,0.45)' }}>
            Browse all signals →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {signals.map((s) => {
            const tagClass = TYPE_COLORS[s.tag.label] ?? TYPE_COLORS.INTEL
            return (
              <div
                key={s.id}
                className="rounded-xl p-2.5 transition-all hover:border-[rgba(198,165,90,0.2)]"
                style={{ background: 'rgba(10,20,38,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="mb-1.5 flex items-center justify-between gap-1.5">
                  <span className="truncate text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: '#f0d39a' }}>
                    {s.flag ? `${s.flag} ` : ''}{s.market}
                  </span>
                  <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[7px] uppercase tracking-[0.06em] ${tagClass}`}>
                    {s.tag.label}
                  </span>
                </div>

                <p className="mb-1.5 text-[10px] leading-snug" style={{ color: 'rgba(243,240,234,0.72)' }}>
                  {s.title}
                </p>

                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px]" style={{ color: 'rgba(243,240,234,0.25)' }}>
                    {s.confidence}% conf{qualityMeta(s)} · {s.timeAgo}
                  </span>
                </div>
                <SignalFeedbackButtons signalId={s.id} surface="signals" />
              </div>
            )
          })}
        </div>
      )}

      {signals.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          <Link
            href="/dashboard/signals/search"
            className="block text-center text-[10px] transition-opacity hover:opacity-80"
            style={{ color: 'rgba(198,165,90,0.5)' }}
          >
            Search signals →
          </Link>
          <Link
            href="/signals"
            className="block text-center text-[10px] transition-opacity hover:opacity-80"
            style={{ color: 'rgba(198,165,90,0.38)' }}
          >
            All signals →
          </Link>
        </div>
      )}
    </aside>
  )
}
