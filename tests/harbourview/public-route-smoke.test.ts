import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()

function readRepoFile(path: string) {
  return readFileSync(join(repoRoot, path), 'utf8')
}

describe('public route smoke coverage', () => {
  const requiredPublicPages = [
    'app/page.tsx',
    'app/marketplace/page.tsx',
    'app/marketplace/listings/page.tsx',
    'app/marketplace/used-surplus/page.tsx',
    'app/marketplace/business-opportunities/page.tsx',
    'app/marketplace/consumables/page.tsx',
    'app/marketplace/new-products/page.tsx',
    'app/marketplace/cannabis-inventory/page.tsx',
    'app/marketplace/services/page.tsx',
    'app/marketplace/wanted/page.tsx',
    'app/marketplace/genetics/page.tsx',
    'app/marketplace/cultivation-equipment/page.tsx',
    'app/marketplace/distressed-inventory/page.tsx',
    'app/marketplace/distressed-businesses/page.tsx',
    'app/marketplace/qualified-access/page.tsx',
    'app/marketplace/sell/page.tsx',
    'app/intake/page.tsx',
    'app/intelligence/page.tsx',
    'app/signals/page.tsx',
  ]

  it('keeps required public pages mounted', () => {
    for (const pagePath of requiredPublicPages) {
      expect(existsSync(join(repoRoot, pagePath)), `${pagePath} must exist`).toBe(true)
      const source = readRepoFile(pagePath)
      expect(source).toContain('export default')
    }
  })


  it('keeps live listing detail page wired to public slug query only', () => {
    const source = readRepoFile('app/marketplace/listings/[slug]/page.tsx')

    expect(source).toContain('getPublicListingBySlug')
    expect(source).not.toContain("@/lib/marketplace/publicListings")
  })

  it('keeps live category listing cards on the public listing href helper', () => {
    const liveCategoryPages = [
      'app/marketplace/new-products/page.tsx',
      'app/marketplace/used-surplus/page.tsx',
      'app/marketplace/cannabis-inventory/page.tsx',
      'app/marketplace/services/page.tsx',
      'app/marketplace/consumables/page.tsx',
      'app/marketplace/cultivation-equipment/page.tsx',
      'app/marketplace/distressed-inventory/page.tsx',
      'app/marketplace/distressed-businesses/page.tsx',
      'app/marketplace/business-opportunities/page.tsx',
    ]

    for (const pagePath of liveCategoryPages) {
      const source = readRepoFile(pagePath)
      expect(source, `${pagePath} must import getPublicListingHref`).toContain('getPublicListingHref')
      expect(source, `${pagePath} must not route cards through /contact`).not.toContain('/contact?ref=')
    }
  })

  it('keeps public route files free of private review and provenance field names', () => {
    const publicRouteFiles = [
      ...requiredPublicPages,
      'app/marketplace/listings/[slug]/page.tsx',
      'components/marketplace/InquiryForm.tsx',
    ]
    const forbiddenStrings = [
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

    for (const pagePath of publicRouteFiles) {
      const source = readRepoFile(pagePath)
      for (const forbidden of forbiddenStrings) {
        expect(source, `${pagePath} must not contain ${forbidden}`).not.toContain(forbidden)
      }
    }
  })

  it('keeps marketplace sell fallback redirect wired in middleware', () => {
    const middlewareSource = readRepoFile('middleware.ts')

    expect(middlewareSource).toContain("'/marketplace/submit-listing': '/marketplace/sell'")

    const hasDedicatedFallbackRoute = existsSync(join(repoRoot, 'app/marketplace/submit-listing/page.tsx'))
    if (hasDedicatedFallbackRoute) {
      const fallbackPage = readRepoFile('app/marketplace/submit-listing/page.tsx')
      expect(fallbackPage).toContain('export default')
    }
  })
})

describe('admin route anonymous access policy', () => {
  it('enforces admin auth in protected admin layout', () => {
    const protectedAdminLayout = readRepoFile('app/admin/(protected)/layout.tsx')
    const adminGuard = readRepoFile('lib/auth/adminGuard.ts')

    expect(protectedAdminLayout).toContain('await requireAdminAuth()')
    expect(adminGuard).toContain('unauthorized()')
    expect(adminGuard).toContain('forbidden()')
  })
})
