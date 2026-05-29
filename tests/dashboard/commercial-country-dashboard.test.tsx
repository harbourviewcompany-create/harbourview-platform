import React from 'react'
;(globalThis as { React?: typeof React }).React = React

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CountryDashboardShell } from '@/app/dashboard/country/[country]/_components'
import {
  assertCountryDashboardPublicSafe,
  countryHeatmapLayers,
  getCountryCommercialDashboard,
} from '@/lib/dashboard/commercial'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'

function country(slug: string) {
  const record = resolveCountryRouteParam(slug)
  if (!record) throw new Error(`Missing country fixture: ${slug}`)
  return record
}

function renderBrazil(role: string) {
  return renderToStaticMarkup(<CountryDashboardShell country={country('brazil')} dashboardRole={role} selectedLayer="marketplace_activity" />)
}

describe('commercial country dashboard payload boundary', () => {
  it('projects public-safe commercial dashboard structures without forbidden private keys', () => {
    const commercial = getCountryCommercialDashboard(country('brazil'))

    expect(assertCountryDashboardPublicSafe(commercial)).toEqual([])
    expect(commercial.marketplace.categories).toEqual(expect.arrayContaining([
      'Consumables',
      'Cannabis products / import-export opportunities',
      'Distressed equipment',
      'New equipment',
      'Used equipment',
      'Packaging',
      'Testing/lab services',
      'Cultivation inputs',
      'Processing equipment',
      'Pharmacy/clinic-related products',
      'Professional services',
    ]))
    expect(new Set(commercial.heatmapMetrics.map((metric) => metric.layer))).toEqual(new Set(countryHeatmapLayers))
  })
})

describe('commercial country dashboard render views', () => {
  it('renders Brazil Buyer view with marketplace workflows visible first', () => {
    const html = renderBrazil('buyer')
    expect(html).toContain('Buyer operating view')
    expect(html).toContain('Marketplace listings and wanted matches')
    expect(html).toContain('Request quote')
    expect(html).toContain('Post wanted request')
  })

  it('renders Brazil Seller/Supplier view with listing creation and demand', () => {
    const html = renderBrazil('seller_supplier')
    expect(html).toContain('Seller / Supplier operating view')
    expect(html).toContain('Submit a commercial listing')
    expect(html).toContain('Buyer demand and quote requests')
  })

  it('renders Brazil Importer view with trade access and reviewed suppliers', () => {
    const html = renderBrazil('importer')
    expect(html).toContain('Importer operating view')
    expect(html).toContain('Import pathway review')
    expect(html).toContain('Reviewed exporters and suppliers')
  })

  it('renders Brazil Doctor view with education cards visible first', () => {
    const html = renderBrazil('doctor')
    expect(html).toContain('Doctor operating view')
    expect(html).toContain('Clinical education modules')
    expect(html).toContain('Professional education first-screen cards')
    expect(html).not.toContain('direct clinical inducement')
  })

  it('renders Brazil Pharmacist view with pharmacy education cards visible first', () => {
    const html = renderBrazil('pharmacist')
    expect(html).toContain('Pharmacist operating view')
    expect(html).toContain('Pharmacy education modules')
    expect(html).toContain('Professional education first-screen cards')
  })

  it('renders a fallback country view with public-safe commercial framing', () => {
    const html = renderToStaticMarkup(<CountryDashboardShell country={country('afghanistan')} dashboardRole="general_research" selectedLayer="trade_access" />)
    expect(html).toContain('General Research operating view')
    expect(html).toContain('Fallback country dashboard')
    expect(html).toContain('Movement is supporting context only')
    expect(html).toContain('Trade Access')
  })
})
