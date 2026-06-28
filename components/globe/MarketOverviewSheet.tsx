'use client'

import { useEffect, useState } from 'react'
import { RouterBottomSheet } from './RouterBottomSheet'
import { createClient } from '@/lib/supabase/client'
import type { JurisdictionBriefing } from '@/app/actions/getJurisdictionBriefing'
import { canadaProvinceByIso2 } from '@/data/globe/canada-province-profiles'
import { usStateProfiles } from '@/data/globe/us-state-profiles'

// Subnational iso2 (e.g. 'CA-ON') → jurisdiction_slug used in cc_jurisdiction_briefings
const subnationalSlugMap: Record<string, string> = {
  ...Object.fromEntries(Object.entries(canadaProvinceByIso2).map(([iso2, p]) => [iso2, p.slug])),
  ...Object.fromEntries(usStateProfiles.map((s) => [s.iso2, s.slug])),
}

const BRIEFING_SELECT = 'jurisdiction_slug, program_status, public_summary, patient_access, physician_access, market_dynamics, regulatory_outlook, regulatory_body'

interface Props {
  countryIso2: string
  countryName: string
  onEnter: () => void
  onBack: () => void
}

function BriefingSection({ label, text }: { label: string; text: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d8be76]/72">{label}</dt>
      <dd className="text-sm leading-6 text-[#f5f1e8]/80">{text}</dd>
    </div>
  )
}

export function MarketOverviewSheet({ countryIso2, countryName, onEnter, onBack }: Props) {
  const [briefing, setBriefing] = useState<JurisdictionBriefing | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setBriefing(null)

    const code = countryIso2.toUpperCase()
    const slug = subnationalSlugMap[code]
    const client = createClient()

    async function fetchBriefing(): Promise<JurisdictionBriefing | null> {
      if (slug) {
        // Subnational (e.g. CA-ON → ontario): try province/state briefing first
        const parentIso2 = code.split('-')[0]
        const { data, error } = await client
          .from('cc_jurisdiction_briefings')
          .select(BRIEFING_SELECT)
          .eq('country_iso2', parentIso2)
          .eq('jurisdiction_slug', slug)
          .maybeSingle()
        if (error) console.error('[MarketOverviewSheet] subnational fetch failed:', error)
        if (data) return data
        // Fall back to country-level briefing for this province/state's parent
        const { data: countryData, error: countryError } = await client
          .from('cc_jurisdiction_briefings')
          .select(BRIEFING_SELECT)
          .eq('country_iso2', parentIso2)
          .eq('jurisdiction_type', 'country')
          .maybeSingle()
        if (countryError) console.error('[MarketOverviewSheet] country fallback fetch failed:', countryError)
        return countryData ?? null
      }
      const { data, error } = await client
        .from('cc_jurisdiction_briefings')
        .select(BRIEFING_SELECT)
        .eq('country_iso2', code)
        .eq('jurisdiction_type', 'country')
        .maybeSingle()
      if (error) console.error('[MarketOverviewSheet] briefing fetch failed:', error)
      return data ?? null
    }

    fetchBriefing()
      .then((data) => { setBriefing(data); setLoading(false) })
      .catch((err: unknown) => { console.error('[MarketOverviewSheet] briefing fetch error:', err); setLoading(false) })
  }, [countryIso2])

  const title = loading
    ? 'Loading market overview…'
    : (briefing?.program_status ?? 'Market overview')

  return (
    <RouterBottomSheet
      eyebrow={countryName.toUpperCase()}
      title={title}
      size="search"
      onBack={onBack}
      footer={
        <button
          type="button"
          onClick={onEnter}
          disabled={loading}
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#c6a55a] px-5 text-center text-sm font-semibold uppercase tracking-[0.16em] text-[#06101d] shadow-[0_0_34px_rgba(198,165,90,0.18)] transition hover:bg-[#d4b46a] disabled:opacity-40"
        >
          Enter {countryName} Market
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center gap-3 py-6">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#c6a55a]/40 border-t-[#c6a55a]" />
          <span className="text-sm text-white/50">Fetching regulatory data…</span>
        </div>
      ) : briefing ? (
        <dl className="grid gap-5">
          {briefing.public_summary ? (
            <div className="grid gap-1">
              <dt className="sr-only">Overview</dt>
              <dd className="text-sm leading-6 text-[#f5f1e8]/90">{briefing.public_summary}</dd>
            </div>
          ) : null}

          <div className="h-px bg-[#c6a55a]/14" />

          {briefing.patient_access ? (
            <BriefingSection label="Patient Access" text={briefing.patient_access} />
          ) : null}
          {briefing.physician_access ? (
            <BriefingSection label="Physician Access" text={briefing.physician_access} />
          ) : null}
          {briefing.market_dynamics ? (
            <BriefingSection label="Market Dynamics" text={briefing.market_dynamics} />
          ) : null}
          {briefing.regulatory_outlook ? (
            <BriefingSection label="Regulatory Outlook" text={briefing.regulatory_outlook} />
          ) : null}
          {briefing.regulatory_body ? (
            <BriefingSection label="Regulatory Body" text={briefing.regulatory_body} />
          ) : null}
        </dl>
      ) : (
        <p className="py-4 text-sm leading-6 text-white/50">
          No regulatory briefing is on file for {countryName} yet. You can still enter the market to view available intelligence.
        </p>
      )}
    </RouterBottomSheet>
  )
}
