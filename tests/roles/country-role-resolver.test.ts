import { describe, expect, it } from 'vitest'
import { resolveGlobeRoute } from '@/lib/globe/route-resolver'
import { roleFamilies } from '@/lib/roles/role-families'
import { resolveRoleModuleOrder } from '@/lib/roles/role-module-map'
import { roleProfiles } from '@/lib/roles/role-profiles'
import { resolveCountryRoleDashboard } from '@/lib/roles/country-role-resolver'
import { toCountryRoleDto } from '@/lib/roles/dto'

describe('country-role command center foundation', () => {
  it('seeds every role with a valid family and every family with baseline modules', () => {
    const familyKeys = new Set(roleFamilies.map((family) => family.key))
    expect(roleProfiles.length).toBeGreaterThan(200)
    for (const role of roleProfiles) expect(familyKeys.has(role.family)).toBe(true)
    for (const family of roleFamilies) expect(family.baselineModules.length).toBeGreaterThan(0)
  })

  it('resolves every seeded role deterministically', () => {
    for (const role of roleProfiles) {
      const first = resolveCountryRoleDashboard('canada', role.slug)
      const second = resolveCountryRoleDashboard('canada', role.slug)
      expect(first?.role.family).toBe(role.family)
      expect(first?.moduleOrder).toEqual(second?.moduleOrder)
      expect(first?.primaryAction.key).toBe(role.primaryCta)
    }
  })

  it('role changes alter CTA, module order, visibility, documents, counterparties, evidence, and empty copy', () => {
    const genetics = resolveCountryRoleDashboard('canada', 'geneticist')!
    const medical = resolveCountryRoleDashboard('canada', 'doctor')!
    const pharmacy = resolveCountryRoleDashboard('canada', 'pharmacist')!
    expect(genetics.primaryAction.key).not.toBe(medical.primaryAction.key)
    expect(genetics.moduleOrder[2]).not.toBe(medical.moduleOrder[2])
    expect(genetics.documents).not.toEqual(medical.documents)
    expect(genetics.counterparties).not.toEqual(medical.counterparties)
    expect(genetics.evidence.required).not.toEqual(medical.evidence.required)
    expect(genetics.role.emptyState).not.toEqual(pharmacy.role.emptyState)
    expect(toCountryRoleDto(genetics, 'public_guest').moduleOrder).not.toEqual(toCountryRoleDto(genetics, 'verified_organization').moduleOrder)
  })

  it('keeps medical, genetics/IP, and pharmacy modules in their own operating surfaces', () => {
    const medical = resolveCountryRoleDashboard('canada', 'doctor')!
    const genetics = resolveCountryRoleDashboard('canada', 'geneticist')!
    const pharmacy = resolveCountryRoleDashboard('canada', 'pharmacist')!
    expect(medical.moduleOrder[2]).toBe('clinical_pathway')
    expect(medical.moduleOrder).not.toContain('verified_suppliers')
    expect(genetics.moduleOrder[2]).toBe('cultivar_passport')
    expect(genetics.moduleOrder).not.toContain('clinical_pathway')
    expect(pharmacy.moduleOrder[2]).toBe('pharmacy_checklist')
    expect(pharmacy.moduleOrder).not.toContain('cultivar_passport')
  })

  it('returns evidence-gap states for incomplete country-role data', () => {
    const dashboard = resolveCountryRoleDashboard('united-kingdom', 'exporter')!
    expect(dashboard.evidence.confidence).toBe('evidence_gap')
    expect(dashboard.evidence.message).toBe('Evidence gap: Harbourview has not fully verified this country-role pathway yet.')
    expect(dashboard.actions).toEqual(expect.arrayContaining(['request_review', 'submit_evidence', 'track_jurisdiction', 'view_adjacent_markets']))
  })

  it('does not expose private/admin fields outside DTO allowlists', () => {
    const dashboard = resolveCountryRoleDashboard('canada', 'harbourview_admin')!
    const publicDto = toCountryRoleDto(dashboard, 'public_guest') as unknown as Record<string, unknown>
    const adminDto = toCountryRoleDto(dashboard, 'harbourview_admin') as unknown as Record<string, unknown>
    expect(publicDto.private).toBeUndefined()
    expect(publicDto.admin).toBeUndefined()
    expect(JSON.stringify(publicDto)).not.toContain('sourceNotes')
    expect(adminDto.admin).toBeDefined()
    expect(adminDto.private).toBeUndefined()
  })

  it('fails invalid country/role safely and globe routes to country-role URLs', () => {
    expect(resolveCountryRoleDashboard('not-a-country', 'doctor')).toBeNull()
    expect(resolveCountryRoleDashboard('canada', 'not-a-role')).toBeNull()
    const route = resolveGlobeRoute({ countryIso2: 'CA', roleId: 'doctor_prescriber', mode: 'single_market', source: 'globe_router' })
    expect(route.href).toContain('/country/canada/role/doctor')
  })
})
