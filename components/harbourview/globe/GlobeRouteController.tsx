'use client'

import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { GLOBE_MARKETS, type GlobeMarketSlug, createGlobeQueryString, parseGlobeRouteState } from './routeState'

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
    const has = state.selectedMarkets.includes(slug)
    const selectedMarkets = has
      ? state.selectedMarkets.filter((market) => market !== slug)
      : [...state.selectedMarkets, slug]

    navigate({ ...state, selectedMarkets, fallback: false, invalidParams: false })
  }

  const openSheet = (sheet: 'role' | 'intent' | 'multi' | 'fallback') => {
    navigate({ ...state, sheet, fallback: sheet === 'fallback', invalidParams: false })
  }

  return (
    <section className="page-container relative z-10 mt-6 pb-3" aria-label="Globe routing controls">
      <div className="rounded-md border border-gold/20 bg-[#041026]/85 p-4 sm:p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-gold/80">Selected market context</p>
        <p className="mt-2 text-sm text-white/80">
          {state.selectedMarkets.length
            ? state.selectedMarkets.map((slug) => marketLabels.get(slug)).join(', ')
            : 'No market selected (default globe state).'}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {GLOBE_MARKETS.map((market) => {
            const selected = state.selectedMarkets.includes(market.slug)
            return (
              <button
                key={market.slug}
                type="button"
                onClick={() => toggleMarket(market.slug)}
                className={`rounded border px-3 py-2 text-sm ${selected ? 'border-gold bg-gold/20 text-gold-pale' : 'border-white/20 bg-transparent text-white/80'}`}
                aria-pressed={selected}
              >
                {market.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-intelligence" onClick={() => openSheet('role')}>Role sheet</button>
          <button type="button" className="btn-intelligence" onClick={() => openSheet('intent')}>Intent sheet</button>
          <button type="button" className="btn-intelligence" onClick={() => openSheet('multi')}>Multi-market</button>
          <button type="button" className="btn-intelligence" onClick={() => openSheet('fallback')}>Fallback route</button>
        </div>

        {state.fallback ? (
          <p className="mt-3 text-sm text-amber-300">Fallback route active{state.invalidParams ? ': unknown query parameters were normalized.' : '.'}</p>
        ) : null}
      </div>
    </section>
  )
}
