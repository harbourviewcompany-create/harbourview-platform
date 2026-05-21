'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { countryOptionMap, getCountryName } from '@/config/globe/country-role-profiles'
import { GlobeCanvas } from './r3f/GlobeCanvas'
import { resolveGlobeRoute } from './useRouteResolver'
import { useGlobeRouterState } from './useGlobeRouterState'
import { CountrySearchOverlay } from './CountrySearchOverlay'
import { RouterBottomSheet } from './RouterBottomSheet'
import { RoleChipSelector } from './RoleChipSelector'
import { IntentCardGrid } from './IntentCardGrid'

type GlobeFallbackReason = 'flag-disabled' | 'reduced-motion' | 'webgl-unavailable' | 'low-performance'

const INTERACTIVE_GLOBE_ENABLED = process.env.NEXT_PUBLIC_HARBOURVIEW_INTERACTIVE_GLOBE === 'true'

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
          <h2 className="text-2xl font-semibold tracking-tight text-white">Premium market routing preview</h2>
          <p className="mt-3 text-sm leading-6 text-white/66">
            We are showing a static globe shell to preserve stability and keep navigation responsive on this device.
          </p>
        </div>
      </div>
    </div>
  )
}

export function GlobeSameScreenRouterLanding() {
  const router = useRouter()
  const [state, dispatch] = useGlobeRouterState()
  const selectedCountryName = state.mode === 'multi_market'
    ? `${state.selectedCountryIso2s.length || 0} markets`
    : getCountryName(state.selectedCountryIso2)
  const fallbackReason = useGlobeFallbackReason()

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
        <GlobeCanvas
          selectedCountryIso2={state.selectedCountryIso2}
          selectedCountryIso2s={state.selectedCountryIso2s}
          focusedCountryIso2={state.focusedCountryIso2}
          activeLayerId={state.activeLayerId ?? 'country_select'}
          routerStep={state.step}
          onHoverCountry={(countryIso2) => dispatch({ type: 'COUNTRY_FOCUS', countryIso2 })}
          onSelectCountry={(countryIso2) => dispatch({ type: state.mode === 'multi_market' ? 'MULTI_MARKET_ADD' : 'COUNTRY_SELECT', countryIso2 })}
        />
      )}

      <CountrySearchOverlay
        onSelectCountry={(countryIso2) => dispatch({ type: 'COUNTRY_SEARCH_SELECT', countryIso2 })}
        onNotSure={() => dispatch({ type: 'NOT_SURE_COUNTRY' })}
      />

      <div className="pointer-events-none fixed inset-x-3 top-[116px] z-20 sm:left-6 sm:right-auto sm:w-[380px]">
        <p className="max-w-xs text-sm leading-6 text-white/62 drop-shadow-[0_2px_18px_rgba(0,0,0,0.9)]">
          Start with country. Harbourview will adjust the next choices by market, role and intent.
        </p>
      </div>

      <div className="pointer-events-auto fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-3 z-20 flex flex-col gap-2 sm:right-6">
        <button
          type="button"
          onClick={() => dispatch({ type: 'MULTI_MARKET_ENABLE' })}
          className="min-h-11 rounded-full border border-[#c6a55a]/22 bg-[#030b16]/76 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/72 backdrop-blur-xl"
        >
          Multi-market
        </button>
      </div>

      {state.step === 'role' ? (
        <RouterBottomSheet eyebrow={state.mode === 'multi_market' ? 'Multi-market role' : countryOptionMap[state.selectedCountryIso2 ?? '']?.name ?? 'Selected country'} title="What role best describes you?" onBack={() => dispatch({ type: 'BACK' })}>
          <RoleChipSelector
            countryIso2={state.selectedCountryIso2}
            countryIso2s={state.selectedCountryIso2s}
            mode={state.mode}
            searchQuery={state.roleSearchQuery}
            selectedRoleId={state.selectedRoleId}
            onSearchChange={(query) => dispatch({ type: 'ROLE_SEARCH_QUERY', query })}
            onSelectRole={(roleId) => dispatch({ type: 'ROLE_SELECT', roleId })}
          />
        </RouterBottomSheet>
      ) : null}

      {state.step === 'intent' ? (
        <RouterBottomSheet eyebrow={selectedCountryName} title="What are you trying to do?" size="intent" onBack={() => dispatch({ type: 'BACK' })} footer={<button type="button" disabled={!state.selectedIntentId} onClick={() => dispatch({ type: 'CONTINUE' })} className="min-h-12 w-full rounded-full bg-[#c6a55a] px-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#06101d] disabled:cursor-not-allowed disabled:opacity-45">Continue</button>}>
          <IntentCardGrid
            countryName={selectedCountryName}
            countryIso2={state.selectedCountryIso2}
            mode={state.mode}
            roleId={state.selectedRoleId}
            selectedIntentId={state.selectedIntentId}
            onSelectIntent={(intentId) => dispatch({ type: 'INTENT_SELECT', intentId })}
          />
        </RouterBottomSheet>
      ) : null}

      {state.step === 'fallback' ? (
        <RouterBottomSheet eyebrow="Route fallback" title="This path needs review." size="confirm" onBack={() => dispatch({ type: 'BACK' })} footer={<Link href={state.resolvedHref ?? '/intake'} className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#c6a55a] px-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#06101d]">Continue to intake</Link>}>
          <p className="text-sm leading-6 text-white/64">
            The requested page is not public yet. We will carry your country, role and intent into confidential intake.
          </p>
        </RouterBottomSheet>
      ) : null}
    </main>
  )
}
