import React from 'react'
;(globalThis as { React?: typeof React }).React = React

import { describe, expect, it, vi } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'

// app/genetics/cultivars/[slug]/page.tsx now reads from lib/genetics/queries.ts
// (live Supabase). Mock it here so this render test exercises the real page
// component against the same fixture rows demoData.ts already provides,
// without requiring a live DB connection in the unit test environment.
vi.mock('@/lib/genetics/queries', async () => {
  const demoData = await vi.importActual<typeof import('@/lib/genetics/demoData')>('@/lib/genetics/demoData')
  return {
    getPublicCultivarPassportBySlug: async (slug: string) => demoData.getPublicCultivarPassportBySlug(slug),
    getPublicCultivarPassports: async () => demoData.getPublicCultivarPassports(),
    getPublicServiceProviders: async () => demoData.getPublicServiceProviders(),
    getPublicCollaborationProjects: async () => demoData.getPublicCollaborationProjects(),
    getInternalCultivarPassports: async () => demoData.getInternalCultivarPassports(),
    getAdminGeneticsReviewQueue: async () => demoData.getAdminGeneticsReviewQueue(),
  }
})

let capturedRedirectUrl: string | undefined
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    capturedRedirectUrl = url
    throw new Error('NEXT_REDIRECT_TEST_STUB')
  },
}))

import CultivarPassportPage from '@/app/genetics/cultivars/[slug]/page'
import { demoAccessGrants, demoAccessRequests, demoEvidenceItems, demoGeneticsProfiles, getAdminGeneticsReviewQueue, getInternalCultivarPassports, getPublicCultivarPassportBySlug, getPublicCultivarPassports } from '@/lib/genetics/demoData'
import { approvedRequestDoesNotGrantEvidence, grantAllowsEvidence } from '@/lib/genetics/accessGrants'
import { containsRestrictedClaim, sanitizeRestrictedClaimText } from '@/lib/genetics/restrictedClaims'

const forbiddenPublicPayloadTerms = [
  'private_notes',
  'private_note',
  'review_notes_private',
  'file_path',
  'private_metadata',
  'private/demo',
  'bucket',
  'object key',
  'signedUrl',
  'signedURL',
  'filename',
  'fileName',
  'buyer notes',
  'counterparty diligence',
  'licensing terms',
  'private provenance',
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

  it('redirects the public passport route to the marketplace genetics catalog with the cultivar slug preserved', async () => {
    // Public /genetics routes now redirect into the marketplace genetics
    // catalog rather than the Command Centre panel (see commit b824dfe31c,
    // "feat(phase2): public /genetics -> marketplace catalog + proxy
    // exception", which updated all five app/genetics/** routes together).
    // This superseded the earlier CC-panel redirect from 73f8a851 -- this
    // test's expectation was stale against that change until fixed here.
    capturedRedirectUrl = undefined
    try {
      await CultivarPassportPage({ params: Promise.resolve({ slug: 'demo-cultivar-alpha' }) })
    } catch {
      // redirect() throws by design; we only care about the captured target
    }
    expect(capturedRedirectUrl).toBe('/marketplace/genetics/demo-cultivar-alpha')
  })

  it('does not treat approved access requests as evidence access without explicit grants', () => {
    const approvedRequest = { ...demoAccessRequests[0], status: 'approved_full' as const }
    expect(approvedRequestDoesNotGrantEvidence(approvedRequest)).toBe(true)

    const privateEvidence = demoEvidenceItems[1]
    const granteeProfileId = demoGeneticsProfiles[2].id
    expect(demoAccessGrants.some((grant) => grantAllowsEvidence(grant, privateEvidence, granteeProfileId, new Date('2026-06-08T00:00:00.000Z')))).toBe(false)

    const explicitlyGrantedEvidence = demoEvidenceItems[0]
    expect(demoAccessGrants.some((grant) => grantAllowsEvidence(grant, explicitlyGrantedEvidence, granteeProfileId, new Date('2026-06-08T00:00:00.000Z')))).toBe(true)
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



  it('uses explicit SQL grants and private storage policy instead of broad approved-request evidence access', () => {
    const migration = readFileSync(join(process.cwd(), 'supabase/migrations/20260621220513_cultivar_passport_network_p0_synfix.sql'), 'utf8')
    expect(migration).toContain('create table genetics_access_grants')
    expect(migration).toContain('create table genetics_claims')
    expect(migration).toContain('genetics_evidence_items_grant_read')
    expect(migration).not.toContain('genetics_evidence_items_approved_request_read')
    expect(migration).toContain('genetics-evidence-private')
    expect(migration).toContain('Genetics grantees can read explicitly granted private evidence')
    expect(migration).toContain('genetics_public_claims')
  })

  it('requires server-side admin authorization on genetics admin review and keeps service-role clients out of public routes', () => {
    const repoRoot = process.cwd()
    const adminPage = readFileSync(join(repoRoot, 'app/admin/(protected)/genetics/review/page.tsx'), 'utf8')
    expect(adminPage).toContain('requireAdminAuth')
    expect(adminPage).toContain('await requireAdminAuth()')

    const publicRouteFiles = [
      'app/genetics/page.tsx',
      'app/genetics/cultivars/page.tsx',
      'app/genetics/cultivars/[slug]/page.tsx',
      'app/genetics/collaboration/page.tsx',
      'app/genetics/services/page.tsx',
    ]
    for (const file of publicRouteFiles) {
      expect(existsSync(join(repoRoot, file)), `${file} must exist`).toBe(true)
      const source = readFileSync(join(repoRoot, file), 'utf8')
      expect(source).not.toContain('service-role')
      expect(source).not.toContain('createHarbourviewServiceRoleSupabaseClient')
      expect(source).not.toContain('getAdminDataClient')
    }
  })
})