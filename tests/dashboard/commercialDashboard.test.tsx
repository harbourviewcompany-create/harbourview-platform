import React from 'react'
;(globalThis as { React?: typeof React }).React = React

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CountryDashboardShell } from '@/app/dashboard/country/[country]/_components'
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

function renderBrazil(role: ReturnType<typeof normalizeCountryDashboardRole>) {
  return renderToStaticMarkup(<CountryDashboardShell country={requireCountry('brazil')} selectedRole={role} selectedLayer="marketplace_activity" />)
}

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

describe('commercial country dashboard rendering', () => {
  it('renders Brazil Buyer view with first-screen marketplace workflows', () => {
    const html = renderBrazil('buyer')
    expect(html).toContain('Brazil · Buyer')
    expect(html).toContain('Marketplace and transaction workflows')
    expect(html).toContain('Request quote')
    expect(html).toContain('Wanted request')
  })

  it('renders Brazil Seller/Supplier view with listing creation and buyer demand', () => {
    const html = renderBrazil('seller_supplier')
    expect(html).toContain('Brazil · Seller / Supplier')
    expect(html).toContain('Create a seller listing')
    expect(html).toContain('Buyer demand map')
  })

  it('renders Brazil Importer view with import pathway and document readiness', () => {
    const html = renderBrazil('importer')
    expect(html).toContain('Brazil · Importer')
    expect(html).toContain('Import pathway review')
    expect(html).toContain('Landed readiness gates')
  })

  it('renders Brazil Doctor view with education first and no direct inducement framing', () => {
    const html = renderBrazil('doctor')
    expect(html).toContain('Brazil · Doctor')
    expect(html).toContain('Professional education and readiness')
    expect(html).toContain('Brazil medical cannabis prescribing context')
  })

  it('renders Brazil Pharmacist view with pharmacy workflow education first', () => {
    const html = renderBrazil('pharmacist')
    expect(html).toContain('Brazil · Pharmacist')
    expect(html).toContain('Professional education and readiness')
    expect(html).toContain('Brazil pharmacy dispensing and documentation workflow')
  })

  it('renders fallback country view with public-safe commercial routing', () => {
    const html = renderToStaticMarkup(<CountryDashboardShell country={requireCountry('afghanistan')} selectedRole="general_research" selectedLayer="trade_access" />)
    expect(html).toContain('Afghanistan · General Research')
    expect(html).toContain('public-safe commercial operating dashboard')
    expect(html).toContain('Request country brief')
  })
})
