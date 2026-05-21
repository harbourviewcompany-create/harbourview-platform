'use client'

import React from 'react'
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
  const controlsId = 'harbourview-globe-controls'
  const statusId = 'harbourview-globe-status'
  const instructionsId = 'harbourview-globe-keyboard-instructions'
  const fallbackId = 'harbourview-globe-fallback-instructions'

  return (
    <div className={styles.routeShell} data-route-state={routeState.kind}>
      <section
        className={styles.routePanel}
        role="region"
        aria-labelledby="harbourview-globe-route-title"
        aria-describedby={`${instructionsId} ${fallbackId} ${statusId}`}
      >
        <p className={styles.routeEyebrow}>Globe route</p>
        <p id="harbourview-globe-route-title" className={styles.routeTitle}>{selectedMarket?.label || 'Global market access map'}</p>
        <p className={styles.routeDescription}>
          {routeState.kind === 'fallback'
            ? 'The requested globe route could not be matched. Select a supported market, role, intent or multi-market path.'
            : selectedMarket?.summary || 'Select a market or route the homepage by role, intent, or multi-market pathway.'}
        </p>

        <p id={instructionsId} className={styles.srOnly}>
          Keyboard instructions: use Tab to move between route controls, then press Enter or Space to select a market, role, intent, compare path, fallback route, or reset.
        </p>

        <p id={fallbackId} className={styles.srOnly}>
          If WebGL is unavailable or interactions are disabled, these controls provide a complete fallback for market routing.
        </p>

        <div id={statusId} className={styles.selectedContext} aria-live="polite" role="status" aria-atomic="true">
          {routeState.invalidParams.length > 0 ? <span>Invalid parameter fallback: {routeState.invalidParams.join(', ')}</span> : null}
          <span>State: {routeState.kind}</span>
          {selectedMarket ? <span>Market: {selectedMarket.label}</span> : null}
          {selectedRole ? <span>Role: {selectedRole.label}</span> : null}
          {selectedIntent ? <span>Intent: {selectedIntent.label}</span> : null}
          {multiMarketLabel ? <span>Markets: {multiMarketLabel}</span> : null}
        </div>

        <div id={controlsId} className={styles.controlGroup} aria-label="Select market">
          {globeMarketOptions.map((market) => (
            <button key={market.key} type="button" className={styles.routeButton} aria-describedby={`${instructionsId} ${statusId}`} aria-pressed={selectedMarket?.key === market.key} onClick={() => pushState({ market: market.key, route: null })}>
              {market.label}
            </button>
          ))}
        </div>

        <div className={styles.controlGrid}>
          <div className={styles.controlColumn}>
            <p className={styles.controlLabel}>Role sheet</p>
            {globeRoleOptions.map((role) => (
              <button key={role.key} type="button" className={styles.routeButtonSecondary} aria-describedby={`${instructionsId} ${statusId}`} aria-pressed={selectedRole?.key === role.key} onClick={() => pushState({ role: role.key, route: null })}>
                {role.label}
              </button>
            ))}
          </div>

          <div className={styles.controlColumn}>
            <p className={styles.controlLabel}>Intent sheet</p>
            {globeIntentOptions.map((intent) => (
              <button key={intent.key} type="button" className={styles.routeButtonSecondary} aria-describedby={`${instructionsId} ${statusId}`} aria-pressed={selectedIntent?.key === intent.key} onClick={() => pushState({ intent: intent.key, route: null })}>
                {intent.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.routeActions}>
          <button type="button" className={styles.routeActionButton} aria-describedby={`${instructionsId} ${statusId}`} onClick={() => pushState({ markets: ['germany', 'portugal', 'uk'], route: null })}>
            Compare Germany + Portugal + UK
          </button>
          <button type="button" className={styles.routeActionButton} aria-describedby={`${instructionsId} ${statusId}`} onClick={() => pushState({ route: 'fallback' })}>
            Test fallback route
          </button>
          <button type="button" className={styles.routeActionButton} aria-describedby={`${instructionsId} ${statusId}`} onClick={() => pushState({ market: null, role: null, intent: null, markets: null, route: null })}>
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
