'use client'

import type { GlobeTierPalette, RegulatoryTier } from '@/lib/globe/globe-materials'

/**
 * Legend for the regulatory-tier globe colouring, plus the palette toggle.
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
  prohibited: {
    label: 'Prohibited',
    hint: 'No lawful commercial pathway',
  },
}

// Swatch colours mirror the plate colours in lib/globe/globe-materials.ts.
// Kept in sync by hand; they are presentational only and never drive rendering.
const SWATCHES: Record<GlobeTierPalette, Record<RegulatoryTier, string>> = {
  metal: {
    legal_commercial_access: '#d4ad3a',
    medical_limited_trade: '#a8873f',
    domestic_only: '#6d5c30',
    prohibited: '#28303a',
  },
  spectrum: {
    legal_commercial_access: '#3fb96b',
    medical_limited_trade: '#e0b93c',
    domestic_only: '#e08340',
    prohibited: '#c0453f',
  },
}

interface Props {
  palette: GlobeTierPalette
  onPaletteChange: (palette: GlobeTierPalette) => void
}

export function GlobeRegulatoryLegend({ palette, onPaletteChange }: Props) {
  return (
    <aside
      aria-label="Regulatory access legend"
      className="pointer-events-auto absolute bottom-6 left-4 z-20 w-[248px] rounded-xl border border-[#c6a55a]/18 bg-[#020814]/88 p-3.5 backdrop-blur-xl sm:left-6"
    >
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d8be76]/80">
          Market access
        </h2>
        <div className="flex items-center gap-0.5 rounded-full border border-[#c6a55a]/18 p-0.5" role="group" aria-label="Colour palette">
          {(['metal', 'spectrum'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={palette === option}
              onClick={() => onPaletteChange(option)}
              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] transition ${
                palette === option
                  ? 'bg-[#c6a55a]/18 text-[#fff8e6]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {option === 'metal' ? 'Metal' : 'Colour'}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid gap-1.5">
        {TIER_ORDER.map((tier) => (
          <li key={tier} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="mt-[3px] h-3 w-3 shrink-0 rounded-[3px] ring-1 ring-inset ring-white/12"
              style={{ background: SWATCHES[palette][tier] }}
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
