'use client'

import { KeyboardEvent, useMemo, useState } from 'react'
import { RouterBottomSheet } from './RouterBottomSheet'
import { getCountryRoleProfile, getMultiMarketRoleIds } from '@/config/globe/country-role-profiles'
import { roleProfileMap } from '@/config/globe/role-profiles'
import { tokenMatchesSearch } from '@/lib/globe/search-normalization'
import type { RoleId } from '@/types/globe-router'

interface Props {
  /** Single-market selection. Undefined in multi_market mode. */
  countryIso2?: string
  /** All selected markets. Drives the curated list in multi_market mode. */
  countryIso2s: string[]
  countryName: string
  mode: 'single_market' | 'multi_market' | 'not_sure'
  searchQuery: string
  onSearchQuery: (query: string) => void
  onSelectRole: (roleId: RoleId) => void
  onSearchSelectRole: (roleId: RoleId) => void
  onNotSure: () => void
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
      style={{ flexShrink: 0, color: 'rgba(212,173,58,0.72)' }}
    >
      <circle cx="5.8" cy="5.8" r="4.1" stroke="currentColor" strokeWidth="1.4" />
      <line x1="9.2" y1="9.2" x2="12.6" y2="12.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function RoleSelectSheet({
  countryIso2,
  countryIso2s,
  countryName,
  mode,
  searchQuery,
  onSearchQuery,
  onSelectRole,
  onSearchSelectRole,
  onNotSure,
  onBack,
}: Props) {
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  // Curated shortlist. Multi-market weights cross-border roles across every
  // selected market; single-market uses that country's curated profile and
  // falls back to the global default for uncurated countries.
  const profile = useMemo(() => getCountryRoleProfile(countryIso2), [countryIso2])

  const primaryRoleIds = useMemo(() => {
    if (mode === 'multi_market' && countryIso2s.length > 0) {
      return getMultiMarketRoleIds(countryIso2s).slice(0, 9)
    }
    return profile.primaryRoleIds
  }, [mode, countryIso2s, profile])

  // 'not_sure' is always rendered as its own escape hatch in the footer, never
  // as a chip competing with the real roles.
  const chipRoleIds = useMemo(
    () => primaryRoleIds.filter((roleId) => roleId !== 'not_sure'),
    [primaryRoleIds],
  )

  const query = searchQuery.trim()
  const hasQuery = query.length > 0

  // Search spans every role, not just the curated shortlist — that's the whole
  // point of "curated list + search to find more".
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
      footer={
        <button
          type="button"
          onClick={onNotSure}
          className="min-h-11 w-full rounded-full border border-[#c6a55a]/28 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5f1e8]/78 transition hover:border-[#c6a55a]/60 hover:text-[#fff8e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1dfaa]"
        >
          I&apos;m not sure yet
        </button>
      }
    >
      <div className="grid gap-4">
        <p className="text-sm leading-6 text-white/60">
          {mode === 'multi_market'
            ? 'Your role determines which intelligence, pathways and counterparties we surface across these markets.'
            : `Your role determines which intelligence, pathways and counterparties we surface for ${countryName}.`}
        </p>

        {/* Search — spans every role, including ones not in the shortlist */}
        <label className="block" htmlFor="role-search-input">
          <span className="sr-only">Search all roles</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.045)',
              border: '1px solid rgba(212,173,58,0.22)',
              borderRadius: '8px',
              padding: '0 12px',
              boxShadow: 'inset 0 1px 6px rgba(0,0,0,0.22)',
            }}
          >
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
              style={{
                flex: 1,
                minHeight: '40px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                letterSpacing: '0.02em',
                color: '#fff8e6',
                WebkitAppearance: 'none',
              }}
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
                  className={`grid min-h-12 w-full gap-0.5 rounded-lg px-3 py-2 text-left transition ${
                    isHighlighted ? 'bg-[#c6a55a]/12' : 'bg-transparent hover:bg-white/[0.04]'
                  }`}
                  style={{ borderLeft: `2px solid ${isHighlighted ? 'rgba(212,173,58,0.72)' : 'transparent'}` }}
                >
                  <span className="text-sm font-medium text-[#fff8e6]">{role?.label ?? roleId}</span>
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
                    className="grid min-h-12 w-full gap-0.5 rounded-lg border border-[#c6a55a]/18 bg-white/[0.03] px-4 py-2.5 text-left transition hover:border-[#c6a55a]/55 hover:bg-[#c6a55a]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1dfaa]"
                  >
                    <span className="text-sm font-medium text-[#fff8e6]">{role?.label ?? roleId}</span>
                    {role?.description ? (
                      <span className="text-xs leading-5 text-white/48">{role.description}</span>
                    ) : null}
                  </button>
                )
              })}
            </div>

            {profile.notes ? (
              <p className="text-[10px] uppercase leading-4 tracking-[0.14em] text-[#d8be76]/48">
                {profile.notes}
              </p>
            ) : null}
          </>
        )}
      </div>
    </RouterBottomSheet>
  )
}
