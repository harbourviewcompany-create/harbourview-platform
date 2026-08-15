'use client'

import Link from 'next/link'
import { KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { allCountryAndProvinceOptions as countryOptions } from '@/config/globe/country-role-profiles'
import { tokenMatchesSearch } from '@/lib/globe/search-normalization'
import { createClient } from '@/lib/supabase/client'

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0, color: 'rgba(212,173,58,0.72)' }}>
      <circle cx="5.8" cy="5.8" r="4.1" stroke="currentColor" strokeWidth="1.4" />
      <line x1="9.2" y1="9.2" x2="12.6" y2="12.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function CountrySearchOverlay({
  onSelectCountry,
  onNotSure,
  onAnnouncement,
}: {
  onSelectCountry: (countryIso2: string) => void
  onNotSure: () => void
  onAnnouncement?: (message: string) => void
}) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [selectedCountryForReturn, setSelectedCountryForReturn] = useState<string | null>(null)

  const matches = useMemo(() => countryOptions.filter((country) =>
    tokenMatchesSearch(query, [
      country.name,
      country.iso2,
      country.iso3 ?? '',
      country.region,
      country.subregion ?? '',
      ...(country.aliases ?? []),
    ]),
  ), [query])
  const hasQuery = query.trim().length > 0
  const highlightedCountry = matches[highlightedIndex]
  const showResults = hasQuery && isFocused

  const authReturnHref = selectedCountryForReturn
    ? `/dashboard?country=${encodeURIComponent(selectedCountryForReturn)}&page=briefing&section=overview`
    : '/'
  const createOrgHref = `/organization/new?country=${encodeURIComponent((selectedCountryForReturn ?? '').split('-')[0])}&returnTo=${encodeURIComponent(authReturnHref)}`

  useEffect(() => {
    setHighlightedIndex(0)
  }, [query])

  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setSignedIn(Boolean(data.user))
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSignedIn(Boolean(session?.user))
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const selectCountry = (countryIso2: string) => {
    const selected = countryOptions.find((country) => country.iso2 === countryIso2)
    setSelectedCountryForReturn(countryIso2)
    onSelectCountry(countryIso2)
    setQuery('')
    setHighlightedIndex(0)
    if (selected) onAnnouncement?.(`Selected ${selected.name}.`)
  }

  const clearAndClose = () => {
    if (hasQuery) {
      setQuery('')
      setHighlightedIndex(0)
      onAnnouncement?.('Market search cleared.')
      return
    }
    onAnnouncement?.('Market search closed.')
    onNotSure()
  }

  const handleQueryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      clearAndClose()
      return
    }
    if (!hasQuery || matches.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % matches.length)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((prev) => (prev - 1 + matches.length) % matches.length)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      if (highlightedCountry) selectCountry(highlightedCountry.iso2)
    }
  }

  return (
    <div
      className="pointer-events-auto fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 max-h-[min(72svh,calc(100svh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem))] overflow-hidden sm:left-1/2 sm:right-auto sm:w-[390px] sm:-translate-x-1/2"
      style={{
        background: 'linear-gradient(170deg, rgba(5,14,28,0.97) 0%, rgba(2,9,19,0.98) 100%)',
        border: `1px solid ${isFocused ? 'rgba(212,173,58,0.52)' : 'rgba(212,173,58,0.26)'}`,
        borderRadius: '12px',
        boxShadow: isFocused
          ? '0 24px 80px rgba(0,0,0,0.80), 0 0 0 1px rgba(212,173,58,0.12), inset 0 1px 0 rgba(255,255,255,0.07)'
          : '0 20px 64px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div style={{ padding: '10px 14px 0 14px' }}>
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,173,58,0.8) 20%, rgba(212,173,58,0.8) 80%, transparent)', marginBottom: '9px', borderRadius: '1px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'baseline', gap: '10px' }}>
          <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(212,173,58,0.88)', lineHeight: 1 }}>
            Harbourview
          </p>
          <span style={{ fontSize: '9px', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.38)' }}>Market Routing</span>
          {signedIn === true ? (
            <Link href="/account" style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(212,173,58,0.9)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Account</Link>
          ) : signedIn === false ? (
            <Link href={`/login?next=${encodeURIComponent(authReturnHref)}`} style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(212,173,58,0.9)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sign in</Link>
          ) : <span aria-hidden="true" style={{ width: 28 }} />}
        </div>
        <p style={{ margin: '6px 0 0 0', fontSize: '11px', lineHeight: 1.55, color: 'rgba(255,255,255,0.56)', letterSpacing: '0.01em' }}>
          Search a market, state, or province — then enter the market.
        </p>
      </div>

      <label className="block" style={{ padding: '8px 14px 8px 14px' }} htmlFor="country-search-input">
        <span id="country-search-label" className="sr-only">Search countries, provinces, and U.S. states</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.045)', border: `1px solid ${isFocused ? 'rgba(212,173,58,0.52)' : 'rgba(212,173,58,0.22)'}`, borderRadius: '8px', padding: '0 12px', transition: 'border-color 0.15s ease, background 0.15s ease', boxShadow: isFocused ? 'inset 0 1px 8px rgba(0,0,0,0.28), 0 0 0 1px rgba(212,173,58,0.12)' : 'inset 0 1px 6px rgba(0,0,0,0.22)' }}>
          <SearchIcon />
          <input
            id="country-search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleQueryKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            role="combobox"
            aria-label="Search countries, provinces, and U.S. states"
            aria-describedby="country-search-help"
            aria-expanded={hasQuery}
            aria-controls="country-search-results"
            aria-activedescendant={hasQuery && highlightedCountry ? `country-option-${highlightedCountry.iso2}` : undefined}
            autoComplete="off"
            placeholder="Country, U.S. state, or province"
            style={{ flex: 1, minHeight: '40px', background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', letterSpacing: '0.02em', color: '#fff8e6', WebkitAppearance: 'none' }}
          />
        </div>
      </label>
      <p id="country-search-help" className="sr-only">Type to filter countries, provinces, or U.S. states. Use up and down arrow keys to choose a result, then press Enter to select.</p>

      {!showResults && signedIn !== null ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid rgba(212,173,58,0.12)', padding: '7px 14px 9px 14px', fontSize: '9.5px' }}>
          {signedIn ? (
            <>
              <span style={{ color: 'rgba(255,255,255,0.36)' }}>Operating account ready</span>
              <Link href={createOrgHref} style={{ color: 'rgba(212,173,58,0.88)', fontWeight: 600 }}>Create organization</Link>
              <Link href="/organization/join" style={{ color: 'rgba(212,173,58,0.7)', fontWeight: 600 }}>Join organization</Link>
            </>
          ) : (
            <>
              <span style={{ color: 'rgba(255,255,255,0.36)' }}>New to Harbourview?</span>
              <Link href={`/login?mode=signup&next=${encodeURIComponent(authReturnHref)}`} style={{ color: 'rgba(212,173,58,0.9)', fontWeight: 600 }}>Create account</Link>
              <Link href={createOrgHref} style={{ color: 'rgba(212,173,58,0.78)', fontWeight: 600 }}>Create organization</Link>
            </>
          )}
        </div>
      ) : null}

      {showResults ? (
        <div id="country-search-results" role="listbox" aria-label="Matching markets" style={{ maxHeight: 'calc(72svh - 10rem)', overflowY: 'auto', overscrollBehavior: 'contain', padding: '0 8px 8px 8px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(212,173,58,0.5) transparent' }}>
          <div style={{ height: '1px', background: 'rgba(212,173,58,0.14)', marginBottom: '4px' }} />
          {matches.map((country, index) => (
            <button
              id={`country-option-${country.iso2}`}
              key={country.iso2}
              type="button"
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => selectCountry(country.iso2)}
              role="option"
              aria-selected={index === highlightedIndex}
              style={{ display: 'flex', minHeight: '40px', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderRadius: '8px', padding: '0 10px', textAlign: 'left', cursor: 'pointer', border: 'none', background: index === highlightedIndex ? 'rgba(212,173,58,0.12)' : 'transparent', borderLeft: index === highlightedIndex ? '2px solid rgba(212,173,58,0.72)' : '2px solid transparent', transition: 'background 0.1s ease' }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: index === highlightedIndex ? '#fff8e6' : 'rgba(255,255,255,0.82)', fontWeight: index === highlightedIndex ? 500 : 400, letterSpacing: '0.01em' }}>{country.name}</span>
                {country.dashboardStatus === 'request-only' || country.dashboardStatus === 'review-required' || country.dashboardStatus === 'unavailable' ? (
                  <span style={{ display: 'block', fontSize: '9.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.36)', marginTop: '1px' }}>Contact / request access</span>
                ) : null}
              </span>
              <span style={{ flexShrink: 0, fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: index === highlightedIndex ? 'rgba(212,173,58,0.9)' : 'rgba(212,173,58,0.52)' }}>{country.iso2}</span>
            </button>
          ))}
          {matches.length === 0 ? <p style={{ padding: '8px 10px', fontSize: '13px', color: 'rgba(255,255,255,0.52)' }}>No markets found.</p> : null}
        </div>
      ) : null}
    </div>
  )
}
