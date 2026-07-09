'use client'

import { countryOptionMap } from '@/config/globe/country-role-profiles'
import { globePlateSpots } from '@/config/globe/country-spots'
import type { GlobeLayerId } from '@/types/globe-router'

function getPlateState({
  iso2,
  selectedCountryIso2,
  selectedCountryIso2s,
  focusedCountryIso2,
}: {
  iso2: string
  selectedCountryIso2?: string
  selectedCountryIso2s: string[]
  focusedCountryIso2?: string
}) {
  if (selectedCountryIso2s.includes(iso2) || selectedCountryIso2 === iso2) return 'selected'
  if (focusedCountryIso2 === iso2) return 'focused'
  return 'idle'
}

export function HarbourviewSovereignPlateGlobe({
  selectedCountryIso2,
  selectedCountryIso2s,
  focusedCountryIso2,
  activeLayerId = 'country_select',
}: {
  selectedCountryIso2?: string
  selectedCountryIso2s: string[]
  focusedCountryIso2?: string
  activeLayerId?: GlobeLayerId
  onFocusCountry?: (countryIso2?: string) => void
  onSelectCountry?: (countryIso2: string) => void
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[#01050d] opacity-95"
      aria-hidden="true"
      data-globe-renderer="css-fallback-prototype"
      data-fallback-mode="passive-background"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(16,58,95,0.72),transparent_42%),radial-gradient(circle_at_56%_48%,rgba(198,165,90,0.12),transparent_58%),linear-gradient(180deg,#020814_0%,#01050d_100%)]" />

      <div
        className="absolute left-1/2 top-[46%] h-[112svh] w-[112svh] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c6a55a]/18 bg-[radial-gradient(circle_at_32%_24%,rgba(255,255,255,0.16),transparent_22%),radial-gradient(circle_at_42%_42%,rgba(12,45,76,0.94)_0%,rgba(2,12,24,0.98)_58%,rgba(0,0,0,0.98)_100%)] shadow-[inset_-32px_-40px_80px_rgba(0,0,0,0.65),inset_12px_16px_50px_rgba(65,107,139,0.18),0_34px_120px_rgba(0,0,0,0.82)] sm:h-[980px] sm:w-[980px]"
        data-active-layer={activeLayerId}
      >
        <div className="absolute inset-[7%] rounded-full border border-[#c6a55a]/8 bg-[radial-gradient(circle_at_48%_50%,rgba(3,13,25,0.12),transparent_68%)]" />
        <div className="absolute inset-[14%] rounded-full border border-[#c6a55a]/6" />

        {globePlateSpots.map((spot) => {
          const country = countryOptionMap[spot.iso2]
          const plateState = getPlateState({
            iso2: spot.iso2,
            selectedCountryIso2,
            selectedCountryIso2s,
            focusedCountryIso2,
          })
          const size = 48 * (spot.scale ?? 1)

          return (
            <span
              key={spot.iso2}
              aria-hidden="true"
              data-country={spot.iso2}
              data-state={plateState}
              className={`absolute isolate grid place-items-center rounded-[44%] border text-[10px] font-semibold uppercase tracking-[0.14em] transition duration-200 ${
                plateState === 'selected'
                  ? 'border-[#f1d27a] bg-[#d8be76]/24 text-[#fff8df] shadow-[0_0_26px_rgba(216,190,118,0.56),inset_0_1px_12px_rgba(245,241,232,0.18)]'
                  : plateState === 'focused'
                    ? 'border-[#d8be76]/78 bg-[#0c2238] text-[#f5f1e8] shadow-[0_0_18px_rgba(198,165,90,0.28),inset_0_1px_10px_rgba(255,255,255,0.08)]'
                    : 'border-[#c6a55a]/46 bg-[#07192b]/88 text-[#d8be76]/70 shadow-[inset_0_1px_8px_rgba(255,255,255,0.05),0_8px_22px_rgba(0,0,0,0.34)]'
              }`}
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                width: `${size}px`,
                height: `${Math.max(36, size * 0.64)}px`,
                transform: 'translate(-50%, -50%) rotate(-10deg)',
              }}
            >
              <span className="relative z-10">{country?.iso2 ?? spot.iso2}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
