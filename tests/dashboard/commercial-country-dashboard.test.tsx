import React from 'react'
;(globalThis as { React?: typeof React }).React = React

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CountryDashboardShell } from '@/app/dashboard/country/[country]/_components'
import { getCountryDashboardRecord, serializeCountryCommercialDashboardPublicDto } from '@/lib/dashboard/commercial'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { assertDashboardDtoPublicSafe } from '@/lib/dashboard/publicSafety'

function countryOrThrow(slug: string) {
  const country = resolveCountryRouteParam(slug)
  if (!country) throw new Error(`Missing country fixture: ${slug}`)
  return country
}

function renderBrazilRole(role: Parameters<typeof CountryDashboardShell>[0]['commercialRole']) {
  return renderToStaticMarkup(<CountryDashboardShell country={countryOrThrow('brazil')} commercialRole={role} />)
}

describe('commercial country dashboard DTO boundary', () => {
  it('serializes Brazil commercial dashboard through an explicit public allowlist', () => {
    const dto = serializeCountryCommercialDashboardPublicDto(getCountryDashboardRecord(countryOrThrow('brazil')))

    expect(dto.displayName).toBe('Brazil')
    expect(dto.marketplace.listings.length).toBeGreaterThan(0)
    expect(dto.education.modules.length).toBeGreaterThan(0)
    expect(dto.reviewActions.map((action) => action.label)).toEqual(expect.arrayContaining([
      'Request quote',
      'Submit listing',
      'Post wanted request',
      'Request import/export review',
      'Request doctor/pharmacist education access',
    ]))
    expect(assertDashboardDtoPublicSafe(dto)).toEqual([])
  })

  it('keeps comparison heatmap and marketplace payloads free of private dashboard fields', () => {
    const dto = serializeCountryCommercialDashboardPublicDto(getCountryDashboardRecord(countryOrThrow('germany')))
    const serialized = JSON.stringify(dto)

    expect(serialized).toContain('Marketplace Activity')
    expect(serialized).toContain('Trade Access')
    expect(serialized).toContain('Source Coverage')
    expect(assertDashboardDtoPublicSafe(dto)).toEqual([])
  })
})

describe('role-aware commercial country dashboard rendering', () => {
  it('renders Brazil Buyer view with marketplace first-screen cards', () => {
    const html = renderBrazilRole('buyer')

    expect(html).toContain('Buyer commercial operating view for Brazil')
    expect(html).toContain('Source reviewed offers and wanted matches')
    expect(html).toContain('Request quote')
    expect(html).toContain('Marketplace Activity')
  })

  it('renders Brazil Seller/Supplier view with listing and buyer matching actions', () => {
    const html = renderBrazilRole('seller_supplier')

    expect(html).toContain('Seller / Supplier commercial operating view for Brazil')
    expect(html).toContain('Create supply visibility')
    expect(html).toContain('Submit listing')
    expect(html).toContain('Request buyer match')
  })

  it('renders Brazil Importer view with import pathways and reviewed supplier routes', () => {
    const html = renderBrazilRole('importer')

    expect(html).toContain('Importer commercial operating view for Brazil')
    expect(html).toContain('Import pathway fit')
    expect(html).toContain('Reviewed exporter and supplier routes')
    expect(html).toContain('Request import review')
  })

  it('renders Brazil Doctor view with education first and no direct marketplace inducement framing', () => {
    const html = renderBrazilRole('doctor')

    expect(html).toContain('Doctor commercial operating view for Brazil')
    expect(html).toContain('Clinical education modules')
    expect(html).toContain('Professional practice context')
    expect(html).toContain('Request education access')
  })

  it('renders Brazil Pharmacist view with pharmacy education first-screen cards', () => {
    const html = renderBrazilRole('pharmacist')

    expect(html).toContain('Pharmacist commercial operating view for Brazil')
    expect(html).toContain('Pharmacy workflow education')
    expect(html).toContain('Dispensing readiness gates')
    expect(html).toContain('Request document review')
  })

  it('renders fallback country view with commercial operating framing', () => {
    const html = renderToStaticMarkup(<CountryDashboardShell country={countryOrThrow('afghanistan')} commercialRole="general_research" selectedLayer="Trade Access" />)

    expect(html).toContain('General Research commercial operating view for Afghanistan')
    expect(html).toContain('Country commercial overview')
    expect(html).toContain('Trade Access')
    expect(html).toContain('Harbourview action rail')
  })
})
