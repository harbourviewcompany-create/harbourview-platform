'use client'

import { useState } from 'react'
import type { RegulatoryTier } from '@/lib/globe/globe-materials'

/**
 * Legend for the regulatory-tier globe colouring.
 *
 * The legend is not decoration — an unlabelled colour scale on a map of *law*
 * is worse than no colour at all, because a viewer will invent their own
 * meaning for it. If this component is not rendered, tier colouring should not
 * be either.
 */

const TIER_ORDER: RegulatoryTier[] = [
  'legal_commercial_access',
  'medical_limited_trade',
  'domestic_only',
  'cbd_hemp_only',
  'prohibited',
]

const TIER_LABELS: Record<RegulatoryTier, { label: string; hint: string }> = {
  legal_commercial_access: {
    label: 'Legal commercial access',
    hint: 'Lawful import and/or export pathways in operation',
  },
  medical_limited_trade: {
    label: 'Medical access, limited trade',
    hint: 'Lawful medical market; narrow cross-border route',
  },
  domestic_only: {
    label: 'Domestic only',
    hint: 'Legal internally; no lawful cross-border commercial route',
  },
  cbd_hemp_only: {
    label: 'Hemp / CBD only',
    hint: 'Cannabis prohibited; licensed hemp or CBD trade permitted',
  },
  prohibited: {
    label: 'Prohibited',
    hint: 'No lawful commercial pathway',
  },
}

// Swatch colours mirror the plate colours (TIER_FILL) in
// lib/globe/globe-materials.ts. Kept in sync by hand; presentational only.
const SWATCHES: Record<RegulatoryTier, string> = {
  legal_commercial_access: '#2fd46f',
  medical_limited_trade: '#f2c53d',
  domestic_only: '#f07d2e',
  cbd_hemp_only: '#2bc2c2',
  prohibited: '#b23b3b',
}

export function GlobeRegulatoryLegend() {
  // Collapsed by default: on a small viewport the full panel can eat close to
  // half the visible globe before a user has done anything. The globe itself
  // is the point; the legend is reference material a user pulls up, not a
  // permanent fixture.
  const [expanded, setExpanded] = useState(false)

  if (!expanded) {
    return (
      <button
        type="button"
        aria-expanded={false}
        aria-controls="globe-regulatory-legend-panel"
        onClick={() => setExpanded(true)}
        className="pointer-events-auto absolute bottom-6 left-4 z-20 flex items-center gap-2 rounded-full border border-[#c6a55a]/18 bg-[#020814]/88 px-3.5 py-2 backdrop-blur-xl transition hover:border-[#c6a55a]/32 sm:left-6"
      >
        <span aria-hidden="true" className="flex items-center gap-1">
          {TIER_ORDER.map((tier) => (
            <span
              key={tier}
              className="h-2.5 w-2.5 shrink-0 rounded-[2px] ring-1 ring-inset ring-white/12"
              style={{ background: SWATCHES[tier] }}
            />
          ))}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d8be76]/80">
          Market access
        </span>
      </button>
    )
  }

  return (
    <aside
      id="globe-regulatory-legend-panel"
      aria-label="Regulatory access legend"
      className="pointer-events-auto absolute bottom-6 left-4 z-20 w-[248px] rounded-xl border border-[#c6a55a]/18 bg-[#020814]/88 p-3.5 backdrop-blur-xl sm:left-6"
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d8be76]/80">
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
              className="mt-[3px] h-3 w-3 shrink-0 rounded-[3px] ring-1 ring-inset ring-white/12"
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
      </ul>

      {/* Countries with no reviewed tier keep the neutral plate. Say so, rather
          than letting a viewer read "unreviewed" as "prohibited". */}
      <p className="mt-2.5 border-t border-white/8 pt-2 text-[9px] leading-[13px] text-white/34">
        Unshaded countries have not yet been classified. Absence of colour is not
        a statement about their law.
      </p>
    </aside>
  )
}
