'use client'

import { getCountryRoleProfile } from '@/config/globe/country-role-profiles'
import { roleProfileMap, roleProfiles } from '@/config/globe/role-profiles'
import { tokenMatchesSearch } from '@/lib/globe/search-normalization'
import type { RoleId, RoleProfile } from '@/types/globe-router'

function isRoleProfile(role: RoleProfile | undefined): role is RoleProfile {
  return Boolean(role)
}

export function RoleChipSelector({
  countryIso2,
  searchQuery,
  selectedRoleId,
  onSearchChange,
  onSelectRole,
}: {
  countryIso2?: string
  searchQuery: string
  selectedRoleId?: RoleId
  onSearchChange: (query: string) => void
  onSelectRole: (roleId: RoleId) => void
}) {
  const profile = getCountryRoleProfile(countryIso2)
  const visibleRoleIds = profile.primaryRoleIds.filter((roleId) => roleId !== 'not_sure')
  const searchedRoles = roleProfiles.filter((role) =>
    role.id !== 'not_sure' && tokenMatchesSearch(searchQuery, [role.label, role.shortLabel, role.description, ...role.aliases]),
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
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search roles"
          className="min-h-11 w-full rounded-full border border-[#c6a55a]/24 bg-white/[0.06] px-4 text-sm text-white outline-none placeholder:text-white/42 focus:border-[#d8be76]"
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
                ? 'border-[#f3d37a] bg-[#c6a55a]/20 text-[#fff7df]'
                : 'border-[#c6a55a]/20 bg-white/[0.045] text-white/74 hover:border-[#c6a55a]/48 hover:text-white'
            }`}
          >
            {role.label}
          </button>
        )) : (
          <div className="rounded-2xl border border-[#c6a55a]/18 bg-white/[0.04] p-4 text-sm text-white/64">
            <p>No matching supported roles found. Refine your search to choose a listed role.</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-white/44">No account required to choose a path.</p>
    </div>
  )
}
