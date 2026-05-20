'use client'

import { getIntentIdsForRole, intentProfileMap } from '@/config/globe/intent-profiles'
import { roleProfileMap } from '@/config/globe/role-profiles'
import type { IntentId, RoleId } from '@/types/globe-router'

export function IntentCardGrid({
  countryName,
  countryIso2,
  mode,
  roleId,
  selectedIntentId,
  onSelectIntent,
}: {
  countryName: string
  countryIso2?: string
  mode: string
  roleId?: RoleId
  selectedIntentId?: IntentId
  onSelectIntent: (intentId: IntentId) => void
}) {
  const role = roleId ? roleProfileMap[roleId] : undefined
  const intentIds = getIntentIdsForRole(roleId, countryIso2, mode)

  return (
    <div>
      <p className="text-sm leading-6 text-white/68">
        {role ? `${role.shortLabel} in ${countryName}: choose the reason you are here.` : `Choose the reason you are here.`}
      </p>

      <div className="mt-4 grid gap-3">
        {intentIds.map((intentId) => {
          const intent = intentProfileMap[intentId]

          return (
            <button
              key={intent.id}
              type="button"
              aria-pressed={selectedIntentId === intent.id}
              onClick={() => onSelectIntent(intent.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                selectedIntentId === intent.id
                  ? 'border-[#f3d37a] bg-[#c6a55a]/18 shadow-[0_0_28px_rgba(198,165,90,0.16)]'
                  : 'border-[#c6a55a]/18 bg-white/[0.045] hover:border-[#c6a55a]/42'
              }`}
            >
              <span className="block text-sm font-semibold text-[#f5f1e8]">{intent.label}</span>
              <span className="mt-2 block text-xs leading-5 text-white/58">{intent.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
