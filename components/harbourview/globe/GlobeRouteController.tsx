'use client'

import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { GLOBE_MARKETS, type GlobeMarketSlug, createGlobeQueryString, parseGlobeRouteState } from './routeState'

const SHEETS = [
  { value: 'role', label: 'Role sheet' },
  { value: 'intent', label: 'Intent sheet' },
  { value: 'multi', label: 'Multi-market' },
  { value: 'fallback', label: 'Fallback route' },
] as const

export default function GlobeRouteController() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const state = useMemo(() => parseGlobeRouteState(new URLSearchParams(searchParams.toString())), [searchParams])
  const marketLabels = new Map(GLOBE_MARKETS.map((market) => [market.slug, market.label]))

  const navigate = (nextState: typeof state) => {
    const query = createGlobeQueryString(nextState)
    router.push(`${pathname}${query}`, { scroll: false })
  }

  const toggleMarket = (slug: GlobeMarketSlug) => {
    const selectedMarkets = state.selectedMarkets.includes(slug)
      ? state.selectedMarkets.filter((market) => market !== slug)
      : [...state.selectedMarkets, slug]

    navigate({ ...state, selectedMarkets, fallback: false, invalidParams: false })
  }

  const openSheet = (sheet: (typeof SHEETS)[number]['value']) => {
    navigate({ ...state, sheet, fallback: sheet === 'fallback', invalidParams: false })
  }

  return (
    <section className="page-container relative z-10 mt-6" aria-label="Globe routing controls">
      <div className="overflow-hidden rounded-md border border-gold/20 bg-[linear-gradient(145deg,rgba(11,26,47,0.96),rgba(2,8,18,0.94))] shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <div className="border-b border-gold/15 px-4 py-4 sm:px-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-gold/75">Globe route state</p>
          <p className="mt-2 text-sm text-white/80">
            {state.selectedMarkets.length
              ? `Selected: ${state.selectedMarkets.map((slug) => marketLabels.get(slug)).join(', ')}`
              : 'Selected: none (default globe state)'}
          </p>
          <p className="mt-1 text-xs text-white/55">URL-driven routing for market, role, intent, multi-market and fallback flows.</p>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap gap-2">
            {GLOBE_MARKETS.map((market) => {
              const selected = state.selectedMarkets.includes(market.slug)
              return (
                <button
                  key={market.slug}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleMarket(market.slug)}
                  className={`min-h-10 rounded-sm border px-3 py-2 text-sm transition ${selected ? 'border-gold bg-gold/20 text-gold-pale' : 'border-white/20 bg-[#071428]/80 text-white/80 hover:border-gold/40 hover:text-white'}`}
                >
                  {market.label}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {SHEETS.map((sheet) => {
              const active = state.sheet === sheet.value
              return (
                <button
                  key={sheet.value}
                  type="button"
                  onClick={() => openSheet(sheet.value)}
                  aria-pressed={active}
                  className={`min-h-10 rounded-sm border px-3 py-2 text-sm transition ${active ? 'border-gold bg-gold/15 text-gold-pale' : 'border-white/20 text-white/80 hover:border-gold/40 hover:text-white'}`}
                >
                  {sheet.label}
                </button>
              )
            })}
          </div>

          {(state.fallback || state.invalidParams) && (
            <div className="rounded-sm border border-amber-300/35 bg-amber-200/10 px-3 py-2 text-sm text-amber-200">
              Fallback route active{state.invalidParams ? ' because unknown URL params were normalized.' : '.'}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
