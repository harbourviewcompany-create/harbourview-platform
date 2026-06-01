'use client'

import { KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { allCountryAndProvinceOptions as countryOptions } from '@/config/globe/country-role-profiles'
import { tokenMatchesSearch } from '@/lib/globe/search-normalization'

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
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const matches = useMemo(() => {
    return countryOptions.filter((country) =>
      tokenMatchesSearch(query, [
        country.name,
        country.iso2,
        country.iso3 ?? '',
        country.region,
        country.subregion ?? '',
        ...(country.aliases ?? []),
      ]),
    )
  }, [query])
  const hasQuery = query.trim().length > 0
  const highlightedCountry = matches[highlightedIndex]

  useEffect(() => {
    setHighlightedIndex(0)
  }, [query])

  const selectCountry = (countryIso2: string) => {
    const selected = countryOptions.find((country) => country.iso2 === countryIso2)
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
    <div className="pointer-events-auto fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 max-h-[min(72svh,calc(100svh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem))] overflow-hidden rounded-[26px] border border-[#d8be76]/24 bg-[#020812]/88 p-3 text-white shadow-[0_24px_80px_rgba(0,0,0,0.64),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl sm:left-1/2 sm:right-auto sm:w-[380px] sm:-translate-x-1/2">
      <div className="flex items-center gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d8be76]">Harbourview</p>
      </div>

      <label className="mt-3 block" htmlFor="country-search-input">
        <span id="country-search-label" className="sr-only">Search countries, provinces, and U.S. states</span>
        <input
          id="country-search-input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleQueryKeyDown}
          role="combobox"
          aria-label="Search countries, provinces, and U.S. states"
          aria-describedby="country-search-help"
          aria-expanded={hasQuery}
          aria-controls="country-search-results"
          aria-activedescendant={hasQuery && highlightedCountry ? `country-option-${highlightedCountry.iso2}` : undefined}
          autoComplete="off"
          placeholder="Search countries or U.S. states"
          className="min-h-11 w-full rounded-full border border-[#c6a55a]/20 bg-[#071321]/92 px-4 text-sm text-white outline-none placeholder:text-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] focus:border-[#d8be76] focus-visible:ring-2 focus-visible:ring-[#d8be76] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030b16]"
        />
      </label>
      <p id="country-search-help" className="sr-only">
        Type to filter countries, provinces, or U.S. states. Use up and down arrow keys to choose a result, then press Enter to select.
      </p>

      {hasQuery ? (
        <div id="country-search-results" role="listbox" aria-label="Matching markets" className="mt-2 max-h-[calc(72svh-7.25rem)] overflow-y-auto overscroll-contain rounded-2xl border border-[#c6a55a]/14 bg-[#020711]/86 p-1 [-webkit-overflow-scrolling:touch]">
          {matches.map((country, index) => (
            <button
              id={`country-option-${country.iso2}`}
              key={country.iso2}
              type="button"
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => selectCountry(country.iso2)}
              role="option"
              aria-selected={index === highlightedIndex}
              className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm text-white/76 hover:bg-[#d8be76]/10 focus-visible:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8be76] ${index === highlightedIndex ? 'bg-[#d8be76]/12' : ''}`}
            >
              <span className="min-w-0">
                <span className="block truncate">{country.name}</span>
                {country.dashboardStatus === 'request-only' || country.dashboardStatus === 'review-required' || country.dashboardStatus === 'unavailable' ? (
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-white/42">Contact / request access</span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs text-[#c6a55a]/70">{country.iso2}</span>
            </button>
          ))}
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-sm text-white/70">No markets found.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
