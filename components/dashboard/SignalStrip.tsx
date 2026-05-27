'use client'

import Link from 'next/link'

export interface SignalItem {
  country: string
  type: 'regulatory' | 'market' | 'trade' | 'commercial'
  direction: 'liberalizing' | 'commercial' | 'stable'
  headline: string
  time: string
}

const SIGNALS: SignalItem[] = [
  { country: 'Germany',     type: 'regulatory', direction: 'liberalizing', headline: 'BfArM Q3 2026 import quota allocations published',                       time: 'Today' },
  { country: 'Australia',   type: 'market',     direction: 'commercial',   headline: 'TGA SAS-B approval times falling — avg under 48h for established products', time: 'Today' },
  { country: 'Netherlands', type: 'regulatory', direction: 'liberalizing', headline: 'OMC pilot expanding to 10 additional municipalities from July 2026',       time: 'Yesterday' },
  { country: 'UK',          type: 'market',     direction: 'commercial',   headline: 'Project Twenty21 expansion: 50,000 patient milestone reached',             time: '2 days ago' },
  { country: 'Colombia',    type: 'trade',      direction: 'commercial',   headline: 'EU–Colombia bilateral protocol draft published for comment',               time: '3 days ago' },
  { country: 'Canada',      type: 'market',     direction: 'stable',       headline: 'Health Canada Export Development Fund round 3 applications open',         time: '3 days ago' },
  { country: 'France',      type: 'regulatory', direction: 'liberalizing', headline: 'ANSM medical programme framework legislation tabled',                      time: '4 days ago' },
  { country: 'Brazil',      type: 'market',     direction: 'commercial',   headline: 'ANVISA approves two new imported CBD formulations',                        time: '5 days ago' },
  { country: 'Israel',      type: 'trade',      direction: 'commercial',   headline: 'Israeli growers meet EU pharmaceutical delegation — EUGMP agenda',         time: '5 days ago' },
  { country: 'Thailand',    type: 'regulatory', direction: 'stable',       headline: 'FDA Thailand publishes revised medical-only reclassification draft',       time: '6 days ago' },
]

const TYPE_COLORS: Record<string, string> = {
  regulatory: 'border-sky-500/30 text-sky-400 bg-sky-500/[0.06]',
  market:     'border-emerald-500/30 text-emerald-400 bg-emerald-500/[0.06]',
  trade:      'border-amber-500/30 text-amber-400 bg-amber-500/[0.06]',
  commercial: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/[0.06]',
}

const DIR_ICON: Record<string, string> = {
  liberalizing: '↗',
  commercial:   '↗',
  stable:       '→',
}
const DIR_COLOR: Record<string, string> = {
  liberalizing: '#5dcaa5',
  commercial:   'var(--hv-champagne-400)',
  stable:       'rgba(243,240,234,0.35)',
}

export function SignalStrip() {
  return (
    <aside
      className="flex flex-col gap-3 overflow-y-auto px-3.5 py-4"
      style={{ borderLeft: '1px solid rgba(198,165,90,0.15)', background: 'rgba(6,13,24,0.5)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.55)' }}>
          Today’s signals
        </span>
        <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.1em]" style={{ color: 'rgba(93,202,165,0.7)' }}>
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live
        </span>
      </div>

      {/* Cards */}
      {SIGNALS.map((s, i) => (
        <div key={i}>
          {i === 3 && (
            <div
              className="mb-2 pb-1 text-[9px] uppercase tracking-[0.1em]"
              style={{ color: 'rgba(198,165,90,0.35)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              Earlier this week
            </div>
          )}
          <div
            className="cursor-pointer rounded-xl p-3 transition-all hover:border-[rgba(198,165,90,0.25)]"
            style={{ background: 'rgba(13,32,55,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <span className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>
                {s.country}
              </span>
              <span className={`rounded-full border px-1.5 py-0.5 text-[8px] uppercase tracking-[0.06em] ${TYPE_COLORS[s.type]}`}>
                {s.type}
              </span>
            </div>
            <p className="text-[11px] leading-snug" style={{ color: 'var(--hv-text-primary)' }}>
              {s.headline}
            </p>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[9px]" style={{ color: 'rgba(243,240,234,0.3)' }}>{s.time}</span>
              <span className="text-[9px] font-medium" style={{ color: DIR_COLOR[s.direction] }}>
                {DIR_ICON[s.direction]} {s.direction}
              </span>
            </div>
          </div>
        </div>
      ))}

      <Link
        href="/signals"
        className="mt-1 text-center text-[10px] transition-opacity hover:opacity-80"
        style={{ color: 'rgba(198,165,90,0.45)' }}
      >
        View all intelligence →
      </Link>
    </aside>
  )
}
