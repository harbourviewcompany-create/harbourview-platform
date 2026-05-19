'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { GLOBE_MARKETS, type GlobeMarketSlug, createGlobeQueryString, parseGlobeRouteState } from './routeState'

export default function GlobeRouteController() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const state = useMemo(() => parseGlobeRouteState(new URLSearchParams(searchParams.toString())), [searchParams])
  const marketLabels = useMemo(() => new Map(GLOBE_MARKETS.map((market) => [market.slug, market.label])), [])

  useEffect(() => {
    if (!state.invalidParams) return

    const canonicalQuery = createGlobeQueryString(state)
    const currentQuery = searchParams.toString()

    if (canonicalQuery.replace(/^\?/, '') !== currentQuery) {
      router.replace(`${pathname}${canonicalQuery}`, { scroll: false })
    }
  }, [pathname, router, searchParams, state])

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
    <section className="page-container relative z-10 mt-8" aria-label="Globe routing controls">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-gold/20 bg-[linear-gradient(130deg,rgba(9,24,45,0.92),rgba(3,11,22,0.95))] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Market router</p>
          <Link href={pathname} className="text-xs font-medium text-gold-pale underline-offset-4 hover:underline focus-visible:underline">Reset to default</Link>
        </div>

        <p className="mt-2 text-sm text-white/80">
          {state.selectedMarkets.length
            ? `Selected: ${state.selectedMarkets.map((slug) => marketLabels.get(slug)).join(', ')}`
            : 'Selected: default globe state (no market selected)'}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {GLOBE_MARKETS.map((market) => {
            const selected = state.selectedMarkets.includes(market.slug)
            return (
              <button
                key={market.slug}
                type="button"
                onClick={() => toggleMarket(market.slug)}
                className={`rounded-full border px-3 py-2 text-sm transition ${selected ? 'border-gold bg-gold/20 text-gold-pale' : 'border-white/25 text-white/80 hover:border-gold/55 hover:text-white'}`}
                aria-pressed={selected}
              >
                {market.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button type="button" className="btn-intelligence min-w-0" onClick={() => openSheet('role')}>Role sheet</button>
          <button type="button" className="btn-intelligence min-w-0" onClick={() => openSheet('intent')}>Intent sheet</button>
          <button type="button" className="btn-intelligence min-w-0" onClick={() => openSheet('multi')}>Multi-market</button>
          <button type="button" className="btn-intelligence min-w-0" onClick={() => openSheet('fallback')}>Fallback route</button>
        </div>

        {state.fallback && (
          <p className="mt-3 text-sm text-amber-300">
            Fallback route active{state.invalidParams ? ': invalid URL params were normalized to a safe state.' : '.'}
          </p>
        )}
      </div>
    </section>
  )
}
