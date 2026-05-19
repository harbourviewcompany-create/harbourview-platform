'use client'

import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { GLOBE_MARKETS, type GlobeMarketSlug, createGlobeQueryString, parseGlobeRouteState } from './routeState'

const sheetCopy = {
  role: 'Role sheet active: route by participant type and operating posture.',
  intent: 'Intent sheet active: route by buy/sell/export/source/compliance intent.',
  multi: 'Multi-market sheet active: compare selected jurisdictions side-by-side.',
  fallback: 'Fallback sheet active: normalized route for unknown or unsupported query states.',
} as const

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

  const openSheet = (sheet: 'role' | 'intent' | 'multi' | 'fallback') => {
    navigate({ ...state, sheet, fallback: sheet === 'fallback', invalidParams: false })
  }

  return (
    <section className="page-container relative z-10 mt-6 pb-3" aria-label="Globe routing controls">
      <div className="overflow-hidden rounded-md border border-gold/18 bg-[linear-gradient(130deg,rgba(7,21,42,0.96)_0%,rgba(2,8,19,0.97)_56%,rgba(16,33,58,0.92)_100%)] shadow-[0_24px_72px_rgba(0,0,0,0.42)]">
        <div className="border-b border-gold/15 px-4 py-4 sm:px-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold/85">Harbourview route interaction layer</p>
          <p className="mt-2 text-sm text-white/84">
            {state.selectedMarkets.length
              ? `Selected markets: ${state.selectedMarkets.map((slug) => marketLabels.get(slug)).join(', ')}.`
              : 'Default globe state: no market selected yet.'}
          </p>
          {state.sheet ? <p className="mt-2 text-xs text-white/64">{sheetCopy[state.sheet]}</p> : null}
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap gap-2">
            {GLOBE_MARKETS.map((market) => {
              const selected = state.selectedMarkets.includes(market.slug)
              return (
                <button
                  key={market.slug}
                  type="button"
                  onClick={() => toggleMarket(market.slug)}
                  aria-pressed={selected}
                  className={`rounded border px-3 py-2 text-sm transition ${selected ? 'border-gold bg-gold/20 text-gold-pale shadow-[0_0_18px_rgba(198,165,90,0.18)]' : 'border-white/20 bg-[#081a32]/55 text-white/84 hover:border-gold/45'}`}
                >
                  {market.label}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button type="button" className="btn-intelligence justify-center" onClick={() => openSheet('role')}>Role sheet</button>
            <button type="button" className="btn-intelligence justify-center" onClick={() => openSheet('intent')}>Intent sheet</button>
            <button type="button" className="btn-intelligence justify-center" onClick={() => openSheet('multi')}>Multi-market</button>
            <button type="button" className="btn-intelligence justify-center" onClick={() => openSheet('fallback')}>Fallback route</button>
          </div>

          {state.fallback ? (
            <p className="rounded border border-amber-300/35 bg-amber-200/10 px-3 py-2 text-sm text-amber-200">
              Fallback route active{state.invalidParams ? ': unknown query parameters were normalized into a safe state.' : '.'}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
