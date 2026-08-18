'use client'

import { useMemo, useState } from 'react'
import { allCountryAndProvinceOptions as countryOptions } from '@/config/globe/country-role-profiles'
import { tokenMatchesSearch } from '@/lib/globe/search-normalization'
import {
  HarbourviewBottomSheet,
  hvPanelPrimaryCtaClass,
} from '@/components/ui/HarbourviewPanel'
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
  const title = isSubnational ? 'Select your market' : 'Select your country'

  return (
    <HarbourviewBottomSheet
      title={title}
      eyebrow="TO BEGIN"
      size="search"
      footer={
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={hvPanelPrimaryCtaClass}
        >
          Continue
        </button>
      }
    >
      <div className="grid gap-3">
        <p className="text-sm leading-6 text-[color:var(--hv-text-secondary)]">
          Search a jurisdiction, confirm the selection, then continue into the market pathway.
        </p>

        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--hv-text-muted)]">
            <SearchIcon />
          </span>
          <input
            aria-label="Search countries"
            placeholder="Search countries"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 w-full rounded-2xl border border-white/15 bg-white/[0.035] pl-11 pr-4 text-base text-[color:var(--hv-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hv-focus-ring)]"
          />

          {matches.length > 0 && (
            <ul
              role="listbox"
              aria-label="Country suggestions"
              className="absolute left-0 right-0 top-full z-10 mt-1.5 overflow-hidden rounded-xl border border-white/15 bg-[color:var(--hv-panel-strong)] backdrop-blur-xl"
            >
              {matches.map((country) => (
                <li key={country.iso2} role="option" aria-selected={selectedCountryIso2 === country.iso2}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCountry(country.iso2)
                      setQuery('')
                    }}
                    className={`flex w-full items-center border-b border-white/5 px-4 py-3 text-left text-[15px] text-[color:var(--hv-text-primary)] ${
                      selectedCountryIso2 === country.iso2
                        ? 'bg-[color:var(--hv-champagne-300)]/10'
                        : 'bg-transparent hover:bg-white/[0.04]'
                    }`}
                  >
                    {country.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedCountryName && (
          <div className="flex h-14 items-center gap-3 rounded-2xl border border-[color:var(--hv-champagne-300)]/20 bg-[color:var(--hv-champagne-300)]/5 px-4">
            <CheckCircleIcon className="shrink-0 text-[color:var(--hv-champagne-400)]" />
            <div aria-live="polite">
              <span className="text-base font-medium text-[color:var(--hv-champagne-300)]">
                {selectedCountryName}
              </span>
              <span className="text-base text-[color:var(--hv-text-secondary)]"> selected</span>
            </div>
          </div>
        )}
      </div>
    </HarbourviewBottomSheet>
  )
}
