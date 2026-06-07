import { getCountryBySlug, countries } from '@/lib/dashboard/countries'
import type { ActionKey, PermissionTier, ResolvedCountryRoleDashboard } from './types'
import { roleFamilyMap } from './role-families'
import { roleProfileMap } from './role-profiles'
import { getActionDefinition, evidenceGapActionKeys } from './role-actions'
import { resolveRoleModuleOrder } from './role-module-map'

const evidenceVerifiedCountrySlugs = new Set(['canada', 'germany', 'australia', 'brazil', 'israel'])

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

export function resolveCountryRoleDashboard(countrySlug: string, roleSlug: string, visibility: PermissionTier = 'public_guest'): ResolvedCountryRoleDashboard | null {
  const country = getCountryBySlug(countrySlug)
  const role = roleProfileMap[roleSlug]
  if (!country || !role) return null

  const evidenceVerified = evidenceVerifiedCountrySlugs.has(country.slug)
  const moduleOrder = resolveRoleModuleOrder(role)
  const actions: ActionKey[] = [role.primaryCta, ...evidenceGapActionKeys]
  return {
    country: { countrySlug: country.slug, countryName: country.displayName, countryIso2: country.iso2, status: evidenceVerified ? 'available' : 'evidence_gap', available: true, evidenceVerified, requiredEvidence: role.evidenceRequirements, permissionFloor: 'public_guest' },
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
  if (country && role) return getCountryRoleHref(country.slug, role.slug)
  return '/market-selection?reason=invalid-country-role'
}
