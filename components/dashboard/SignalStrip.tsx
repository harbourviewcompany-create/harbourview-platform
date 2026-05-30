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
  { country: 'Germany',        type: 'regulatory', direction: 'liberalizing', headline: 'BfArM import guidance updated — GMP recognition framework extended to additional third-country exporters',     time: 'May 2026' },
  { country: 'Australia',      type: 'market',     direction: 'stable',       headline: 'TGA ODC reports continued growth in SAS Category B applications; average approval time 12 days',           time: 'May 2026' },
  { country: 'Netherlands',    type: 'trade',      direction: 'commercial',   headline: 'Bedrocan expands export volumes into new EU member state distribution agreements',                           time: 'Apr 2026' },
  { country: 'United Kingdom', type: 'market',     direction: 'stable',       headline: 'MHRA confirms no changes to Schedule 2 import framework; named-patient volumes growing',                    time: 'Apr 2026' },
  { country: 'Colombia',       type: 'commercial', direction: 'commercial',   headline: 'ProColombia issues export readiness guidance for GMP-certified producers targeting EU markets',              time: 'Mar 2026' },
  { country: 'Canada',         type: 'regulatory', direction: 'stable',       headline: 'Health Canada publishes updated Export Permit framework — commercial cultivation category clarified',        time: 'Mar 2026' },
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
  commercial:   '#f4d27a',
  stable:       'rgba(243,240,234,0.3)',
}

function PulseDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
    </span>
  )
}

export function SignalStrip() {
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
        <span className="flex items-center gap-1.5 text-[9px]" style={{ color: 'rgba(93,202,165,0.65)' }}>
          <PulseDot />
          <span className="uppercase tracking-[0.1em]">Live</span>
        </span>
      </div>

      {/* Signal cards */}
      <div className="flex flex-col gap-2">
        {SIGNALS.map((s, i) => (
          <div
            key={i}
            className="cursor-pointer rounded-xl p-2.5 transition-all hover:border-[rgba(198,165,90,0.2)]"
            style={{ background: 'rgba(10,20,38,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Country + type row */}
            <div className="mb-1.5 flex items-center justify-between gap-1.5">
              <span className="truncate text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: '#f0d39a' }}>
                {s.country}
              </span>
              <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[7px] uppercase tracking-[0.06em] ${TYPE_COLORS[s.type]}`}>
                {s.type}
              </span>
            </div>

            {/* Headline */}
            <p className="mb-1.5 text-[10px] leading-snug" style={{ color: 'rgba(243,240,234,0.72)' }}>
              {s.headline}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <span className="text-[9px]" style={{ color: 'rgba(243,240,234,0.25)' }}>{s.time}</span>
              <span className="text-[9px] font-medium" style={{ color: DIR_COLOR[s.direction] }}>
                {DIR_ICON[s.direction]} {s.direction}
              </span>
            </div>
          </div>
        ))}
      </div>

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
