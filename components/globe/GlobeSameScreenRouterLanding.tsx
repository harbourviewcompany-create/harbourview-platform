'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { allCountryAndProvinceOptionMap, getCountryName } from '@/config/globe/country-role-profiles'
import { roleProfileMap } from '@/config/globe/role-profiles'
import { RoleChipSelector } from './RoleChipSelector'
import type { GlobeRouterState, RoleId } from '@/types/globe-router'
import dynamic from 'next/dynamic'

const GlobeCanvas = dynamic(() => import('./r3f/GlobeCanvas').then((m) => ({ default: m.GlobeCanvas })), {
  ssr: false,
  loading: () => null,
})
import { resolveGlobeRoute } from './useRouteResolver'
import { useGlobeRouterState } from './useGlobeRouterState'
import { CountrySearchOverlay } from './CountrySearchOverlay'
import { RouterBottomSheet } from './RouterBottomSheet'
import { MarketOverviewSheet } from './MarketOverviewSheet'
import { featureFlags } from '@/lib/harbourview/feature-flags'

function buildFallbackIntakeHref(state: GlobeRouterState) {
  if (state.resolvedHref) return state.resolvedHref

  const params = new URLSearchParams()

  params.set('source', 'globe_router')
  params.set('mode', state.mode)

  if (state.selectedCountryIso2) params.set('country', state.selectedCountryIso2)
  if (state.selectedCountryIso2s.length) params.set('countries', state.selectedCountryIso2s.join(','))
  if (state.selectedRoleId) params.set('role', state.selectedRoleId)
  if (state.activeLayerId) params.set('layer', state.activeLayerId)
  if (state.requestedPath) params.set('requestedPath', state.requestedPath)

  return `/intake?${params.toString()}`
}

function getFallbackContextItems(state: GlobeRouterState) {
  const items: { label: string; value: string }[] = []

  if (state.mode === 'multi_market' && state.selectedCountryIso2s.length > 0) {
    items.push({
      label: 'Markets',
      value: state.selectedCountryIso2s.map((countryIso2) => getCountryName(countryIso2)).join(', '),
    })
  } else if (state.selectedCountryIso2) {
    items.push({ label: 'Market', value: getCountryName(state.selectedCountryIso2) })
  }

  if (state.selectedRoleId) {
    items.push({ label: 'Role', value: roleProfileMap[state.selectedRoleId]?.label ?? state.selectedRoleId })
  }

  if (state.requestedPath) {
    items.push({ label: 'Requested page', value: state.requestedPath })
  }

  return items
}

type GlobeFallbackReason = 'flag-disabled' | 'reduced-motion' | 'webgl-unavailable' | 'low-performance'

const INTERACTIVE_GLOBE_ENABLED = featureFlags.interactiveGlobe

function useGlobeFallbackReason(): GlobeFallbackReason | null {
  const [reason, setReason] = useState<GlobeFallbackReason | null>(null)

  useEffect(() => {
    if (!INTERACTIVE_GLOBE_ENABLED) {
      setReason('flag-disabled')
      return
    }

    if (typeof window === 'undefined') return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReason('reduced-motion')
      return
    }

    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      setReason('webgl-unavailable')
      return
    }

    const cores = navigator.hardwareConcurrency ?? 4
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
    if (cores <= 2 || memory <= 2) {
      setReason('low-performance')
      return
    }

    setReason(null)
  }, [])

  return reason
}

function PremiumStaticGlobeFallback({ reason }: { reason: GlobeFallbackReason }) {
  const reasonLabel = useMemo(() => {
    switch (reason) {
      case 'reduced-motion':
        return 'Reduced motion mode'
      case 'webgl-unavailable':
        return 'WebGL unavailable'
      case 'low-performance':
        return 'Performance protection'
      default:
        return 'Interactive globe disabled'
    }
  }, [reason])

  return (
    <div className="absolute inset-0 grid place-items-center px-6" data-globe-fallback-reason={reason}>
      <div className="relative h-[min(66vh,620px)] w-full max-w-[920px] overflow-hidden rounded-[40px] border border-white/12 bg-[radial-gradient(circle_at_30%_35%,rgba(96,144,220,.34),transparent_45%),radial-gradient(circle_at_72%_58%,rgba(198,165,90,.28),transparent_42%),linear-gradient(165deg,#020712_0%,#030b16_45%,#051125_100%)] shadow-[0_28px_90px_rgba(0,0,0,.6)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,rgba(1,5,13,.84)_100%)]" />
        <div className="absolute left-8 top-8 rounded-full border border-white/16 bg-[#071122]/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/78">
          {reasonLabel}
        </div>
        <div className="absolute bottom-10 left-8 max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Market routing fallback</h2>
          <p className="mt-3 text-sm leading-6 text-white/66">
            We are showing the stable globe fallback to preserve routing and keep navigation responsive on this device.
          </p>
        </div>
      </div>
    </div>
  )
}

const ROLE_STORAGE_KEY = 'hv_preferred_role_id'

export function GlobeSameScreenRouterLanding() {
  const router = useRouter()
  const [state, dispatch] = useGlobeRouterState()
  const [srAnnouncement, setSrAnnouncement] = useState('')
  const fallbackHref = buildFallbackIntakeHref(state)
  const fallbackContextItems = getFallbackContextItems(state)
  const fallbackReason = useGlobeFallbackReason()

  // Role is remembered for the session (not per-country) so picking it once
  // applies to every subsequent market entry with zero added taps. Backed by
  // sessionStorage rather than the reducer since it must survive
  // COUNTRY_CLEAR/RESET and outlive any single country's transient state.
  const [preferredRoleId, setPreferredRoleIdState] = useState<RoleId | undefined>(undefined)
  const [roleSearchQuery, setRoleSearchQuery] = useState('')
  const [showRolePicker, setShowRolePicker] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.sessionStorage.getItem(ROLE_STORAGE_KEY) as RoleId | null
    if (stored) setPreferredRoleIdState(stored)
  }, [])

  function setPreferredRoleId(roleId: RoleId) {
    setPreferredRoleIdState(roleId)
    if (typeof window !== 'undefined') window.sessionStorage.setItem(ROLE_STORAGE_KEY, roleId)
    setShowRolePicker(false)
    setRoleSearchQuery('')
  }

  useEffect(() => {
    if (state.step !== 'routing' || state.routeStatus !== 'resolving') return

    const result = resolveGlobeRoute({
      countryIso2: state.selectedCountryIso2,
      countryIso2s: state.selectedCountryIso2s,
      roleId: state.selectedRoleId,
      intentId: state.selectedIntentId,
      mode: state.mode,
      source: 'globe_router',
      layerId: state.activeLayerId ?? 'country_select',
    })

    if (result.status === 'fallback') {
      dispatch({ type: 'ROUTE_MISSING', href: result.href, requestedPath: result.requestedPath })
      return
    }

    dispatch({ type: 'ROUTE_RESOLVED', href: result.href })
    router.push(result.href)
  }, [dispatch, router, state])

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#01050d] text-white">
      {fallbackReason ? (
        <PremiumStaticGlobeFallback reason={fallbackReason} />
      ) : (
        // Suppress the hover tooltip and hover events while any bottom-sheet modal
        // is open. The CountryGlobeLabel is a DOM overlay that renders above the
        // canvas z-index stack, so it bleeds through the sheet without this guard.
        // 'role' and 'fallback' both render a RouterBottomSheet.
        <GlobeCanvas
          selectedCountryIso2={state.selectedCountryIso2}
          selectedCountryIso2s={state.selectedCountryIso2s}
          focusedCountryIso2={state.step === 'market_overview' || state.step === 'role' || state.step === 'fallback' ? undefined : state.focusedCountryIso2}
          activeLayerId={state.activeLayerId ?? 'country_select'}
          routerStep={state.step}
          onHoverCountry={state.step === 'market_overview' || state.step === 'role' || state.step === 'fallback'
            ? undefined
            : (countryIso2) => dispatch({ type: 'COUNTRY_FOCUS', countryIso2 })}
          onSelectCountry={(countryIso2) => {
            if (state.mode === 'multi_market') {
              dispatch({ type: 'MULTI_MARKET_ADD', countryIso2 })
              return
            }
            // Single-market: skip the market_overview interstitial entirely.
            // Batched dispatches resolve to one render at step:'routing', so
            // MarketOverviewSheet never mounts for this path — the briefing
            // content it showed is redundant with BriefingRoom on the
            // destination dashboard, which already handles the no-briefing
            // case inline. See HANDOFF.md "collapse interstitial" entry.
            dispatch({ type: 'COUNTRY_SELECT', countryIso2 })
            dispatch({ type: 'MARKET_ENTER', roleId: preferredRoleId })
          }}
        />
      )}

      <CountrySearchOverlay
        onSelectCountry={(countryIso2) => {
          dispatch({ type: 'COUNTRY_SEARCH_SELECT', countryIso2 })
          dispatch({ type: 'MARKET_ENTER', roleId: preferredRoleId })
          setSrAnnouncement(`Entering ${getCountryName(countryIso2)}.`)
        }}
        onNotSure={() => dispatch({ type: 'NOT_SURE_COUNTRY' })}
        onAnnouncement={setSrAnnouncement}
      />

      <p className="sr-only" aria-live="polite" aria-atomic="true">{srAnnouncement}</p>

      {state.step === 'market_overview' && state.selectedCountryIso2 ? (
        <MarketOverviewSheet
          countryIso2={state.selectedCountryIso2}
          countryName={allCountryAndProvinceOptionMap[state.selectedCountryIso2]?.name ?? state.selectedCountryIso2}
          onEnter={() => dispatch({ type: 'MARKET_ENTER', roleId: preferredRoleId })}
          onBack={() => dispatch({ type: 'BACK' })}
        />
      ) : null}

      {/* Session-remembered role chip. Only shown at the country step so it
          never overlaps MarketOverviewSheet/RouterBottomSheet, which occupy
          the same bottom-sheet real estate. Setting a role here has zero
          effect on tap count for country selection itself — it's read by
          the MARKET_ENTER dispatches above at the moment a country is picked. */}
      {state.step === 'country' && !showRolePicker ? (
        <button
          type="button"
          onClick={() => setShowRolePicker(true)}
          className="pointer-events-auto fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-30 flex min-h-11 items-center gap-2 rounded-full border border-[#e0c77f]/40 bg-[#020913]/90 px-4 text-xs font-semibold text-[#f5f1e8] shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl transition hover:border-[#f1dfaa]/70"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">Viewing as</span>
          <span className="uppercase tracking-[0.03em]">
            {preferredRoleId ? roleProfileMap[preferredRoleId]?.shortLabel ?? 'Importer' : 'Importer'}
          </span>
        </button>
      ) : null}

      {showRolePicker ? (
        <RouterBottomSheet
          eyebrow="Set your role"
          title="How should we route you?"
          size="role"
          onBack={() => {
            setShowRolePicker(false)
            setRoleSearchQuery('')
          }}
        >
          <RoleChipSelector
            searchQuery={roleSearchQuery}
            selectedRoleId={preferredRoleId}
            onSearchChange={setRoleSearchQuery}
            onSelectRole={setPreferredRoleId}
          />
        </RouterBottomSheet>
      ) : null}

      {state.step === 'fallback' ? (
        <RouterBottomSheet
          eyebrow="Path not public yet"
          title="Continue through intake."
          size="search"
          onBack={() => dispatch({ type: 'BACK' })}
          footer={(
            <div className="grid gap-3">
              <Link
                data-testid="globe-fallback-intake-link"
                href={fallbackHref}
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#c6a55a] px-5 text-center text-sm font-semibold uppercase tracking-[0.16em] text-[#06101d] shadow-[0_0_34px_rgba(198,165,90,0.18)]"
              >
                Continue to intake
              </Link>
              <button
                data-testid="globe-fallback-start-over"
                type="button"
                onClick={() => dispatch({ type: 'RESET' })}
                className="min-h-11 w-full rounded-full border border-[#c6a55a]/28 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5f1e8]/78"
              >
                Start over
              </button>
            </div>
          )}
        >
          <div className="grid gap-4">
            <p data-testid="globe-fallback-message" className="text-sm leading-6 text-white/72">
              No public page is live for this selection yet. Harbourview has kept the route context below so intake can continue without making you re-enter the country or role.
            </p>

            {fallbackContextItems.length > 0 ? (
              <dl data-testid="globe-fallback-context" className="grid gap-2 rounded-2xl border border-[#c6a55a]/18 bg-white/[0.045] p-4">
                {fallbackContextItems.map((item) => (
                  <div key={item.label} className="grid gap-1 sm:grid-cols-[120px_1fr] sm:gap-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d8be76]/72">{item.label}</dt>
                    <dd className="break-words text-sm leading-5 text-[#f5f1e8]/82">{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <p className="text-xs leading-5 text-white/50">
              Use Back to change your role selection, or Start over to return to country selection.
            </p>
          </div>
        </RouterBottomSheet>
      ) : null}
    </main>
  )
}

