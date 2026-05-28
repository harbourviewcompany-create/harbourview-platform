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

function HarbourviewGlobeRouteControllerInner() {
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
  const routeAnnouncement = routeState.kind === 'fallback'
    ? 'Fallback globe route selected.'
    : `${selectedMarket?.label || 'Global market pathways'} globe route selected.`

  return (
    <div className={styles.routeShell} data-route-state={routeState.kind}>
      <section className={styles.routePanel} aria-label="Interactive Harbourview globe route controller">
        <p className={styles.srOnly} aria-live="polite" aria-atomic="true">{routeAnnouncement}</p>
        <p className={styles.routeEyebrow}>Globe route</p>
        <p className={styles.routeTitle}>{selectedMarket?.label || 'Global market pathways'}</p>
        <p className={styles.routeDescription} aria-live="polite">
          {routeState.kind === 'fallback'
            ? 'We could not load that route. Please select one of the supported market pathways.'
            : selectedMarket?.summary || 'Select a market pathway to tailor your Harbourview experience.'}
        </p>

        <p aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
          Globe route state: {routeState.kind}.
        </p>

        <div className={styles.controlGroup} aria-label="Select market">
          {globeMarketOptions.map((market) => (
            <button key={market.key} type="button" className={styles.routeButton} aria-pressed={selectedMarket?.key === market.key} onClick={() => pushState({ market: market.key, route: null })}>
              {market.label}
            </button>
          ))}
        </div>

        <div className={styles.controlGrid}>
          <div className={styles.controlColumn}>
            <p className={styles.controlLabel}>Role sheet</p>
            {globeRoleOptions.map((role) => (
              <button key={role.key} type="button" className={styles.routeButtonSecondary} aria-pressed={selectedRole?.key === role.key} onClick={() => pushState({ role: role.key, route: null })}>
                {role.label}
              </button>
            ))}
          </div>

          <div className={styles.controlColumn}>
            <p className={styles.controlLabel}>Intent sheet</p>
            {globeIntentOptions.map((intent) => (
              <button key={intent.key} type="button" className={styles.routeButtonSecondary} aria-pressed={selectedIntent?.key === intent.key} onClick={() => pushState({ intent: intent.key, route: null })}>
                {intent.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.routeActions}>
          <button type="button" className={styles.routeActionButton} onClick={() => pushState({ markets: ['germany', 'portugal', 'uk'], route: null })}>
            Compare Germany + Portugal + UK
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

export function HarbourviewGlobeRouteController() {
  const internalControllerEnabled = process.env.HARBOURVIEW_INTERNAL_GLOBE_CONTROLLER === 'true'
  if (!internalControllerEnabled) {
    return null
  }
  return <HarbourviewGlobeRouteControllerInner />
}

export default HarbourviewGlobeRouteController
