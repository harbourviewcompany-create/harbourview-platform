'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { countryOptionMap, getCountryName } from '@/config/globe/country-role-profiles'
import { GlobeCanvas } from './r3f/GlobeCanvas'
import { resolveGlobeRoute } from './useRouteResolver'
import { useGlobeRouterState } from './useGlobeRouterState'
import { HarbourviewSovereignPlateGlobe } from './HarbourviewSovereignPlateGlobe'
import { CountrySearchOverlay } from './CountrySearchOverlay'
import { RouterBottomSheet } from './RouterBottomSheet'
import { RoleChipSelector } from './RoleChipSelector'
import { IntentCardGrid } from './IntentCardGrid'

export function GlobeSameScreenRouterLanding() {
  const router = useRouter()
  const [state, dispatch] = useGlobeRouterState()
  const selectedCountryName = state.mode === 'multi_market'
    ? `${state.selectedCountryIso2s.length || 0} markets`
    : getCountryName(state.selectedCountryIso2)

  useEffect(() => {
    if (state.step !== 'routing' || state.routeStatus !== 'resolving') return

    const result = resolveGlobeRoute({
      countryIso2: state.selectedCountryIso2,
      countryIso2s: state.selectedCountryIso2s,
      roleId: state.selectedRoleId,
      intentId: state.selectedIntentId,
      mode: state.mode,
      source: 'globe_router',
      layerId: state.activeLayerId,
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
      <GlobeCanvas
        selectedCountryIso2={state.selectedCountryIso2}
        selectedCountryIso2s={state.selectedCountryIso2s}
        focusedCountryIso2={state.focusedCountryIso2}
        activeLayerId={state.activeLayerId}
      />

      <HarbourviewSovereignPlateGlobe
        selectedCountryIso2={state.selectedCountryIso2}
        selectedCountryIso2s={state.selectedCountryIso2s}
        focusedCountryIso2={state.focusedCountryIso2}
        activeLayerId={state.activeLayerId}
        onFocusCountry={(countryIso2) => dispatch({ type: 'COUNTRY_FOCUS', countryIso2 })}
        onSelectCountry={(countryIso2) => dispatch({ type: state.mode === 'multi_market' ? 'MULTI_MARKET_ADD' : 'COUNTRY_SELECT', countryIso2 })}
      />

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
