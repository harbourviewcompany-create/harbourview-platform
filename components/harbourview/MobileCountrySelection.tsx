'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getCountryName } from '@/config/globe/country-role-profiles'
import { HarbourviewWordmark } from './HarbourviewWordmark'
import { HamburgerIcon } from './icons'
import { CountryLabel } from './CountryLabel'
import { CountrySelectionSheet } from './CountrySelectionSheet'

const CandidateBGlobe = dynamic(
  () => import('./CandidateBGlobe').then((m) => ({ default: m.CandidateBGlobe })),
  { ssr: false, loading: () => null },
)

type SelectedPath = 'country' | 'not_sure' | 'multi_market'

type State = {
  selectedCountryIso2: string | null
  selectedPath: SelectedPath
  labelVisible: boolean
}

type Action =
  | { type: 'SELECT_COUNTRY'; iso2: string }
  | { type: 'SELECT_PATH'; path: SelectedPath }
  | { type: 'HIDE_LABEL' }
  | { type: 'SHOW_LABEL' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT_COUNTRY':
      return { ...state, selectedCountryIso2: action.iso2, selectedPath: 'country', labelVisible: true }
    case 'SELECT_PATH':
      return { ...state, selectedPath: action.path }
    case 'HIDE_LABEL':
      return { ...state, labelVisible: false }
    case 'SHOW_LABEL':
      return { ...state, labelVisible: true }
    default:
      return state
  }
}

interface MobileCountrySelectionProps {
  initialCountry?: string
  onContinue?: (iso2: string | null, path: SelectedPath) => void
  enableWebGL?: boolean
}

export function MobileCountrySelection({
  initialCountry = 'DE',
  onContinue,
  enableWebGL = true,
}: MobileCountrySelectionProps) {
  const [state, dispatch] = useReducer(reducer, {
    selectedCountryIso2: initialCountry,
    selectedPath: 'country',
    labelVisible: true,
  })

  const [reducedMotion, setReducedMotion] = useState(false)
  const labelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect reduced motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
  }, [])

  // Auto-hide label after 2200ms
  useEffect(() => {
    if (state.labelVisible) {
      labelTimerRef.current = setTimeout(() => dispatch({ type: 'HIDE_LABEL' }), 2200)
    }
    return () => {
      if (labelTimerRef.current) clearTimeout(labelTimerRef.current)
    }
  }, [state.labelVisible])

  const selectedCountryName = state.selectedCountryIso2
    ? getCountryName(state.selectedCountryIso2)
    : null

  const handleContinue = () => {
    if (onContinue) {
      onContinue(state.selectedCountryIso2, state.selectedPath as any)
    }
  }

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100svh',
        overflow: 'hidden',
        background: 'var(--hv-bg-950)',
        color: 'var(--hv-text-primary)',
      }}
    >
      {/* Background atmosphere */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 90% 60% at 50% 30%, rgba(12,27,42,0.9), transparent 70%), linear-gradient(180deg, #03070D 0%, #06101B 60%, #03070D 100%)',
          zIndex: 0,
        }}
      />

      {/* Globe layer */}
      {enableWebGL && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          }}
        >
          <CandidateBGlobe
            selectedCountryIso2={state.selectedCountryIso2 ?? undefined}
            onSelectCountry={(iso2) => dispatch({ type: 'SELECT_COUNTRY', iso2 })}
          />
        </div>
      )}

      {/* Static CSS globe fallback if WebGL disabled */}
      {!enableWebGL && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '92vw',
            maxWidth: 480,
            aspectRatio: '1',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 35% 38%, rgba(34,50,65,0.9), rgba(6,21,37,0.95) 60%, rgba(3,7,13,1) 100%)',
            boxShadow: '0 0 80px rgba(0,0,0,0.7), inset 0 0 60px rgba(0,0,0,0.5)',
            zIndex: 1,
          }}
        />
      )}

      {/* Header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '32px 20px 0',
          pointerEvents: 'none',
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 19,
            color: 'var(--hv-champagne-300)',
            textDecoration: 'none',
            pointerEvents: 'auto',
          }}
        >
          <HarbourviewWordmark />
        </Link>

        <button
          type="button"
          aria-label="Open navigation menu"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '1px solid rgba(214,177,105,0.22)',
            background: 'rgba(5,10,16,0.55)',
            backdropFilter: 'blur(8px)',
            color: 'var(--hv-champagne-300)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        >
          <HamburgerIcon />
        </button>
      </header>

      {/* Temporary country label */}
      {selectedCountryName && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 15, pointerEvents: 'none' }}>
          <CountryLabel
            countryName={selectedCountryName}
            visible={state.labelVisible}
            reducedMotion={reducedMotion}
          />
        </div>
      )}

      {/* Bottom sheet */}
      <CountrySelectionSheet
        selectedCountryIso2={state.selectedCountryIso2}
        selectedCountryName={selectedCountryName}
        selectedPath={state.selectedPath as any}
        onSelectCountry={(iso2) => dispatch({ type: 'SELECT_COUNTRY', iso2 })}
        onSelectPath={(path) => dispatch({ type: 'SELECT_PATH', path: path as any })}
        onContinue={handleContinue}
      />
    </main>
  )
}
