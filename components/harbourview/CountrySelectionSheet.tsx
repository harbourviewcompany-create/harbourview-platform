'use client'

import { useMemo, useState } from 'react'
import { allCountryAndProvinceOptions as countryOptions } from '@/config/globe/country-role-profiles'
import { tokenMatchesSearch } from '@/lib/globe/search-normalization'
import { CheckCircleIcon, SearchIcon } from './icons'

interface CountrySelectionSheetProps {
  selectedCountryIso2: string | null
  selectedCountryName: string | null
  isSubnational?: boolean
  onSelectCountry: (iso2: string) => void
  onContinue: () => void
}

export function CountrySelectionSheet({
  selectedCountryIso2,
  selectedCountryName,
  isSubnational = false,
  onSelectCountry,
  onContinue,
}: CountrySelectionSheetProps) {
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    if (!query.trim()) return []
    return countryOptions
      .filter((c) => tokenMatchesSearch(query, [c.name, c.iso2, c.region]))
      .slice(0, 6)
  }, [query])

  const canContinue = selectedCountryIso2 !== null

  return (
    <section
      aria-label="Select your market to begin"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 20,
        zIndex: 30,
        borderRadius: '28px',
        background: 'linear-gradient(180deg, rgba(11,24,38,0.92), rgba(5,12,21,0.94))',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(220,231,242,0.14)',
        boxShadow: '0 28px 80px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.05)',
        padding: '14px 24px 22px',
      }}
    >
      {/* Drag handle */}
      <div
        aria-hidden="true"
        style={{
          width: 34,
          height: 4,
          borderRadius: '9999px',
          background: 'rgba(255,255,255,0.22)',
          margin: '0 auto 18px',
        }}
      />

      {/* Headline */}
      <h1
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 'clamp(1.875rem, 8vw, 2.25rem)',
          lineHeight: 1.07,
          letterSpacing: '-0.025em',
          fontWeight: 400,
          color: 'var(--hv-text-primary)',
          marginBottom: 20,
        }}
      >
        {isSubnational ? 'Select your market' : 'Select your country'}{' '}
        <span style={{ color: 'var(--hv-champagne-400)' }}>to begin.</span>
      </h1>

      {/* Search field */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <span
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--hv-text-muted)',
            pointerEvents: 'none',
          }}
        >
          <SearchIcon />
        </span>
        <input
          aria-label="Search countries"
          placeholder="Search countries"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            height: 60,
            borderRadius: 16,
            border: '1px solid rgba(220,231,242,0.16)',
            background: 'rgba(255,255,255,0.035)',
            color: 'var(--hv-text-primary)',
            fontSize: 16,
            paddingLeft: 46,
            paddingRight: 16,
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.target.style.outline = '2px solid var(--hv-focus-ring)'
            e.target.style.outlineOffset = '2px'
          }}
          onBlur={(e) => {
            e.target.style.outline = 'none'
          }}
        />

        {/* Inline search results */}
        {matches.length > 0 && (
          <ul
            role="listbox"
            aria-label="Country suggestions"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 6,
              borderRadius: 14,
              background: 'rgba(7,17,28,0.96)',
              border: '1px solid rgba(220,231,242,0.14)',
              backdropFilter: 'blur(18px)',
              overflow: 'hidden',
              zIndex: 10,
            }}
          >
            {matches.map((country) => (
              <li key={country.iso2} role="option" aria-selected={selectedCountryIso2 === country.iso2}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCountry(country.iso2)
                    setQuery('')
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '12px 16px',
                    background: selectedCountryIso2 === country.iso2 ? 'rgba(240,211,154,0.08)' : 'transparent',
                    color: 'var(--hv-text-primary)',
                    fontSize: 15,
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {country.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected row */}
      {selectedCountryName && (
        <div
          style={{
            height: 64,
            borderRadius: 16,
            border: '1px solid rgba(240,211,154,0.2)',
            background: 'rgba(240,211,154,0.06)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <CheckCircleIcon style={{ color: 'var(--hv-champagne-400)', flexShrink: 0 }} />
          <div aria-live="polite">
            <span style={{ color: 'var(--hv-champagne-300)', fontSize: 16, fontWeight: 500 }}>
              {selectedCountryName}
            </span>
            <span style={{ color: 'var(--hv-text-secondary)', fontSize: 16 }}> selected</span>
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        style={{
          width: '100%',
          height: 64,
          borderRadius: 18,
          background: canContinue
            ? 'linear-gradient(180deg, #F0D39A 0%, #D6A95F 100%)'
            : 'rgba(240,211,154,0.18)',
          color: canContinue ? '#07101A' : 'rgba(255,255,255,0.3)',
          fontSize: 19,
          fontWeight: 600,
          letterSpacing: '0.01em',
          border: 'none',
          cursor: canContinue ? 'pointer' : 'not-allowed',
          opacity: canContinue ? 1 : 0.44,
          transition: 'opacity 200ms, background 200ms',
        }}
        onMouseEnter={(e) => {
          if (canContinue) (e.target as HTMLButtonElement).style.filter = 'brightness(0.93)'
        }}
        onMouseLeave={(e) => {
          if (canContinue) (e.target as HTMLButtonElement).style.filter = 'none'
        }}
        onMouseDown={(e) => {
          if (canContinue) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px)'
        }}
        onMouseUp={(e) => {
          if (canContinue) (e.currentTarget as HTMLButtonElement).style.transform = 'none'
        }}
      >
        Continue
      </button>
    </section>
  )
}
