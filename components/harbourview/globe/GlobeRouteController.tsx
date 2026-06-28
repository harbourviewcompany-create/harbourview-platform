'use client'

import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { GLOBE_MARKETS, type GlobeMarketSlug, createGlobeQueryString, parseGlobeRouteState } from './routeState'

const sheetLabel: Record<'role' | 'intent' | 'multi' | 'fallback', string> = {
  role: 'Role routing',
  intent: 'Intent routing',
  multi: 'Multi-market routing',
  fallback: 'Fallback routing',
}

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
      <div className="rounded-2xl border border-gold/20 bg-[linear-gradient(135deg,rgba(11,26,47,0.94)_0%,rgba(3,11,22,0.94)_100%)] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold/80">Selected market context</p>
          {state.sheet ? <span className="rounded-full border border-gold/30 px-2 py-0.5 text-[11px] text-gold-pale">{sheetLabel[state.sheet as keyof typeof sheetLabel]}</span> : null}
        </div>

        <p className="mt-2 text-sm leading-6 text-white/80">
          {state.selectedMarkets.length
            ? state.selectedMarkets.map((slug) => marketLabels.get(slug)).join(' • ')
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
                className={`rounded-full border px-3 py-2 text-sm transition ${selected ? 'border-gold bg-gold/20 text-gold-pale' : 'border-white/20 bg-transparent text-white/80 hover:border-gold/50 hover:text-white'}`}
                aria-pressed={selected}
              >
                {market.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button type="button" className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/90 hover:border-gold/60" onClick={() => openSheet('role')}>Role sheet</button>
          <button type="button" className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/90 hover:border-gold/60" onClick={() => openSheet('intent')}>Intent sheet</button>
          <button type="button" className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/90 hover:border-gold/60" onClick={() => openSheet('multi')}>Multi-market</button>
          <button type="button" className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/90 hover:border-gold/60" onClick={() => openSheet('fallback')}>Fallback route</button>
        </div>

        {state.fallback ? <p className="mt-3 text-sm text-amber-300">Fallback route active{state.invalidParams ? ': invalid query parameters normalized.' : '.'}</p> : null}
      </div>
    </section>
  )
}
