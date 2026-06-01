'use client'

import { allCountryAndProvinceOptions as countryOptions } from '@/config/globe/country-role-profiles'

export function GlobeFallbackCountrySelector({
  selectedCountryIso2,
  onSelectCountry,
}: {
  selectedCountryIso2?: string
  onSelectCountry: (countryIso2: string) => void
}) {
  return (
    <div className="rounded-[28px] border border-[#c6a55a]/18 bg-[#030b16]/82 p-4 text-white backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c6a55a]/76">Fallback country selector</p>
      <p className="mt-2 text-sm leading-6 text-white/62">
        If the interactive globe is unavailable, choose the country here. The same role and intent router appears next.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {countryOptions.map((country) => (
          <button
            key={country.iso2}
            type="button"
            aria-pressed={selectedCountryIso2 === country.iso2}
            onClick={() => onSelectCountry(country.iso2)}
            className={`min-h-11 rounded-full border px-3 text-xs font-semibold ${
              selectedCountryIso2 === country.iso2
                ? 'border-[#f3d37a] bg-[#c6a55a]/20 text-[#fff8df]'
                : 'border-[#c6a55a]/18 bg-white/[0.045] text-white/70'
            }`}
          >
            {country.name}
          </button>
        ))}
      </div>
    </div>
  )
}
