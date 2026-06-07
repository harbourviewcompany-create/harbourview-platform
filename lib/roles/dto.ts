import { filterVisibleModules } from './role-permissions'
import type { PermissionTier, ResolvedCountryRoleDashboard } from './types'

export interface CountryRolePublicDto {
  country: ResolvedCountryRoleDashboard['country']
  role: Pick<ResolvedCountryRoleDashboard['role'], 'key' | 'slug' | 'label' | 'shortLabel' | 'family' | 'operatingQuestion' | 'priority' | 'language' | 'emptyState'>
  family: Pick<ResolvedCountryRoleDashboard['family'], 'key' | 'label' | 'description'>
  moduleOrder: ResolvedCountryRoleDashboard['moduleOrder']
  actions: ResolvedCountryRoleDashboard['actions']
  primaryAction: ResolvedCountryRoleDashboard['primaryAction']
  documents: ResolvedCountryRoleDashboard['documents']
  counterparties: ResolvedCountryRoleDashboard['counterparties']
  evidence: ResolvedCountryRoleDashboard['evidence']
  visibility: PermissionTier
  admin?: Pick<ResolvedCountryRoleDashboard['admin'], 'reviewState' | 'exposureFlags'>
}

export function toCountryRoleDto(dashboard: ResolvedCountryRoleDashboard, tier: PermissionTier): CountryRolePublicDto {
  const base: CountryRolePublicDto = {
    country: dashboard.country,
    role: {
      key: dashboard.role.key,
      slug: dashboard.role.slug,
      label: dashboard.role.label,
      shortLabel: dashboard.role.shortLabel,
      family: dashboard.role.family,
      operatingQuestion: dashboard.role.operatingQuestion,
      priority: dashboard.role.priority,
      language: dashboard.role.language,
      emptyState: dashboard.role.emptyState,
    },
    family: {
      key: dashboard.family.key,
      label: dashboard.family.label,
      description: dashboard.family.description,
    },
    moduleOrder: filterVisibleModules(dashboard.moduleOrder, tier),
    actions: dashboard.actions,
    primaryAction: dashboard.primaryAction,
    documents: tier === 'public_guest' ? [] : dashboard.documents,
    counterparties: tier === 'public_guest' ? [] : dashboard.counterparties,
    evidence: dashboard.evidence,
    visibility: tier,
  }

  if (tier === 'harbourview_admin') {
    return { ...base, moduleOrder: dashboard.moduleOrder, admin: dashboard.admin }
  }

  return base
}
