import { describe, expect, it } from 'vitest'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import {
  getCommercialCountryDashboardRecord,
  getDefaultRoleForDashboardSection,
  normalizeCountryDashboardRole,
  normalizeCountryHeatmapLayer,
  resolveCommercialDashboardSelection,
} from '@/lib/dashboard/commercialDashboard'
import { serializeCommercialCountryDashboardPublicDto } from '@/lib/dashboard/publicDto'
import { assertDashboardDtoPublicSafe } from '@/lib/dashboard/publicSafety'

function requireCountry(slug: string) {
  const country = resolveCountryRouteParam(slug)
  expect(country, `expected ${slug} country fixture`).toBeTruthy()
  return country!
}

// NOTE: this file previously also covered role-specific *rendering* via
// CountryDashboardShell/CountryConsoleShell (Buyer/Seller/Doctor/
// Pharmacist/etc. views rendered into <main>). That integration was never
// actually wired in production -- confirmed by tracing the real route
// (app/dashboard/country/[country]/layout.tsx renders CountryConsoleShell
// with zero role props) -- and was superseded by the real, working
// role-personalization surface at /country/[country]/role/[role]
// (CommandCentre). Removed per product decision rather than building out
// a duplicate of an already-shipped feature. The data-layer tests below
// (getCommercialCountryDashboardRecord, the public-DTO boundary, role/layer
// normalization) are unaffected -- they test lib/dashboard/commercialDashboard.ts
// directly, not the shell, and remain valid/passing.

describe('commercial country dashboard DTO boundary', () => {
  it('serializes Brazil through an explicit public-safe allowlist', () => {
    const dto = serializeCommercialCountryDashboardPublicDto(getCommercialCountryDashboardRecord(requireCountry('brazil'), 'marketplace_activity'))
    expect(dto.displayName).toBe('Brazil')
    expect(dto.marketplace.listingSummaries[0]).toEqual(expect.objectContaining({ title: expect.stringContaining('Consumables') }))
    expect(dto.reviewActions.map((action) => action.label)).toEqual(expect.arrayContaining(['Request quote', 'Submit listing', 'Request import/export review']))
    expect(assertDashboardDtoPublicSafe(dto)).toEqual([])
  })

  it('normalizes public role and heatmap layer query values', () => {
    expect(normalizeCountryDashboardRole('Seller / Supplier')).toBe('seller_supplier')
    expect(normalizeCountryDashboardRole('doctor_prescriber')).toBe('doctor')
    expect(normalizeCountryDashboardRole('pharmacist')).toBe('pharmacist')
    expect(normalizeCountryHeatmapLayer('Clinical Education Demand')).toBe('clinical_education_demand')
    expect(normalizeCountryHeatmapLayer('unknown')).toBe('marketplace_activity')
    expect(resolveCommercialDashboardSelection({}, getDefaultRoleForDashboardSection('education')).selectedRole).toBe('doctor')
    expect(resolveCommercialDashboardSelection({ role: 'pharmacist', layer: 'Pharmacy Readiness' }, getDefaultRoleForDashboardSection('education'))).toEqual({
      selectedRole: 'pharmacist',
      selectedLayer: 'pharmacy_readiness',
    })
  })
})
