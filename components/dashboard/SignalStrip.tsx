\'use client\'

import Link from 'next/link'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'

export type { DashboardSignal }

// ── Visual mappings ───────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  REGULATION:   'border-amber-500/30   text-amber-400   bg-amber-500/[0.06]',
  MARKET:       'border-emerald-500/30 text-emerald-400 bg-emerald-500/[0.06]',
  TRADE:        'border-violet-500/30  text-violet-400  bg-violet-500/[0.06]',
  COMPLIANCE:   'border-sky-500/30     text-sky-400     bg-sky-500/[0.06]',
  'SUPPLY CHAIN':'border-orange-500/30 text-orange-400  bg-orange-500/[0.06]',
  INVESTMENT:   'border-blue-500/30    text-blue-400    bg-blue-500/[0.06]',
  INTEL:        'border-yellow-500/30  text-yellow-400  bg-yellow-500/[0.06]',
}

const IMPACT_COLOR: Record<string, string> = {
  high:   '#5dcaa5',
  medium: '#f4d27a',
  low:    'rgba(243,240,234,0.28)',
}

const IMPACT_ICON: Record<string, string> = {
  high:   '↗',
  medium: '→',
  low:    '→',
}

function PulseDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
    </span>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface SignalStripProps {
  signals: DashboardSignal[]
  /** True when signals come from the live database (not fixtures) */
  isLive?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SignalStrip({ signals, isLive = false }: SignalStripProps) {
  return (
    <aside
      className="flex flex-col overflow-y-auto px-3.5 py-4"
      style={{ borderLeft: '1px solid rgba(198,165,90,0.1)', background: 'rgba(4,9,18,0.6)' }}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
          Market signals
        </span>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-[9px]" style={{ color: 'rgba(93,202,165,0.65)' }}>
            <PulseDot />
            <span className="uppercase tracking-[0.1em]">Live</span>
          </span>
        ) : (
          <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: 'rgba(243,240,234,0.2)' }}>
            Updating
          </span>
        )}
      </div>

      {/* Signal cards */}
      {signals.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-center text-[10px]" style={{ color: 'rgba(243,240,234,0.28)' }}>
            No signals available
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {signals.map((s) => {
            const tagClass = TYPE_COLORS[s.tag.label] ?? TYPE_COLORS.INTEL
            const impactColor = IMPACT_COLOR[s.commercialImpact] ?? IMPACT_COLOR.low
            const impactIcon  = IMPACT_ICON[s.commercialImpact]  ?? '→'
            return (
              <div
                key={s.id}
                className="cursor-pointer rounded-xl p-2.5 transition-all hover:border-[rgba(198,165,90,0.2)]"
                style={{ background: 'rgba(10,20,38,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Market + tag row */}
                <div className="mb-1.5 flex items-center justify-between gap-1.5">
                  <span className="truncate text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: '#f0d39a' }}>
                    {s.market}
                  </span>
                  <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[7px] uppercase tracking-[0.06em] ${tagClass}`}>
                    {s.tag.label}
                  </span>
                </div>

                {/* Headline */}
                <p className="mb-1.5 text-[10px] leading-snug" style={{ color: 'rgba(243,240,234,0.72)' }}>
                  {s.title}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px]" style={{ color: 'rgba(243,240,234,0.25)' }}>
                    {s.market} · confidence {s.confidence} · {s.timeAgo}
                  </span>
                  <span className="text-[9px] font-medium" style={{ color: impactColor }}>
                    {impactIcon} {s.commercialImpact}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer link */}
      <Link
        href="/signals"
        className="mt-3 block text-center text-[10px] transition-opacity hover:opacity-80"
        style={{ color: 'rgba(198,165,90,0.38)' }}
      >
        All signals →
      </Link>
    </aside>
  )
}
