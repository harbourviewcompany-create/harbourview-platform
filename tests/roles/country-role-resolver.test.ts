import { describe, expect, it } from 'vitest'
import { resolveGlobeRoute } from '@/lib/globe/route-resolver'
import { roleFamilies } from '@/lib/roles/role-families'
import { roleProfiles } from '@/lib/roles/role-profiles'
import { resolveCountryRoleDashboard } from '@/lib/roles/country-role-resolver'
import { toCountryRoleDto } from '@/lib/roles/dto'

const publicRoles = roleProfiles.filter((role) => role.family !== 'harbourview_admin_operator')

describe('country-role command center foundation', () => {
  it('seeds every role with a valid family and every family with baseline modules', () => {
    const familyKeys = new Set(roleFamilies.map((family) => family.key))
    expect(roleProfiles.length).toBeGreaterThan(200)
    for (const role of roleProfiles) expect(familyKeys.has(role.family)).toBe(true)
    for (const family of roleFamilies) expect(family.baselineModules.length).toBeGreaterThan(0)
  })



  it('keeps the seeded role universe unique and operationally complete', () => {
    const slugs = new Set<string>()
    for (const role of roleProfiles) {
      expect(slugs.has(role.slug), `${role.slug} should be unique`).toBe(false)
      slugs.add(role.slug)
      expect(role.primaryCta, `${role.slug} needs a CTA`).toBeTruthy()
      expect(role.roleModules.length, `${role.slug} needs modules`).toBeGreaterThan(0)
      expect(role.documentTypes.length, `${role.slug} needs document types`).toBeGreaterThan(0)
      expect(role.counterpartyTypes.length, `${role.slug} needs counterparties`).toBeGreaterThan(0)
      expect(role.evidenceRequirements.length, `${role.slug} needs evidence requirements`).toBeGreaterThan(0)
      expect(role.emptyState.toLowerCase(), `${role.slug} must be a safe empty state`).toContain('no verified')
      expect(role.emptyState.toLowerCase(), `${role.slug} must not claim availability`).not.toContain('available')
    }
  })

  it('resolves every public seeded role deterministically without treating static fixtures as verified evidence', () => {
    for (const role of publicRoles) {
      const first = resolveCountryRoleDashboard('canada', role.slug)
      const second = resolveCountryRoleDashboard('canada', role.slug)
      expect(first?.role.family).toBe(role.family)
      expect(first?.moduleOrder).toEqual(second?.moduleOrder)
      expect(first?.primaryAction.key).toBe(role.primaryCta)
      expect(first?.evidence.confidence).toBe('evidence_gap')
      expect(first?.country.evidenceVerified).toBe(false)
    }
  })

  it('role changes alter CTA, module order, visibility, documents, counterparties, evidence, and empty copy', () => {
    const genetics = resolveCountryRoleDashboard('canada', 'geneticist')!
    const medical = resolveCountryRoleDashboard('canada', 'doctor')!
    const pharmacy = resolveCountryRoleDashboard('canada', 'pharmacist')!
    expect(genetics.primaryAction.key).not.toBe(medical.primaryAction.key)
    expect(genetics.moduleOrder[0]).not.toBe(medical.moduleOrder[0])
    expect(genetics.documents).not.toEqual(medical.documents)
    expect(genetics.counterparties).not.toEqual(medical.counterparties)
    expect(genetics.evidence.required).not.toEqual(medical.evidence.required)
    expect(genetics.role.emptyState).not.toEqual(pharmacy.role.emptyState)
    expect(toCountryRoleDto(genetics, 'public_guest').moduleOrder[0]).toBe('cultivar_passport')
    expect(toCountryRoleDto(genetics, 'public_guest').moduleOrder).not.toEqual(toCountryRoleDto(genetics, 'verified_organization').moduleOrder)
  })

  it('keeps medical, genetics/IP, and pharmacy modules in their own operating surfaces', () => {
    const medical = resolveCountryRoleDashboard('canada', 'doctor')!
    const genetics = resolveCountryRoleDashboard('canada', 'geneticist')!
    const pharmacy = resolveCountryRoleDashboard('canada', 'pharmacist')!
    expect(medical.moduleOrder[0]).toBe('clinical_pathway')
    expect(medical.moduleOrder).not.toContain('verified_suppliers')
    expect(genetics.moduleOrder[0]).toBe('cultivar_passport')
    expect(genetics.moduleOrder).not.toContain('clinical_pathway')
    expect(pharmacy.moduleOrder[0]).toBe('pharmacy_checklist')
    expect(pharmacy.moduleOrder).not.toContain('cultivar_passport')
  })

  it('returns evidence-gap states for incomplete country-role data', () => {
    const dashboard = resolveCountryRoleDashboard('united-kingdom', 'exporter')!
    expect(dashboard.evidence.confidence).toBe('evidence_gap')
    expect(dashboard.evidence.message).toBe('Evidence gap: Harbourview has not fully verified this country-role pathway yet.')
    expect(dashboard.actions).toEqual(expect.arrayContaining(['request_review', 'submit_evidence', 'track_jurisdiction', 'view_adjacent_markets']))
  })

  it('blocks public access to Harbourview admin roles and keeps admin internals inside admin DTO allowlists', () => {
    expect(resolveCountryRoleDashboard('canada', 'harbourview_admin')).toBeNull()

    const publicDto = toCountryRoleDto(resolveCountryRoleDashboard('canada', 'doctor')!, 'public_guest') as unknown as Record<string, unknown>
    expect(publicDto.admin).toBeUndefined()
    expect(JSON.stringify(publicDto)).not.toContain('admin-gated')
    expect(JSON.stringify(publicDto)).not.toContain('privateDocuments')
    const dashboard = resolveCountryRoleDashboard('canada', 'harbourview_admin', 'harbourview_admin')!
    const adminDto = toCountryRoleDto(dashboard, 'harbourview_admin') as unknown as Record<string, unknown>
    expect(adminDto.admin).toBeDefined()
    expect(adminDto.private).toBeUndefined()
    expect(JSON.stringify(adminDto)).not.toContain('sourceNotes')
  })

  it('fails invalid country/role safely and globe routes public roles to country-role URLs', () => {
    expect(resolveCountryRoleDashboard('not-a-country', 'doctor')).toBeNull()
    expect(resolveCountryRoleDashboard('canada', 'not-a-role')).toBeNull()

    const dashboardRoute = resolveGlobeRoute({ countryIso2: 'CA', mode: 'single_market', source: 'globe_router' })
    expect(dashboardRoute.href).toContain('/dashboard?')
    const adminRoute = resolveGlobeRoute({ countryIso2: 'CA', roleId: 'government_regulator', intentId: 'regulatory_framework', mode: 'single_market', source: 'globe_router' })
    expect(adminRoute.href).not.toContain('/admin')
    const route = resolveGlobeRoute({ countryIso2: 'CA', roleId: 'doctor_prescriber', mode: 'single_market', source: 'globe_router' })
    expect(route.href).toContain('/country/canada/role/doctor')
  })
})
