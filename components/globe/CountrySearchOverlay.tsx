'use client'

import { useMemo, useState } from 'react'
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
  const matches = useMemo(() => {
    return countryOptions.filter((country) =>
      tokenMatchesSearch(query, [country.name, country.iso2, country.region]),
    )
  }, [query])

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
          placeholder="Search countries"
          aria-label="Search countries or markets"
          role="combobox"
          aria-expanded={Boolean(query)}
          aria-controls="country-search-results"
          className="min-h-11 w-full rounded-full border border-[#c6a55a]/20 bg-white/[0.07] px-4 text-sm text-white outline-none placeholder:text-white/44 focus:border-[#d8be76]"
        />
      </label>

      {query ? (
        <div id="country-search-results" className="mt-2 max-h-44 overflow-y-auto rounded-2xl border border-[#c6a55a]/14 bg-black/28 p-1" role="listbox" aria-label="Matching countries">
          {matches.length ? matches.map((country) => (
            <button
              key={country.iso2}
              type="button"
              onClick={() => onSelectCountry(country.iso2)}
              role="option"
              aria-selected="false"
              className="flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm text-white/76 hover:bg-white/[0.07]"
            >
              <span>{country.name}</span>
              <span className="text-xs text-[#c6a55a]/70">{country.iso2}</span>
            </button>
          )) : <p className="px-3 py-2 text-sm text-white/60">No markets found.</p>}
        </div>
      ) : null}
    </div>
  )
}
