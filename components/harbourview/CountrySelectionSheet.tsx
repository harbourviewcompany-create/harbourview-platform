'use client'

import { useMemo, useState } from 'react'
import { allCountryAndProvinceOptions as existingCountryOptions } from '@/config/globe/country-role-profiles'
import { tokenMatchesSearch } from '@/lib/globe/search-normalization'
import { candidateBCountryOptions } from '@/lib/harbourview/countries'
import { HarbourviewBottomSheet } from '@/components/ui/HarbourviewPanel'
import { CheckCircleIcon, GlobeIcon, QuestionCircleIcon, SearchIcon } from './icons'

export type CandidateBSelectedPath = 'country' | 'not_sure' | 'multi_market'

interface CountrySelectionSheetProps {
  selectedCountryIso2: string | null
  selectedCountryName: string | null
  selectedPath: CandidateBSelectedPath
  isSubnational?: boolean
  onSelectCountry: (iso2: string) => void
  onSelectPath: (path: CandidateBSelectedPath) => void
  onContinue: () => void
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

const optionButtonBase =
  'flex h-[56px] min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 text-center text-[13px] font-medium leading-tight text-[color:var(--hv-text-secondary)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hv-focus-ring)]'

const activeOptionClass =
  'border-[color:var(--hv-champagne-300)]/44 bg-[color:var(--hv-champagne-300)]/10 text-[color:var(--hv-text-primary)]'

const idleOptionClass =
  'border-[color:var(--hv-panel-border-warm)] bg-white/[0.035] hover:border-[color:var(--hv-champagne-300)]/30 hover:bg-white/[0.055]'

export function CountrySelectionSheet({
  selectedCountryIso2,
  selectedCountryName,
  selectedPath,
  isSubnational = false,
  onSelectCountry,
  onSelectPath,
  onContinue,
}: CountrySelectionSheetProps) {
  const [query, setQuery] = useState('')
  const sourceOptions =
    Array.isArray(existingCountryOptions) && existingCountryOptions.length > 0
      ? existingCountryOptions
      : candidateBCountryOptions

  const matches = useMemo(() => {
    if (!query.trim()) return []
    return sourceOptions
      .filter((country) =>
        tokenMatchesSearch(
          query,
          [country.name, country.iso2, country.region].filter(Boolean) as string[],
        ),
      )
      .slice(0, 6)
  }, [query, sourceOptions])

  const canContinue = Boolean(selectedCountryIso2 || selectedPath === 'not_sure' || selectedPath === 'multi_market')
  const selectedDisplayName = selectedCountryName ?? (selectedCountryIso2 === 'DE' ? 'Germany' : null)

  return (
    <HarbourviewBottomSheet
      title="Select your country to begin."
      size="search"
      hideHeader
      className="inset-x-4 bottom-5 max-h-none rounded-[28px] border-[color:var(--hv-panel-border-warm)] bg-[linear-gradient(180deg,rgba(11,24,38,0.92),rgba(5,12,21,0.94))] p-6 pb-[max(1.375rem,env(safe-area-inset-bottom))] text-[color:var(--hv-text-primary)] shadow-[0_28px_80px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[18px] sm:bottom-5 sm:left-1/2 sm:top-auto sm:w-[430px] sm:-translate-x-1/2 sm:translate-y-0"
      data-testid="candidate-b-country-sheet"
    >
      <h1 className="font-serif text-[clamp(2rem,8vw,2.45rem)] leading-[1.08] tracking-[-0.025em] text-[color:var(--hv-text-primary)]">
        Select your country <span className="text-[color:var(--hv-champagne-muted)]">to begin.</span>
      </h1>

      <div className="mt-5 grid gap-3">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--hv-text-muted)]">
            <SearchIcon />
          </span>
          <input
            aria-label="Search countries"
            placeholder="Search countries"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-[60px] w-full rounded-[18px] border border-[color:var(--hv-panel-border-warm)] bg-white/[0.035] pl-11 pr-4 text-base text-[color:var(--hv-text-primary)] outline-none placeholder:text-[color:var(--hv-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--hv-focus-ring)]"
          />

          {matches.length > 0 ? (
            <ul
              role="listbox"
              aria-label="Country suggestions"
              className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-[color:var(--hv-panel-border-warm)] bg-[color:var(--hv-panel-strong)] shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            >
              {matches.map((country) => (
                <li key={country.iso2} role="option" aria-selected={selectedCountryIso2 === country.iso2}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCountry(country.iso2)
                      setQuery('')
                    }}
                    className={cx(
                      'flex w-full items-center border-b border-white/5 px-4 py-3 text-left text-[15px] text-[color:var(--hv-text-primary)]',
                      selectedCountryIso2 === country.iso2
                        ? 'bg-[color:var(--hv-champagne-300)]/10'
                        : 'bg-transparent hover:bg-white/[0.04]',
                    )}
                  >
                    {country.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            aria-pressed={selectedPath === 'not_sure'}
            onClick={() => onSelectPath('not_sure')}
            className={cx(
              optionButtonBase,
              selectedPath === 'not_sure' ? activeOptionClass : idleOptionClass,
            )}
          >
            <QuestionCircleIcon className="shrink-0 text-[color:var(--hv-champagne-300)]" />
            <span>I’m not sure yet</span>
          </button>

          <button
            type="button"
            aria-pressed={selectedPath === 'multi_market'}
            onClick={() => onSelectPath('multi_market')}
            className={cx(
              optionButtonBase,
              selectedPath === 'multi_market' ? activeOptionClass : idleOptionClass,
            )}
          >
            <GlobeIcon className="shrink-0 text-[color:var(--hv-champagne-300)]" />
            <span>This is multi-market</span>
          </button>
        </div>

        <div className="flex h-[62px] items-center gap-3 rounded-2xl border border-[color:var(--hv-champagne-300)]/20 bg-[color:var(--hv-champagne-300)]/5 px-4">
          <CheckCircleIcon className="shrink-0 text-[color:var(--hv-champagne-400)]" />
          <div aria-live="polite">
            <span className="text-base font-medium text-[color:var(--hv-champagne-300)]">
              {isSubnational ? selectedDisplayName : selectedDisplayName ?? 'Germany'}
            </span>
            <span className="text-base text-[color:var(--hv-text-secondary)]"> selected</span>
          </div>
        </div>

        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="mt-1 flex h-[64px] w-full items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,var(--hv-champagne-300)_0%,var(--hv-gold)_100%)] px-5 text-center text-[20px] font-semibold text-[color:var(--hv-navy-deep)] shadow-[0_18px_42px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.28)] transition hover:brightness-[1.02] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hv-focus-ring)]"
        >
          Continue
        </button>
      </div>
    </HarbourviewBottomSheet>
  )
}
