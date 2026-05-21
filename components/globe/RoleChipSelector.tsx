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
      <p className="text-sm leading-6 text-white/68">
        We use this to show the right Harbourview path. Search if your role is not shown.
      </p>

      <label className="mt-4 block">
        <span className="sr-only">Search roles</span>
        <input
          data-first-actionable="true"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search roles"
          className="min-h-11 w-full rounded-full border border-[#c6a55a]/24 bg-white/[0.06] px-4 text-sm text-white outline-none placeholder:text-white/42 focus-visible:border-[#f3d37a] focus-visible:ring-2 focus-visible:ring-[#f3d37a]/70"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        {rolesToRender.length > 0 ? rolesToRender.map((role) => (
          <button
            key={role.id}
            type="button"
            aria-pressed={selectedRoleId === role.id}
            onClick={() => onSelectRole(role.id)}
            className={`min-h-11 rounded-full border px-4 text-left text-xs font-semibold tracking-[0.03em] outline-none transition focus-visible:ring-2 focus-visible:ring-[#f3d37a]/70 ${
              selectedRoleId === role.id
                ? 'border-[#f3d37a] bg-[#c6a55a]/20 text-[#fff7df]'
                : 'border-[#c6a55a]/20 bg-white/[0.045] text-white/74 hover:border-[#c6a55a]/48 hover:text-white'
            }`}
          >
            {role.label}
          </button>
        )) : (
          <div className="rounded-2xl border border-[#c6a55a]/18 bg-white/[0.04] p-4 text-sm text-white/64">
            <p>We can still route this. Describe your role or choose Not sure.</p>
            <button
              type="button"
              onClick={() => onSelectRole('not_sure')}
              className="mt-3 min-h-11 rounded-full border border-[#c6a55a]/28 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#f5f1e8] outline-none focus-visible:ring-2 focus-visible:ring-[#f3d37a]/70"
            >
              Not sure
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-white/44">No account required to choose a path.</p>
    </div>
  )
}
