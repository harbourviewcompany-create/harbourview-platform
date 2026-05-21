'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { countryOptionMap, getCountryName } from '@/config/globe/country-role-profiles'
import { intentProfileMap } from '@/config/globe/intent-profiles'
import { roleProfileMap } from '@/config/globe/role-profiles'
import type { GlobeRouterState } from '@/types/globe-router'
import { GlobeCanvas } from './r3f/GlobeCanvas'
import { resolveGlobeRoute } from './useRouteResolver'
import { useGlobeRouterState } from './useGlobeRouterState'
import { CountrySearchOverlay } from './CountrySearchOverlay'
import { RouterBottomSheet } from './RouterBottomSheet'
import { RoleChipSelector } from './RoleChipSelector'
import { IntentCardGrid } from './IntentCardGrid'

function buildFallbackIntakeHref(state: GlobeRouterState) {
  if (state.resolvedHref) return state.resolvedHref

  const params = new URLSearchParams()

  params.set('source', 'globe_router')
  params.set('mode', state.mode)

  if (state.selectedCountryIso2) params.set('country', state.selectedCountryIso2)
  if (state.selectedCountryIso2s.length) params.set('countries', state.selectedCountryIso2s.join(','))
  if (state.selectedRoleId) params.set('role', state.selectedRoleId)
  if (state.selectedIntentId) params.set('intent', state.selectedIntentId)
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
    items.push({ label: 'Country', value: getCountryName(state.selectedCountryIso2) })
  }

  if (state.selectedRoleId) {
    items.push({ label: 'Role', value: roleProfileMap[state.selectedRoleId]?.label ?? state.selectedRoleId })
  }

  if (state.selectedIntentId) {
    items.push({ label: 'Intent', value: intentProfileMap[state.selectedIntentId]?.label ?? state.selectedIntentId })
  }

  if (state.requestedPath) {
    items.push({ label: 'Requested page', value: state.requestedPath })
  }

  return items
}

export function GlobeSameScreenRouterLanding() {
  const router = useRouter()
  const [state, dispatch] = useGlobeRouterState()
  const [srAnnouncement, setSrAnnouncement] = useState('')
  const selectedCountryName = state.mode === 'multi_market'
    ? `${state.selectedCountryIso2s.length || 0} markets`
    : getCountryName(state.selectedCountryIso2)
  const fallbackHref = buildFallbackIntakeHref(state)
  const fallbackContextItems = getFallbackContextItems(state)

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
      <GlobeCanvas
        selectedCountryIso2={state.selectedCountryIso2}
        selectedCountryIso2s={state.selectedCountryIso2s}
        focusedCountryIso2={state.focusedCountryIso2}
        activeLayerId={state.activeLayerId ?? 'country_select'}
        routerStep={state.step}
        onHoverCountry={(countryIso2) => dispatch({ type: 'COUNTRY_FOCUS', countryIso2 })}
        onSelectCountry={(countryIso2) => dispatch({ type: state.mode === 'multi_market' ? 'MULTI_MARKET_ADD' : 'COUNTRY_SELECT', countryIso2 })}
        enablePointerCapture={state.step === 'country'}
      />

      <CountrySearchOverlay
        onSelectCountry={(countryIso2) => {
          dispatch({ type: 'COUNTRY_SEARCH_SELECT', countryIso2 })
          setSrAnnouncement(`Country selected: ${getCountryName(countryIso2)}.`)
        }}
        onNotSure={() => dispatch({ type: 'NOT_SURE_COUNTRY' })}
        onAnnouncement={setSrAnnouncement}
      />

      <p className="sr-only" aria-live="polite" aria-atomic="true">{srAnnouncement}</p>

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
              No public page is live for this selection yet. Harbourview has kept the route context below so intake can continue without making you re-enter the country, role or intent.
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
              Use Back to change the selected intent, or Start over to return to country selection.
            </p>
          </div>
        </RouterBottomSheet>
      ) : null}
    </main>
  )
}
