import React from 'react'
;(globalThis as { React?: typeof React }).React = React

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CountryDashboardShell } from '@/app/dashboard/country/[country]/_components'
import { MOBILE_NAV_ITEMS } from '@/components/Nav'
import { searchCanonicalCountries } from '@/lib/dashboard/countrySearch'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'

const requiredCountrySearchCases = [
  ['Canada', 'Canada'],
  ['United States', 'United States'],
  ['Germany', 'Germany'],
  ['Portugal', 'Portugal'],
  ['Australia', 'Australia'],
  ['Thailand', 'Thailand'],
  ['South Africa', 'South Africa'],
  ['Brazil', 'Brazil'],
  ['Colombia', 'Colombia'],
  ['Lesotho', 'Lesotho'],
  ['North Macedonia', 'North Macedonia'],
  ['Malta', 'Malta'],
  ['Uruguay', 'Uruguay'],
  ['Israel', 'Israel'],
  ['Czechia', 'Czechia'],
  ['Netherlands', 'Netherlands'],
  ['Denmark', 'Denmark'],
  ['Poland', 'Poland'],
  ['Japan', 'Japan'],
  ['New Zealand', 'New Zealand'],
] as const

const requiredIsoSearchCases = [
  ['CA', 'CAN', 'Canada'],
  ['US', 'USA', 'United States'],
  ['DE', 'DEU', 'Germany'],
  ['PT', 'PRT', 'Portugal'],
  ['AU', 'AUS', 'Australia'],
  ['TH', 'THA', 'Thailand'],
  ['ZA', 'ZAF', 'South Africa'],
  ['BR', 'BRA', 'Brazil'],
  ['CO', 'COL', 'Colombia'],
  ['LS', 'LSO', 'Lesotho'],
  ['MK', 'MKD', 'North Macedonia'],
  ['MT', 'MLT', 'Malta'],
  ['UY', 'URY', 'Uruguay'],
  ['IL', 'ISR', 'Israel'],
  ['CZ', 'CZE', 'Czechia'],
  ['NL', 'NLD', 'Netherlands'],
  ['DK', 'DNK', 'Denmark'],
  ['PL', 'POL', 'Poland'],
  ['JP', 'JPN', 'Japan'],
  ['NZ', 'NZL', 'New Zealand'],
] as const

const forbiddenPublicStrings = [
  'View source listing',
  'sourceUrl',
  'sourceName',
  'Evidence captured',
  'provenanceSummary',
  'sourceEvidence',
  'verificationStatus',
  'availabilityStatus',
  'sellerAuthorizationStatus',
  'internalReviewNotes',
  'reviewedBy',
  'lastReviewedAt',
  'nextReviewDueAt',
]

function country(slug: string) {
  const record = resolveCountryRouteParam(slug)
  if (!record) throw new Error(`Missing country fixture: ${slug}`)
  return record
}

function dashboardHtml(role: string) {
  return renderToStaticMarkup(<CountryDashboardShell country={country('brazil')} dashboardRole={role} selectedLayer="marketplace_activity" />)
}

describe('mobile country dashboard acceptance coverage', () => {
  it('renders one mobile Country + Role selector card near the mini globe', () => {
    const html = dashboardHtml('buyer')
    expect(html).toContain('aria-label="Mobile country and role selector"')
    expect(html).toContain('Country + role')
    expect(html).toContain('mobile-country-switcher')
    expect(html).toContain('Mini globe heatmap')
  })

  it.each(requiredCountrySearchCases)('finds required country by name: %s', (query, expectedName) => {
    expect(searchCanonicalCountries(query).some((country) => country.name === expectedName)).toBe(true)
  })

  it.each(requiredIsoSearchCases)('finds %s / %s as %s', (iso2, iso3, expectedName) => {
    expect(searchCanonicalCountries(iso2).some((country) => country.name === expectedName)).toBe(true)
    expect(searchCanonicalCountries(iso3).some((country) => country.name === expectedName)).toBe(true)
  })

  it('keeps unsupported countries visible as request-access instead of hiding them', () => {
    const unsupported = searchCanonicalCountries('XX')
    expect(unsupported).toEqual([
      expect.objectContaining({
        name: 'Example Unsupported Country',
        iso2: 'XX',
        iso3: 'XXX',
        status: 'request-access',
      }),
    ])
  })

  it.each(['buyer', 'importer', 'seller_supplier', 'exporter'])('places Marketplace before Signals for %s', (role) => {
    const html = dashboardHtml(role)
    const marketplaceIndex = html.indexOf('Marketplace')
    const signalsIndex = html.indexOf('Signals')
    expect(marketplaceIndex).toBeGreaterThanOrEqual(0)
    expect(signalsIndex).toBeGreaterThan(marketplaceIndex)
    expect(html).not.toContain(`${role} operating view</p><h2>Signals`)
  })

  it.each(['doctor', 'pharmacist'])('places Education before Signals for %s', (role) => {
    const html = dashboardHtml(role)
    const educationIndex = html.indexOf('Education')
    const signalsIndex = html.indexOf('Signals')
    expect(educationIndex).toBeGreaterThanOrEqual(0)
    expect(signalsIndex).toBeGreaterThan(educationIndex)
  })

  it('uses exactly five flat mobile hamburger items', () => {
    expect(MOBILE_NAV_ITEMS).toEqual([
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Intelligence', href: '/intelligence' },
      { label: 'Education', href: '/education' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ])
  })

  it('does not leak forbidden public strings in mobile dashboard or menu text', () => {
    const html = `${dashboardHtml('buyer')} ${JSON.stringify(MOBILE_NAV_ITEMS)}`
    for (const forbidden of forbiddenPublicStrings) {
      expect(html).not.toContain(forbidden)
    }
  })
})
