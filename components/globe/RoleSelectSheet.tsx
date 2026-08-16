'use client'

import { KeyboardEvent, useMemo, useState } from 'react'
import { RouterBottomSheet } from './RouterBottomSheet'
import { hvPanelBodyClass } from '@/components/ui/HarbourviewPanel'
import { getCountryRoleProfile, getMultiMarketRoleIds } from '@/config/globe/country-role-profiles'
import { roleProfileMap } from '@/config/globe/role-profiles'
import { tokenMatchesSearch } from '@/lib/globe/search-normalization'
import type { RoleId } from '@/types/globe-router'

interface Props {
  countryIso2?: string
  countryIso2s: string[]
  countryName: string
  mode: 'single_market' | 'multi_market' | 'not_sure'
  searchQuery: string
  onSearchQuery: (query: string) => void
  onSelectRole: (roleId: RoleId) => void
  onSearchSelectRole: (roleId: RoleId) => void
  onBack: () => void
}

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-[color:var(--hv-gold)]/72"
    >
      <circle cx="5.8" cy="5.8" r="4.1" stroke="currentColor" strokeWidth="1.4" />
      <line x1="9.2" y1="9.2" x2="12.6" y2="12.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

const roleChipClass =
  'grid min-h-12 w-full gap-0.5 rounded-lg border border-[color:var(--hv-gold)]/18 bg-white/[0.03] px-4 py-2.5 text-left transition hover:border-[color:var(--hv-gold)]/55 hover:bg-[color:var(--hv-gold)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hv-focus-ring)]'

const roleOptionBase =
  'grid min-h-12 w-full gap-0.5 rounded-lg px-3 py-2 text-left transition'

export function RoleSelectSheet({
  countryIso2,
  countryIso2s,
  countryName,
  mode,
  searchQuery,
  onSearchQuery,
  onSelectRole,
  onSearchSelectRole,
  onBack,
}: Props) {
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const profile = useMemo(() => getCountryRoleProfile(countryIso2), [countryIso2])

  const primaryRoleIds = useMemo(() => {
    if (mode === 'multi_market' && countryIso2s.length > 0) {
      return getMultiMarketRoleIds(countryIso2s).slice(0, 9)
    }
    return profile.primaryRoleIds
  }, [mode, countryIso2s, profile])

  const chipRoleIds = useMemo(
    () => primaryRoleIds.filter((roleId) => roleId !== 'not_sure'),
    [primaryRoleIds],
  )

  const query = searchQuery.trim()
  const hasQuery = query.length > 0

  const matches = useMemo(() => {
    if (!hasQuery) return []
    return profile.searchableRoleIds.filter((roleId) => {
      const role = roleProfileMap[roleId]
      if (!role) return false
      return tokenMatchesSearch(query, [role.label, role.shortLabel, ...(role.aliases ?? [])])
    })
  }, [hasQuery, query, profile])

  const highlightedRoleId = matches[highlightedIndex]

  const handleQueryChange = (value: string) => {
    onSearchQuery(value)
    setHighlightedIndex(0)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      handleQueryChange('')
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
      if (highlightedRoleId) onSearchSelectRole(highlightedRoleId)
    }
  }

  const eyebrow = mode === 'multi_market'
    ? `${countryIso2s.length} MARKETS`
    : countryName.toUpperCase()

  return (
    <RouterBottomSheet
      eyebrow={eyebrow}
      title="What is your role?"
      size="role"
      onBack={onBack}
    >
      <div className="grid gap-4">
        <p className={hvPanelBodyClass}>
          {mode === 'multi_market'
            ? 'Your role determines which intelligence, pathways and counterparties we surface across these markets.'
            : `Your role determines which intelligence, pathways and counterparties we surface for ${countryName}.`}
        </p>

        <label className="block" htmlFor="role-search-input">
          <span className="sr-only">Search all roles</span>
          <div className="flex items-center gap-2 rounded-lg border border-[color:var(--hv-gold)]/22 bg-white/[0.045] px-3 shadow-[inset_0_1px_6px_rgba(0,0,0,0.22)]">
            <SearchIcon />
            <input
              id="role-search-input"
              type="search"
              value={searchQuery}
              onChange={(event) => handleQueryChange(event.target.value)}
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-label="Search all roles"
              aria-expanded={hasQuery}
              aria-controls="role-search-results"
              aria-activedescendant={hasQuery && highlightedRoleId ? `role-option-${highlightedRoleId}` : undefined}
              autoComplete="off"
              placeholder="Search all roles…"
              className="min-h-10 flex-1 border-0 bg-transparent text-[13px] tracking-[0.02em] text-[color:var(--hv-ivory)] outline-none appearance-none"
            />
          </div>
        </label>

        {hasQuery ? (
          <div id="role-search-results" role="listbox" aria-label="Matching roles" className="grid gap-1">
            {matches.map((roleId, index) => {
              const role = roleProfileMap[roleId]
              const isHighlighted = index === highlightedIndex
              return (
                <button
                  id={`role-option-${roleId}`}
                  key={roleId}
                  type="button"
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => onSearchSelectRole(roleId)}
                  className={`${roleOptionBase} ${
                    isHighlighted
                      ? 'border-l-2 border-l-[color:var(--hv-gold)]/72 bg-[color:var(--hv-gold)]/12'
                      : 'border-l-2 border-l-transparent hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-sm font-medium text-[color:var(--hv-ivory)]">{role?.label ?? roleId}</span>
                  {role?.description ? (
                    <span className="text-xs leading-5 text-white/48">{role.description}</span>
                  ) : null}
                </button>
              )
            })}
            {matches.length === 0 ? (
              <p className="px-1 py-2 text-sm text-white/50">No roles match “{query}”.</p>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              {chipRoleIds.map((roleId) => {
                const role = roleProfileMap[roleId]
                return (
                  <button
                    key={roleId}
                    type="button"
                    onClick={() => onSelectRole(roleId)}
                    className={roleChipClass}
                  >
                    <span className="text-sm font-medium text-[color:var(--hv-ivory)]">{role?.label ?? roleId}</span>
                    {role?.description ? (
                      <span className="text-xs leading-5 text-white/48">{role.description}</span>
                    ) : null}
                  </button>
                )
              })}
            </div>

            {profile.notes ? (
              <p className="text-[10px] uppercase leading-4 tracking-[0.14em] text-[color:var(--hv-gold-light)]/48">
                {profile.notes}
              </p>
            ) : null}
          </>
        )}
      </div>
    </RouterBottomSheet>
  )
}
