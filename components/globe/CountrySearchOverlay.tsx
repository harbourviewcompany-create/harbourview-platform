'use client'

import { useId, useMemo, useState } from 'react'
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
  const [activeIndex, setActiveIndex] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const listboxId = useId()

  const matches = useMemo(() => {
    return countryOptions.filter((country) =>
      tokenMatchesSearch(query, [country.name, country.iso2, country.region, ...(country.aliases ?? [])]),
    )
  }, [query])

  const hasQuery = query.trim().length > 0

  function selectCountryByIndex(index: number) {
    const country = matches[index]
    if (!country) return

    setAnnouncement(`${country.name} selected`)
    onSelectCountry(country.iso2)
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
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={(event) => {
            if (!hasQuery || matches.length === 0) return

            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActiveIndex((prev) => (prev + 1) % matches.length)
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActiveIndex((prev) => (prev - 1 + matches.length) % matches.length)
            }

            if (event.key === 'Enter') {
              event.preventDefault()
              selectCountryByIndex(activeIndex)
            }
          }}
          aria-controls={hasQuery ? listboxId : undefined}
          aria-activedescendant={hasQuery && matches[activeIndex] ? `${listboxId}-${matches[activeIndex].iso2}` : undefined}
          aria-expanded={hasQuery}
          aria-autocomplete="list"
          role="combobox"
          placeholder="Search countries"
          className="min-h-11 w-full rounded-full border border-[#c6a55a]/20 bg-white/[0.07] px-4 text-sm text-white outline-none placeholder:text-white/44 focus:border-[#d8be76]"
        />
      </label>

      <p aria-live="polite" className="sr-only">{announcement}</p>

      {hasQuery ? (
        <div className="mt-2 max-h-44 overflow-y-auto rounded-2xl border border-[#c6a55a]/14 bg-black/28 p-1">
          {matches.length ? (
            <ul id={listboxId} role="listbox" aria-label="Search results" className="space-y-1">
              {matches.map((country, index) => {
                const isActive = index === activeIndex

                return (
                  <li key={country.iso2}>
                    <button
                      id={`${listboxId}-${country.iso2}`}
                      role="option"
                      aria-selected={isActive}
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectCountryByIndex(index)}
                      className={`flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm transition ${
                        isActive
                          ? 'bg-[#d8be76]/18 text-white ring-1 ring-[#d8be76]/40'
                          : 'text-white/76 hover:bg-white/[0.07]'
                      }`}
                    >
                      <span>{country.name}</span>
                      <span className="text-xs text-[#c6a55a]/70">{country.iso2}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-3 py-2 text-sm text-white/70" role="status" aria-live="polite">
              No countries match “{query.trim()}”.
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
