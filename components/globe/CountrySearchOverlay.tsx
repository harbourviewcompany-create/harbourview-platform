'use client'

import { useEffect, useMemo, useState } from 'react'
import { countryOptions } from '@/config/globe/country-role-profiles'
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
  const [activeIndex, setActiveIndex] = useState(0)
  const matches = useMemo(() => {
    return countryOptions.filter((country) =>
      tokenMatchesSearch(query, [country.name, country.iso2, country.region]),
    )
  }, [query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const hasQuery = query.trim().length > 0
  const activeCountry = matches[activeIndex]

  const selectCountry = (countryIso2: string) => {
    onSelectCountry(countryIso2)
    setQuery('')
    setActiveIndex(0)
  }

  const clearAndClose = () => {
    if (hasQuery) {
      setQuery('')
      setActiveIndex(0)
      onAnnouncement?.('Country search cleared.')
      return
    }

    onAnnouncement?.('Country search closed.')
    onNotSure()
  }

  return (
    <div className="pointer-events-auto fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 rounded-[26px] border border-[#c6a55a]/20 bg-[#030b16]/68 p-3 text-white shadow-[0_20px_70px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:left-6 sm:right-auto sm:w-[380px]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d8be76]">Harbourview</p>
        <button type="button" onClick={onNotSure} className="min-h-10 rounded-full border border-[#c6a55a]/20 px-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/70">
          I’m not sure yet
        </button>
      </div>

      <label className="mt-3 block">
        <span className="sr-only">Search countries</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              if (!matches.length) return
              event.preventDefault()
              setActiveIndex((prev) => (prev + 1) % matches.length)
              return
            }

            if (event.key === 'ArrowUp') {
              if (!matches.length) return
              event.preventDefault()
              setActiveIndex((prev) => (prev - 1 + matches.length) % matches.length)
              return
            }

            if (event.key === 'Enter') {
              if (!hasQuery || !activeCountry) return
              event.preventDefault()
              selectCountry(activeCountry.iso2)
              onAnnouncement?.(`Selected ${activeCountry.name}.`)
              return
            }

            if (event.key === 'Escape') {
              event.preventDefault()
              clearAndClose()
            }
          }}
          role="combobox"
          aria-expanded={hasQuery}
          aria-controls="country-search-results"
          aria-autocomplete="list"
          aria-activedescendant={hasQuery && activeCountry ? `country-search-option-${activeCountry.iso2}` : undefined}
          placeholder="Search countries"
          className="min-h-11 w-full rounded-full border border-[#c6a55a]/20 bg-white/[0.07] px-4 text-sm text-white outline-none placeholder:text-white/44 focus:border-[#d8be76] focus-visible:ring-2 focus-visible:ring-[#d8be76]/70"
        />
      </label>

      {hasQuery ? (
        <div id="country-search-results" role="listbox" aria-label="Country results" className="mt-2 max-h-44 overflow-y-auto rounded-2xl border border-[#c6a55a]/14 bg-black/28 p-1">
          {matches.map((country, index) => (
            <button
              id={`country-search-option-${country.iso2}`}
              key={country.iso2}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                selectCountry(country.iso2)
                onAnnouncement?.(`Selected ${country.name}.`)
              }}
              className={`flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm text-white/76 hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-[#d8be76]/70 ${index === activeIndex ? 'bg-white/[0.08] text-white' : ''}`}
            >
              <span>{country.name}</span>
              <span className="text-xs text-[#c6a55a]/70">{country.iso2}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
