'use client'

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { resolveMarket } from '@/lib/dashboard/resolveMarket'
import { CANDIDATE_B_DEFAULT_COUNTRY } from '@/lib/harbourview/countries'
import { candidateBGlobeConfig } from '@/lib/harbourview/globeConfig'
import { HarbourviewWordmark } from './HarbourviewWordmark'
import { HamburgerIcon } from './icons'
import { CountryLabel } from './CountryLabel'
import { CountrySelectionSheet, type CandidateBSelectedPath } from './CountrySelectionSheet'

const HarbourviewGlobe = dynamic(
  () => import('./HarbourviewGlobe').then((module) => ({ default: module.HarbourviewGlobe })),
  { ssr: false, loading: () => null },
)

type State = {
  selectedCountryIso2: string | null
  selectedPath: CandidateBSelectedPath
  labelVisible: boolean
}

type Action =
  | { type: 'SELECT_COUNTRY'; iso2: string }
  | { type: 'SELECT_PATH'; path: CandidateBSelectedPath }
  | { type: 'HIDE_LABEL' }
  | { type: 'SHOW_LABEL' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT_COUNTRY':
      return {
        ...state,
        selectedCountryIso2: action.iso2,
        selectedPath: 'country',
        labelVisible: true,
      }
    case 'SELECT_PATH':
      return {
        ...state,
        selectedPath: action.path,
        labelVisible: action.path === 'country' ? state.labelVisible : false,
      }
    case 'HIDE_LABEL':
      return { ...state, labelVisible: false }
    case 'SHOW_LABEL':
      return { ...state, labelVisible: true }
    default:
      return state
  }
}

interface MobileCountrySelectionProps {
  initialCountry?: string | null
  onContinue?: (iso2: string | null, path: CandidateBSelectedPath) => void
  enableWebGL?: boolean
}

function resolveInitialCountry(initialCountry?: string | null): string {
  const requestedCountry = initialCountry?.trim() || CANDIDATE_B_DEFAULT_COUNTRY
  return resolveMarket(requestedCountry)?.code ?? CANDIDATE_B_DEFAULT_COUNTRY
}

function StaticCandidateBGlobe() {
  return (
    <div
      aria-hidden="true"
      data-testid="candidate-b-static-globe"
      className="absolute left-1/2 top-[7svh] z-[1] aspect-square w-[118vw] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-full bg-[radial-gradient(circle_at_36%_24%,rgba(52,78,102,0.28),transparent_18%),radial-gradient(circle_at_44%_34%,rgba(24,39,53,0.92),rgba(6,21,37,0.97)_55%,rgba(3,7,13,1)_100%)] shadow-[0_0_90px_rgba(0,0,0,0.74),inset_0_0_64px_rgba(0,0,0,0.52)]"
    >
      <div className="absolute inset-x-8 top-10 h-px bg-[linear-gradient(90deg,transparent,rgba(240,211,154,0.22),transparent)]" />
      <div className="absolute left-[42%] top-[32%] h-9 w-7 rounded-[55%_45%_52%_48%] border border-[color:var(--hv-globe-selected-edge)]/80 bg-[color:var(--hv-globe-selected-fill)] shadow-[0_0_14px_rgba(240,211,154,0.2)]" />
      <div className="absolute left-[24%] top-[27%] h-24 w-32 rounded-[46%_54%_45%_55%] border border-[color:var(--hv-globe-border)]/28 bg-[color:var(--hv-globe-land)]/58" />
      <div className="absolute left-[48%] top-[22%] h-36 w-40 rounded-[48%_52%_58%_42%] border border-[color:var(--hv-globe-border)]/24 bg-[color:var(--hv-globe-land)]/62" />
      <div className="absolute left-[50%] top-[44%] h-40 w-24 rounded-[54%_46%_48%_52%] border border-[color:var(--hv-globe-border)]/18 bg-[color:var(--hv-globe-land)]/42" />
    </div>
  )
}

export function MobileCountrySelection({
  initialCountry,
  onContinue,
  enableWebGL = true,
}: MobileCountrySelectionProps) {
  const initialIso2 = useMemo(() => resolveInitialCountry(initialCountry), [initialCountry])
  const [state, dispatch] = useReducer(reducer, {
    selectedCountryIso2: initialIso2,
    selectedPath: 'country',
    labelVisible: true,
  })

  const [reducedMotion, setReducedMotion] = useState(false)
  const labelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(motionQuery.matches)

    const handleChange = () => setReducedMotion(motionQuery.matches)
    motionQuery.addEventListener?.('change', handleChange)
    return () => motionQuery.removeEventListener?.('change', handleChange)
  }, [])

  useEffect(() => {
    if (!state.labelVisible) return undefined

    labelTimerRef.current = setTimeout(
      () => dispatch({ type: 'HIDE_LABEL' }),
      candidateBGlobeConfig.label.visibleMs,
    )

    return () => {
      if (labelTimerRef.current) clearTimeout(labelTimerRef.current)
    }
  }, [state.labelVisible])

  const resolvedMarket = state.selectedCountryIso2
    ? resolveMarket(state.selectedCountryIso2)
    : null
  const selectedCountryName = resolvedMarket?.label ?? null
  const isSubnational =
    resolvedMarket?.type === 'state' || resolvedMarket?.type === 'province'
  const showEnhancedGlobe = enableWebGL && !reducedMotion

  const handleSelectCountry = useCallback((iso2: string) => {
    dispatch({ type: 'SELECT_COUNTRY', iso2 })
  }, [])

  const handleContinue = useCallback(() => {
    onContinue?.(state.selectedCountryIso2, state.selectedPath)
  }, [onContinue, state.selectedCountryIso2, state.selectedPath])

  return (
    <main
      data-testid="candidate-b-market-selection"
      className="relative min-h-[100svh] overflow-hidden bg-[color:var(--hv-bg-950)] text-[color:var(--hv-text-primary)]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_30%,rgba(12,27,42,0.88),transparent_70%),linear-gradient(180deg,#03070D_0%,#06101B_60%,#03070D_100%)]"
      />

      <StaticCandidateBGlobe />

      {showEnhancedGlobe ? (
        <div className="absolute inset-0 z-[2]" data-testid="candidate-b-globe-layer">
          <HarbourviewGlobe
            selectedCountryIso2={state.selectedCountryIso2 ?? undefined}
            onSelectCountry={handleSelectCountry}
            reducedMotion={reducedMotion}
          />
        </div>
      ) : null}

      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 pt-8">
        <div
          className="pointer-events-auto text-[19px] text-[color:var(--hv-champagne-300)] [text-shadow:0_12px_28px_rgba(0,0,0,0.5)]"
          aria-label="HARBOURVIEW"
        >
          <HarbourviewWordmark />
        </div>

        <button
          type="button"
          aria-label="Open navigation menu"
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--hv-panel-border-warm)] bg-[rgba(5,10,16,0.52)] text-[color:var(--hv-champagne-300)] shadow-[0_16px_36px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:border-[color:var(--hv-champagne-300)]/48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hv-focus-ring)]"
        >
          <HamburgerIcon />
        </button>
      </header>

      {selectedCountryName ? (
        <div className="pointer-events-none fixed inset-0 z-20">
          <CountryLabel
            countryName={selectedCountryName}
            visible={state.labelVisible && state.selectedPath === 'country'}
            reducedMotion={reducedMotion}
          />
        </div>
      ) : null}

      <CountrySelectionSheet
        selectedCountryIso2={state.selectedCountryIso2}
        selectedCountryName={selectedCountryName}
        selectedPath={state.selectedPath}
        isSubnational={isSubnational}
        onSelectCountry={handleSelectCountry}
        onSelectPath={(path) => dispatch({ type: 'SELECT_PATH', path })}
        onContinue={handleContinue}
      />
    </main>
  )
}
