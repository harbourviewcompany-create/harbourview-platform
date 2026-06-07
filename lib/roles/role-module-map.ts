import type { ModuleKey, RoleProfile } from './types'
import { roleFamilyMap } from './role-families'

export function resolveRoleModuleOrder(role: RoleProfile): ModuleKey[] {
  const family = roleFamilyMap[role.family]
  const blocked = new Set(role.blockedModules ?? [])
  return Array.from(new Set<ModuleKey>([...role.roleModules, ...family.baselineModules, 'country_status', 'evidence_gap', 'actions']))
    .filter((module) => !blocked.has(module))
}
