import React from 'react'
;(globalThis as { React?: typeof React }).React = React

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import CultivarPassportPage from '@/app/genetics/cultivars/[slug]/page'
import { getAdminGeneticsReviewQueue, getInternalCultivarPassports, getPublicCultivarPassportBySlug, getPublicCultivarPassports } from '@/lib/genetics/demoData'
import { containsRestrictedClaim, sanitizeRestrictedClaimText } from '@/lib/genetics/restrictedClaims'

const forbiddenPublicPayloadTerms = [
  'private_notes',
  'private_note',
  'review_notes_private',
  'file_path',
  'private_metadata',
  'private/demo',
  'buyer notes',
  'counterparty diligence',
  'licensing terms',
]

const unsafeCtaTerms = ['Buy seeds', 'Order clones', 'Ship genetics', 'Purchase plant material', 'Export now', 'Import now']

function expectNoForbiddenPublicTerms(payload: unknown) {
  const body = JSON.stringify(payload)
  for (const term of forbiddenPublicPayloadTerms) {
    expect(body, `public payload must not include ${term}`).not.toContain(term)
  }
}

describe('Cultivar Passport Network P0 DTO boundaries', () => {
  it('does not expose private evidence fields through public cultivar DTOs', () => {
    const passport = getPublicCultivarPassportBySlug('demo-cultivar-alpha')
    expect(passport).toBeTruthy()
    expectNoForbiddenPublicTerms(passport)
    expect(JSON.stringify(passport)).not.toContain('Private demo note')
    expect(JSON.stringify(passport)).not.toContain('genotype-placeholder')
  })

  it('renders the public passport page with only public DTO fields', async () => {
    const element = await CultivarPassportPage({ params: Promise.resolve({ slug: 'demo-cultivar-alpha' }) })
    const html = renderToStaticMarkup(element)
    expect(html).toContain('Demo Cultivar Alpha')
    expect(html).toContain('View public passport')
    expect(html).toContain('Request access')
    for (const term of forbiddenPublicPayloadTerms) {
      expect(html, `public page must not include ${term}`).not.toContain(term)
    }
  })

  it('downgrades restricted claims without reviewed public evidence', () => {
    expect(containsRestrictedClaim('verified genetics and export-ready status')).toBe(true)
    const sanitized = sanitizeRestrictedClaimText('verified genetics, pathogen-free, GMP-ready, high-yield, licensed line')
    expect(sanitized).toContain('claimed genetics')
    expect(sanitized).toContain('pathogen status not publicly assessed')
    expect(sanitized).toContain('GMP status not assessed')
    expect(sanitized).not.toContain('verified genetics')
    expect(sanitized).not.toContain('pathogen-free')
    expect(sanitized).not.toContain('GMP-ready')
  })

  it('keeps access request states and public CTAs away from checkout or shipping language', () => {
    const passports = getPublicCultivarPassports()
    const publicBody = JSON.stringify(passports)
    for (const cta of ['Request access', 'Request verification', 'Request licensing discussion', 'Request trial discussion', 'Start collaboration', 'Contact rights holder', 'View public passport']) {
      expect(publicBody).toContain(cta)
    }
    for (const unsafe of unsafeCtaTerms) {
      expect(publicBody).not.toContain(unsafe)
    }
  })

  it('uses demo-safe labels and conservative statuses for seeded placeholders', () => {
    const passports = getPublicCultivarPassports()
    expect(passports.every((passport) => passport.displayName.startsWith('Demo '))).toBe(true)
    expect(passports.map((passport) => passport.claimStatus)).toEqual(expect.arrayContaining(['not_assessed', 'claimed']))
    const body = JSON.stringify(passports)
    expect(body).toContain('Not Assessed')
    expect(body).not.toContain('externally_verified')
    expect(body).not.toContain('admin_reviewed')
  })

  it('includes admin review metadata in admin DTO but not public DTO', () => {
    const admin = getAdminGeneticsReviewQueue()
    const internal = getInternalCultivarPassports()
    const publicPassport = getPublicCultivarPassportBySlug('demo-cultivar-alpha')

    expect(JSON.stringify(admin)).toContain('private_note')
    expect(JSON.stringify(admin)).toContain('private_metadata')
    expect(JSON.stringify(internal)).toContain('file_path')
    expectNoForbiddenPublicTerms(publicPassport)
  })
})
