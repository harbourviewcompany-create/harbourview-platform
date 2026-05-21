'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { countryOptionMap, countryOptions, getCountryName } from '@/config/globe/country-role-profiles'
import { GlobeCanvas } from './r3f/GlobeCanvas'
import { resolveGlobeRoute } from './useRouteResolver'
import { useGlobeRouterState } from './useGlobeRouterState'
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
  const [liveAnnouncement, setLiveAnnouncement] = useState('Select a country to begin routing.')
  const rootRef = useRef<HTMLElement>(null)
  const previousStep = useRef(state.step)
  const topCountryOptions = useMemo(() => countryOptions.slice(0, 10), [])

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

  useEffect(() => {
    if (previousStep.current !== state.step) {
      const target = rootRef.current?.querySelector<HTMLElement>(`[data-step="${state.step}"] [data-first-actionable="true"]`)
      target?.focus()
      previousStep.current = state.step
    }
  }, [state.step])

  useEffect(() => {
    if (state.step === 'role') {
      setLiveAnnouncement(`Country selected: ${selectedCountryName}. Choose your role.`)
      return
    }
    if (state.step === 'intent') {
      const roleLabel = state.selectedRoleId ? ` Role selected: ${state.selectedRoleId.replaceAll('_', ' ')}.` : ''
      setLiveAnnouncement(`Choose your intent.${roleLabel}`)
      return
    }
    if (state.step === 'routing') {
      setLiveAnnouncement('Routing in progress.')
      return
    }
    if (state.step === 'fallback') {
      setLiveAnnouncement('Fallback route selected. Continue to confidential intake.')
      return
    }
    setLiveAnnouncement('Select a country to begin routing.')
  }, [selectedCountryName, state.selectedRoleId, state.step])

  return (
    <main ref={rootRef} className="relative min-h-svh overflow-hidden bg-[#01050d] text-white">
      <p aria-live="polite" aria-atomic="true" className="sr-only">{liveAnnouncement}</p>
      <GlobeCanvas
        selectedCountryIso2={state.selectedCountryIso2}
        selectedCountryIso2s={state.selectedCountryIso2s}
        focusedCountryIso2={state.focusedCountryIso2}
        activeLayerId={state.activeLayerId ?? 'country_select'}
        routerStep={state.step}
        onHoverCountry={(countryIso2) => dispatch({ type: 'COUNTRY_FOCUS', countryIso2 })}
        onSelectCountry={(countryIso2) => dispatch({ type: state.mode === 'multi_market' ? 'MULTI_MARKET_ADD' : 'COUNTRY_SELECT', countryIso2 })}
      />

      <CountrySearchOverlay
        onSelectCountry={(countryIso2) => dispatch({ type: 'COUNTRY_SEARCH_SELECT', countryIso2 })}
        onNotSure={() => dispatch({ type: 'NOT_SURE_COUNTRY' })}
      />
      {state.step === 'country' ? (
        <section data-step="country" className="pointer-events-auto fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-3 z-20 w-[min(30rem,calc(100vw-1.5rem))] rounded-[24px] border border-[#c6a55a]/18 bg-[#030b16]/82 p-3 backdrop-blur-xl sm:left-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c6a55a]/82">Keyboard country selection</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {topCountryOptions.map((country, index) => (
              <button key={country.iso2} type="button" data-first-actionable={index === 0 ? 'true' : undefined} onClick={() => dispatch({ type: 'COUNTRY_SELECT', countryIso2: country.iso2 })} className="min-h-11 rounded-full border border-[#c6a55a]/20 bg-white/[0.045] px-3 text-xs font-semibold text-white/76 outline-none transition hover:border-[#f3d37a]/50 hover:text-white focus-visible:border-[#f3d37a] focus-visible:ring-2 focus-visible:ring-[#f3d37a]/70">
                {country.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

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
        <div data-step="role">
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
        </div>
      ) : null}

      {state.step === 'intent' ? (
        <div data-step="intent">
        <RouterBottomSheet eyebrow={selectedCountryName} title="What are you trying to do?" size="intent" onBack={() => dispatch({ type: 'BACK' })} footer={<button type="button" data-first-actionable="true" disabled={!state.selectedIntentId} onClick={() => dispatch({ type: 'CONTINUE' })} className="min-h-12 w-full rounded-full bg-[#c6a55a] px-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#06101d] outline-none transition focus-visible:ring-2 focus-visible:ring-[#f3d37a] disabled:cursor-not-allowed disabled:opacity-45">Continue</button>}>
          <IntentCardGrid
            countryName={selectedCountryName}
            countryIso2={state.selectedCountryIso2}
            mode={state.mode}
            roleId={state.selectedRoleId}
            selectedIntentId={state.selectedIntentId}
            onSelectIntent={(intentId) => dispatch({ type: 'INTENT_SELECT', intentId })}
          />
        </RouterBottomSheet>
        </div>
      ) : null}

      {state.step === 'fallback' ? (
        <div data-step="fallback">
        <RouterBottomSheet eyebrow="Route fallback" title="This path needs review." size="confirm" onBack={() => dispatch({ type: 'BACK' })} footer={<Link data-first-actionable="true" href={state.resolvedHref ?? '/intake'} className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#c6a55a] px-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#06101d] outline-none transition focus-visible:ring-2 focus-visible:ring-[#f3d37a]">Continue to intake</Link>}>
          <p className="text-sm leading-6 text-white/64">
            The requested page is not public yet. We will carry your country, role and intent into confidential intake.
          </p>
        </RouterBottomSheet>
        </div>
      ) : null}
    </main>
  )
}
