'use client'

import { KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { countryOptions } from '@/config/globe/country-role-profiles'
import { tokenMatchesSearch } from '@/lib/globe/search-normalization'

export function CountrySearchOverlay({
  onSelectCountry,
  onNotSure,
}: {
  onSelectCountry: (countryIso2: string) => void
  onNotSure: () => void
}) {
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const matches = useMemo(() => {
    return countryOptions.filter((country) =>
      tokenMatchesSearch(query, [country.name, country.iso2, country.region]),
    )
  }, [query])
  const hasQuery = query.trim().length > 0

  useEffect(() => {
    setHighlightedIndex(0)
  }, [query])

  const handleQueryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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
      const activeMatch = matches[highlightedIndex]
      if (activeMatch) onSelectCountry(activeMatch.iso2)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setQuery('')
    }
  }

  return (
    <div className="pointer-events-auto fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 rounded-[26px] border border-[#c6a55a]/20 bg-[#030b16]/68 p-3 text-white shadow-[0_20px_70px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:left-6 sm:right-auto sm:w-[380px]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d8be76]">Harbourview</p>
        <button type="button" onClick={onNotSure} className="min-h-10 rounded-full border border-[#c6a55a]/20 px-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/70">
          I’m not sure yet
        </button>
      </div>

      <label className="mt-3 block" htmlFor="country-search-input">
        <span id="country-search-label" className="sr-only">Search countries and regions</span>
        <input
          id="country-search-input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleQueryKeyDown}
          role="combobox"
          aria-label="Search countries and regions"
          aria-describedby="country-search-help"
          aria-expanded={hasQuery}
          aria-controls="country-search-results"
          aria-activedescendant={hasQuery && matches[highlightedIndex] ? `country-option-${matches[highlightedIndex].iso2}` : undefined}
          autoComplete="off"
          placeholder="Search countries"
          className="min-h-11 w-full rounded-full border border-[#c6a55a]/20 bg-white/[0.07] px-4 text-sm text-white outline-none placeholder:text-white/44 focus:border-[#d8be76] focus-visible:ring-2 focus-visible:ring-[#d8be76] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030b16]"
        />
      </label>
      <p id="country-search-help" className="sr-only">
        Type to filter countries. Use up and down arrow keys to choose a result, then press Enter to select.
      </p>

      {hasQuery ? (
        <div id="country-search-results" role="listbox" aria-label="Matching countries" className="mt-2 max-h-44 overflow-y-auto rounded-2xl border border-[#c6a55a]/14 bg-black/28 p-1">
          {matches.map((country, index) => (
            <button
              id={`country-option-${country.iso2}`}
              key={country.iso2}
              type="button"
              onClick={() => onSelectCountry(country.iso2)}
              role="option"
              aria-selected={index === highlightedIndex}
              className={`flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm text-white/76 hover:bg-white/[0.07] focus-visible:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8be76] ${index === highlightedIndex ? 'bg-white/[0.1]' : ''}`}
            >
              <span>{country.name}</span>
              <span className="text-xs text-[#c6a55a]/70">{country.iso2}</span>
            </button>
          ))}
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-sm text-white/70">No countries found.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
