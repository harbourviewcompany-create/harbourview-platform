'use client'

import { useState } from 'react'
import type { RegulatoryTier } from '@/lib/globe/globe-materials'

const TIER_ORDER: RegulatoryTier[] = [
  'legal_commercial_access',
  'medical_limited_trade',
  'domestic_only',
  'cbd_hemp_only',
  'prohibited',
]

const TIER_LABELS: Record<RegulatoryTier, { short: string; label: string; hint: string }> = {
  legal_commercial_access: {
    short: 'Commercial',
    label: 'Legal commercial access',
    hint: 'Lawful cross-border commercial pathway (import and/or export) in operation',
  },
  medical_limited_trade: {
    short: 'Medical',
    label: 'Medical access, limited trade',
    hint: 'Lawful medical market; narrow or no commercial cross-border route',
  },
  domestic_only: {
    short: 'Domestic',
    label: 'Domestic only',
    hint: 'Legal internally; no lawful cross-border commercial route',
  },
  cbd_hemp_only: {
    short: 'Hemp/CBD',
    label: 'Hemp / CBD only',
    hint: 'Cannabis prohibited; licensed hemp or CBD trade permitted',
  },
  prohibited: {
    short: 'Prohibited',
    label: 'Prohibited',
    hint: 'No lawful commercial pathway',
  },
}

const SWATCHES: Record<RegulatoryTier, string> = {
  legal_commercial_access: '#2fd46f',
  medical_limited_trade: '#f2c53d',
  domestic_only: '#f07d2e',
  cbd_hemp_only: '#2bc2c2',
  prohibited: '#c44a4a',
}

const UNVERIFIED_SWATCH = '#3d4a5c'

export function GlobeRegulatoryLegend() {
  const [expanded, setExpanded] = useState(false)

  if (!expanded) {
    return (
      <button
        type="button"
        aria-expanded={false}
        aria-controls="globe-regulatory-legend-panel"
        onClick={() => setExpanded(true)}
        className="pointer-events-auto absolute bottom-6 left-4 z-20 flex max-w-[min(100vw-2rem,420px)] flex-wrap items-center gap-x-2.5 gap-y-1 rounded-2xl border border-white/12 bg-[#020814]/90 px-3 py-2 backdrop-blur-xl transition hover:border-white/20 sm:left-6"
      >
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/50">
          Market access
        </span>
        <span aria-hidden="true" className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {TIER_ORDER.map((tier) => (
            <span key={tier} className="flex items-center gap-1">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[2px] ring-1 ring-inset ring-white/20"
                style={{ background: SWATCHES[tier] }}
              />
              <span className="text-[10px] font-medium leading-none text-[#f5f1e8]/78">
                {TIER_LABELS[tier].short}
              </span>
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[2px] ring-1 ring-inset ring-white/20"
              style={{ background: UNVERIFIED_SWATCH }}
            />
            <span className="text-[10px] font-medium leading-none text-[#f5f1e8]/78">
              Unverified
            </span>
          </span>
        </span>
      </button>
    )
  }

  return (
    <aside
      id="globe-regulatory-legend-panel"
      aria-label="Regulatory access legend"
      className="pointer-events-auto absolute bottom-6 left-4 z-20 w-[min(100vw-2rem,280px)] rounded-xl border border-white/12 bg-[#020814]/92 p-3.5 backdrop-blur-xl sm:left-6"
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
          Market access
        </h2>
        <button
          type="button"
          aria-expanded={true}
          aria-controls="globe-regulatory-legend-panel"
          aria-label="Collapse legend"
          onClick={() => setExpanded(false)}
          className="-mt-1 -mr-1 rounded-md p-1 text-white/40 transition hover:text-white/70"
        >
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </button>
      </div>

      <ul className="grid gap-1.5">
        {TIER_ORDER.map((tier) => (
          <li key={tier} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="mt-[3px] h-3 w-3 shrink-0 rounded-[3px] ring-1 ring-inset ring-white/20"
              style={{ background: SWATCHES[tier] }}
            />
            <span className="grid gap-0.5">
              <span className="text-[11px] font-medium leading-4 text-[#f5f1e8]/88">
                {TIER_LABELS[tier].label}
              </span>
              <span className="text-[10px] leading-[14px] text-white/42">
                {TIER_LABELS[tier].hint}
              </span>
            </span>
          </li>
        ))}
        <li className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className="mt-[3px] h-3 w-3 shrink-0 rounded-[3px] ring-1 ring-inset ring-white/20"
            style={{ background: UNVERIFIED_SWATCH }}
          />
          <span className="grid gap-0.5">
            <span className="text-[11px] font-medium leading-4 text-[#f5f1e8]/88">
              Unverified
            </span>
            <span className="text-[10px] leading-[14px] text-white/42">
              No verified evidence yet — not a legal claim
            </span>
          </span>
        </li>
      </ul>

      <p className="mt-2.5 border-t border-white/8 pt-2 text-[9px] leading-[13px] text-white/34">
        Slate plates are unclassified or lack verified evidence. Colours update when
        jurisdiction evidence changes.
      </p>
    </aside>
  )
}
