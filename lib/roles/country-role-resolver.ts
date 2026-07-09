import { getCountryBySlug, countries } from '@/lib/dashboard/countries'
import type { ActionKey, PermissionTier, ResolvedCountryRoleDashboard } from './types'
import { roleFamilyMap } from './role-families'
import { roleProfileMap } from './role-profiles'
import { getActionDefinition, evidenceGapActionKeys } from './role-actions'
import { resolveRoleModuleOrder } from './role-module-map'

const adminOnlyRoleFamily = 'harbourview_admin_operator'

function isAdminOnlyRole(roleSlug?: string) {
  const role = roleSlug ? roleProfileMap[roleSlug] : undefined
  return role?.family === adminOnlyRoleFamily
}

const privateFields = {
  counterpartyIntelligence: ['admin-gated counterparty intelligence placeholder'],
  sourceNotes: ['admin-gated source notes placeholder'],
  evidenceVaultDetails: ['admin-gated evidence vault placeholder'],
  geneticIpFiles: ['admin-gated genetic/IP file placeholder'],
  supplierReviewNotes: ['admin-gated supplier review placeholder'],
  coaReviewInternals: ['admin-gated COA review placeholder'],
  adminReviewState: 'pending_review',
  privateDocuments: ['admin-gated private document placeholder'],
  organizationDealData: ['organization-gated deal data placeholder'],
  requestIntroductionHistory: ['admin-gated request history placeholder'],
}

export function getCountryRoleHref(countrySlug: string, roleSlug: string) {
  return `/country/${countrySlug}/role/${roleSlug}`
}

export function resolveCountryRoleDashboard(countrySlug: string, roleSlug: string, visibility: PermissionTier = 'public_guest', evidenceVerified: boolean = false): ResolvedCountryRoleDashboard | null {
  const country = getCountryBySlug(countrySlug)
  const role = roleProfileMap[roleSlug]
  if (!country || !role) return null
  if (role.family === adminOnlyRoleFamily && visibility !== 'harbourview_admin') return null

  const moduleOrder = resolveRoleModuleOrder(role)
  const actions: ActionKey[] = [role.primaryCta, ...evidenceGapActionKeys]
  return {
    country: { countrySlug: country.slug, countryName: country.displayName, countryIso2: country.iso2, status: evidenceVerified ? 'available' : 'evidence_gap', available: true, evidenceVerified, requiredEvidence: role.evidenceRequirements, permissionFloor: role.family === adminOnlyRoleFamily ? 'harbourview_admin' : 'public_guest' },
    role,
    family: roleFamilyMap[role.family],
    moduleOrder,
    actions,
    primaryAction: getActionDefinition(role.primaryCta, country.slug, role.slug),
    documents: role.documentTypes,
    counterparties: role.counterpartyTypes,
    evidence: { confidence: evidenceVerified ? 'verified' : 'evidence_gap', required: role.evidenceRequirements, message: evidenceVerified ? undefined : 'Evidence gap: Harbourview has not fully verified this country-role pathway yet.' },
    visibility,
    private: privateFields,
    admin: { reviewState: evidenceVerified ? 'published' : 'needs_review', exposureFlags: evidenceVerified ? [] : ['evidence_gap'] },
  }
}

export function getSafeCountryRoleRedirect(countrySlug?: string, roleSlug?: string) {
  const country = countrySlug ? getCountryBySlug(countrySlug) : countries[0]
  const role = roleSlug ? roleProfileMap[roleSlug] : undefined
  if (country && role && !isAdminOnlyRole(role.slug)) return getCountryRoleHref(country.slug, role.slug)
  return '/market-selection?reason=invalid-country-role'
}
