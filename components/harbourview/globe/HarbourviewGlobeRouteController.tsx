'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import styles from './HarbourviewGlobeClientLoader.module.css'
import {
  buildGlobeQuery,
  globeIntentOptions,
  globeMarketOptions,
  globeRoleOptions,
  parseGlobeRouteState,
  type GlobeIntentKey,
  type GlobeMarketKey,
  type GlobeRoleKey,
} from './globeRouteState'

type RouteUpdates = {
  market?: GlobeMarketKey | null
  role?: GlobeRoleKey | null
  intent?: GlobeIntentKey | null
  markets?: GlobeMarketKey[] | null
  route?: 'fallback' | null
}

export const getRouteControlA11yLabel = {
  market: (label: string) => `Market ${label}`,
  role: (label: string) => `Role ${label}`,
  intent: (label: string) => `Intent ${label}`,
}

export function HarbourviewGlobeRouteController() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const routeState = useMemo(() => parseGlobeRouteState(searchParams), [searchParams])

  const pushState = (updates: RouteUpdates) => {
    const query = buildGlobeQuery(searchParams, updates)
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const selectedMarket = routeState.selectedMarket
  const selectedRole = routeState.selectedRole
  const selectedIntent = routeState.selectedIntent
  const multiMarketLabel = routeState.multiMarkets.map((market) => market.label).join(' + ')

  return (
    <div className={styles.routeShell} data-route-state={routeState.kind}>
      <section className={styles.routePanel} aria-label="Interactive Harbourview globe route controller">
        <p className={styles.routeEyebrow}>Globe route</p>
        <p className={styles.routeTitle}>{selectedMarket?.label || 'Global market access map'}</p>
        <p className={styles.routeDescription}>
          {routeState.kind === 'fallback'
            ? 'The requested globe route could not be matched. Select a supported market, role, intent or multi-market path.'
            : selectedMarket?.summary || 'Select a market or route the homepage by role, intent, or multi-market pathway.'}
        </p>

        {routeState.invalidParams.length > 0 ? (
          <div className={styles.routeNotice} role="status">
            Invalid parameter fallback: {routeState.invalidParams.join(', ')}
          </div>
        ) : null}

        <div className={styles.selectedContext} aria-live="polite">
          <span>State: {routeState.kind}</span>
          {selectedMarket ? <span>Market: {selectedMarket.label}</span> : null}
          {selectedRole ? <span>Role: {selectedRole.label}</span> : null}
          {selectedIntent ? <span>Intent: {selectedIntent.label}</span> : null}
          {multiMarketLabel ? <span>Markets: {multiMarketLabel}</span> : null}
        </div>

        <div className={styles.controlGroup} aria-label="Select market">
          {globeMarketOptions.map((market) => (
            <button key={market.key} type="button" className={styles.routeButton} aria-label={getRouteControlA11yLabel.market(market.label)} aria-pressed={selectedMarket?.key === market.key} onClick={() => pushState({ market: market.key, route: null })}>
              {market.label}
            </button>
          ))}
        </div>

        <div className={styles.controlGrid}>
          <div className={styles.controlColumn}>
            <p className={styles.controlLabel}>Role sheet</p>
            {globeRoleOptions.map((role) => (
              <button key={role.key} type="button" className={styles.routeButtonSecondary} aria-label={getRouteControlA11yLabel.role(role.label)} aria-pressed={selectedRole?.key === role.key} onClick={() => pushState({ role: role.key, route: null })}>
                {role.label}
              </button>
            ))}
          </div>

          <div className={styles.controlColumn}>
            <p className={styles.controlLabel}>Intent sheet</p>
            {globeIntentOptions.map((intent) => (
              <button key={intent.key} type="button" className={styles.routeButtonSecondary} aria-label={getRouteControlA11yLabel.intent(intent.label)} aria-pressed={selectedIntent?.key === intent.key} onClick={() => pushState({ intent: intent.key, route: null })}>
                {intent.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.routeActions}>
          <button type="button" className={styles.routeActionButton} onClick={() => pushState({ markets: ['germany', 'portugal', 'uk'], route: null })}>
            Compare Germany + Portugal + UK
          </button>
          <button type="button" className={styles.routeActionButton} aria-current={routeState.kind === 'fallback' ? 'page' : undefined} onClick={() => pushState({ route: 'fallback' })}>
            Test fallback route
          </button>
          <button type="button" className={styles.routeActionButton} onClick={() => pushState({ market: null, role: null, intent: null, markets: null, route: null })}>
            Reset globe
          </button>
        </div>

        <div className={styles.routeLinkRow}>
          <Link href="/markets" className={styles.routeLink}>Open Markets</Link>
          <Link href="/intake" className={styles.routeLink}>Intake</Link>
        </div>
      </section>
    </div>
  )
}

export default HarbourviewGlobeRouteController
