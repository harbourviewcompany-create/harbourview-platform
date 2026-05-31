'use client'

import { getCountryRoleProfile, getMultiMarketRoleIds } from '@/config/globe/country-role-profiles'
import { roleProfileMap, roleProfiles } from '@/config/globe/role-profiles'
import { tokenMatchesSearch } from '@/lib/globe/search-normalization'
import type { RoleId, RoleProfile } from '@/types/globe-router'

function isRoleProfile(role: RoleProfile | undefined): role is RoleProfile {
  return Boolean(role)
}

export function RoleChipSelector({
  countryIso2,
  countryIso2s,
  mode,
  searchQuery,
  selectedRoleId,
  onSearchChange,
  onSelectRole,
}: {
  countryIso2?: string
  countryIso2s: string[]
  mode: string
  searchQuery: string
  selectedRoleId?: RoleId
  onSearchChange: (query: string) => void
  onSelectRole: (roleId: RoleId) => void
}) {
  const profile = getCountryRoleProfile(countryIso2)
  const visibleRoleIds = mode === 'multi_market'
    ? getMultiMarketRoleIds(countryIso2s).slice(0, 11)
    : profile.primaryRoleIds
  const searchedRoles = roleProfiles.filter((role) =>
    tokenMatchesSearch(searchQuery, [role.label, role.shortLabel, role.description, ...role.aliases]),
  )
  const rolesToRender = searchQuery
    ? searchedRoles
    : visibleRoleIds.map((roleId) => roleProfileMap[roleId]).filter(isRoleProfile)

  return (
    <div>
      <p className="text-sm leading-6 text-white/78">
        We use this to show the right Harbourview path. Search if your role is not shown.
      </p>

      <label className="mt-4 block">
        <span className="sr-only">Search roles</span>
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search roles"
          className="min-h-11 w-full rounded-full border border-[#e0c77f]/34 bg-[#061323]/86 px-4 text-sm text-[#fff8e6] outline-none placeholder:text-white/62 focus:border-[#f1dfaa] focus-visible:ring-2 focus-visible:ring-[#f1dfaa] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020913]"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        {rolesToRender.length > 0 ? rolesToRender.map((role) => (
          <button
            key={role.id}
            type="button"
            aria-pressed={selectedRoleId === role.id}
            onClick={() => onSelectRole(role.id)}
            className={`min-h-11 rounded-full border px-4 text-left text-xs font-semibold tracking-[0.03em] transition ${
              selectedRoleId === role.id
                ? 'border-[#f1dfaa] bg-[#d7bd72]/22 text-[#fff8e6] shadow-[0_0_18px_rgba(215,189,114,0.12)]'
                : 'border-[#e0c77f]/28 bg-white/[0.06] text-white/84 hover:border-[#f1dfaa]/58 hover:bg-white/[0.09] hover:text-white'
            }`}
          >
            {role.label}
          </button>
        )) : (
          <div className="rounded-2xl border border-[#e0c77f]/24 bg-white/[0.055] p-4 text-sm text-white/78">
            <p>We can still route this. Describe your role or choose Not sure.</p>
            <button
              type="button"
              onClick={() => onSelectRole('not_sure')}
              className="mt-3 min-h-11 rounded-full border border-[#e0c77f]/36 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#f5f1e8]"
            >
              Not sure
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-white/58">No account required to choose a path.</p>
    </div>
  )
}
