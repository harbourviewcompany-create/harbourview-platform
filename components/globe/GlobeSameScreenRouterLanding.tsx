'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { allCountryAndProvinceOptionMap, getCountryName } from '@/config/globe/country-role-profiles'
import { roleProfileMap } from '@/config/globe/role-profiles'
import type { GlobeRouterState } from '@/types/globe-router'
import type { GlobeIntroPhase } from '@/lib/globe/globe-intro'
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
import { RoleSelectSheet } from './RoleSelectSheet'
import { GlobeRegulatoryLegend } from './GlobeRegulatoryLegend'
import { featureFlags } from '@/lib/harbourview/feature-flags'
import { GlobeProvider } from './GlobeProvider'

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

type GlobeFallbackReason = 'webgl-unavailable' | 'force-fallback' | 'render-error'

function useGlobeFallbackReason(): GlobeFallbackReason | null {
  const [reason, setReason] = useState<GlobeFallbackReason | null>(null)

  useEffect(() => {
    if (featureFlags.globeForceFallback) {
      setReason('force-fallback')
      return
    }

    if (typeof window === 'undefined') return

    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      setReason('webgl-unavailable')
      return
    }

    setReason(null)
  }, [])

  return reason
}

/**
 * Static fallback with a CSS gold 360° spin, then a soft settle into a warmer
 * "heat" wash — mirrors the WebGL intro without requiring WebGL.
 */
function PremiumStaticGlobeFallback({ reason }: { reason: GlobeFallbackReason }) {
  const reasonLabel = reason === 'webgl-unavailable' ? 'Interactive globe unavailable' : reason === 'render-error' ? 'Interactive globe unavailable' : 'Globe fallback'

  return (
    <div
      className="absolute inset-0 grid place-items-center px-6"
      data-globe-fallback-reason={reason}
    >
      <div className="relative h-[min(72vh,720px)] w-full max-w-[980px] overflow-hidden rounded-[40px] border border-white/12 bg-[radial-gradient(circle_at_50%_42%,rgba(25,57,94,.34),transparent_48%),linear-gradient(165deg,#020712_0%,#030b16_48%,#051125_100%)] shadow-[0_28px_90px_rgba(0,0,0,.6)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(1,5,13,.78)_100%)]"
        />

        <div className="absolute inset-0 grid place-items-center">
          <div className="relative h-[min(62vh,610px)] w-[min(62vh,610px)]">
            <div
              aria-hidden="true"
              className="absolute inset-[-7%] rounded-full bg-[radial-gradient(circle,rgba(198,165,90,.16)_0%,rgba(45,111,170,.08)_42%,transparent_70%)] blur-2xl"
            />
            <img
              src="/harbourview-loading-globe.svg"
              alt=""
              width={900}
              height={900}
              draggable={false}
              className="relative h-full w-full object-contain opacity-95 drop-shadow-[0_30px_70px_rgba(0,0,0,.62)]"
            />
          </div>
        </div>

        <div className="absolute left-8 top-8 rounded-full border border-white/16 bg-[#071122]/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/78">
          {reasonLabel}
        </div>
        <div className="absolute bottom-10 left-8 right-8 max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Market routing</h2>
          <p className="mt-3 text-sm leading-6 text-white/66">
            The interactive globe could not initialize on this device, so Harbourview is preserving the market-routing
            surface without blocking country search or intake.
          </p>
        </div>
      </div>
    </div>
  )
}

class GlobeRenderErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[GlobeRenderErrorBoundary]', error)
  }

  render() {
    if (this.state.hasError) {
      return <PremiumStaticGlobeFallback reason="render-error" />
    }
    return this.props.children
  }
}

export function GlobeSameScreenRouterLanding() {
  const router = useRouter()
  const [state, dispatch] = useGlobeRouterState()
  const [srAnnouncement, setSrAnnouncement] = useState('')
  const [introPhase, setIntroPhase] = useState<GlobeIntroPhase>('spinning')
  const fallbackHref = buildFallbackIntakeHref(state)
  const fallbackContextItems = getFallbackContextItems(state)
  const fallbackReason = useGlobeFallbackReason()

  const handleIntroPhaseChange = useCallback((phase: GlobeIntroPhase) => {
    setIntroPhase(phase)
  }, [])

  const heatmapLayerRef = useRef<string>('none')
  useEffect(() => {
    fetch('/api/dashboard/preferences')
      .then((r) => r.json())
      .then((d) => {
        heatmapLayerRef.current = d?.preferences?.heatmap_layer ?? 'none'
      })
      .catch(() => {
        heatmapLayerRef.current = 'none'
      })
  }, [])

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

    if (state.selectedCountryIso2 && state.selectedRoleId && state.mode !== 'multi_market') {
      void fetch('/api/dashboard/preferences', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          country_iso2: state.selectedCountryIso2,
          role_id: state.selectedRoleId,
          heatmap_layer: heatmapLayerRef.current,
        }),
      }).catch(() => undefined)
    }

    dispatch({ type: 'ROUTE_RESOLVED', href: result.href })
    router.push(result.href)
  }, [dispatch, router, state])

  const showLegend =
    featureFlags.globeRegulatoryTiers &&
    !fallbackReason &&
    state.step === 'country' &&
    introPhase === 'ready'

  return (
    <GlobeProvider>
      <main className="relative h-svh min-h-svh overflow-hidden bg-[#01050d] text-white">
        {fallbackReason ? (
          <PremiumStaticGlobeFallback reason={fallbackReason} />
        ) : (
          <GlobeCanvas
            selectedCountryIso2={state.selectedCountryIso2}
            selectedCountryIso2s={state.selectedCountryIso2s}
            focusedCountryIso2={
              state.step === 'market_overview' || state.step === 'role' || state.step === 'fallback'
                ? undefined
                : state.focusedCountryIso2
            }
            activeLayerId={state.activeLayerId ?? 'country_select'}
            routerStep={state.step}
            onIntroPhaseChange={handleIntroPhaseChange}
            onHoverCountry={
              state.step === 'market_overview' || state.step === 'role' || state.step === 'fallback'
                ? undefined
                : (countryIso2) => dispatch({ type: 'COUNTRY_FOCUS', countryIso2 })
            }
            onSelectCountry={(countryIso2) =>
              dispatch({
                type: state.mode === 'multi_market' ? 'MULTI_MARKET_ADD' : 'COUNTRY_SELECT',
                countryIso2,
              })
            }
          />
        )}

        <CountrySearchOverlay
          onSelectCountry={(countryIso2) => {
            dispatch({ type: 'COUNTRY_SEARCH_SELECT', countryIso2 })
            setSrAnnouncement(`Country selected: ${getCountryName(countryIso2)}.`)
          }}
          onNotSure={() => dispatch({ type: 'NOT_SURE_COUNTRY' })}
          onAnnouncement={setSrAnnouncement}
          selectedCountryIso2={state.selectedCountryIso2}
        />

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {srAnnouncement}
        </p>

        {showLegend ? <GlobeRegulatoryLegend /> : null}

        {state.step === 'market_overview' && state.selectedCountryIso2 ? (
          <MarketOverviewSheet
            countryIso2={state.selectedCountryIso2}
            countryName={
              allCountryAndProvinceOptionMap[state.selectedCountryIso2]?.name ?? state.selectedCountryIso2
            }
            onEnter={() => dispatch({ type: 'MARKET_ENTER' })}
            onBack={() => dispatch({ type: 'BACK' })}
          />
        ) : null}

        {state.step === 'role' ? (
          <RoleSelectSheet
            countryIso2={state.selectedCountryIso2}
            countryIso2s={state.selectedCountryIso2s}
            countryName={
              state.selectedCountryIso2
                ? allCountryAndProvinceOptionMap[state.selectedCountryIso2]?.name ?? state.selectedCountryIso2
                : 'your selected markets'
            }
            mode={state.mode}
            searchQuery={state.roleSearchQuery}
            onSearchQuery={(query) => dispatch({ type: 'ROLE_SEARCH_QUERY', query })}
            onSelectRole={(roleId) => {
              dispatch({ type: 'ROLE_SELECT', roleId })
              setSrAnnouncement(`Role selected: ${roleProfileMap[roleId]?.label ?? roleId}.`)
            }}
            onSearchSelectRole={(roleId) => {
              dispatch({ type: 'ROLE_SEARCH_SELECT', roleId })
              setSrAnnouncement(`Role selected: ${roleProfileMap[roleId]?.label ?? roleId}.`)
            }}
            onBack={() => dispatch({ type: 'BACK' })}
          />
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
                No public page is live for this selection yet. Harbourview has kept the route context below so intake can
                continue without making you re-enter the country or role.
              </p>

              {fallbackContextItems.length > 0 ? (
                <dl
                  data-testid="globe-fallback-context"
                  className="grid gap-2 rounded-2xl border border-[#c6a55a]/18 bg-white/[0.045] p-4"
                >
                  {fallbackContextItems.map((item) => (
                    <div key={item.label} className="grid gap-1 sm:grid-cols-[120px_1fr] sm:gap-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d8be76]/72">
                        {item.label}
                      </dt>
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
    </GlobeProvider>
  )
}
