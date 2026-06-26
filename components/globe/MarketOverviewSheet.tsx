'use client'

import { useEffect, useState } from 'react'
import { RouterBottomSheet } from './RouterBottomSheet'
import { getJurisdictionBriefing } from '@/app/actions/getJurisdictionBriefing'
import type { JurisdictionBriefing } from '@/app/actions/getJurisdictionBriefing'

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
    getJurisdictionBriefing(countryIso2)
      .then((data) => {
        setBriefing(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [countryIso2])

  const title = loading
    ? 'Loading regulatory overview…'
    : (briefing?.program_status ?? 'Regulatory overview unavailable')

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
