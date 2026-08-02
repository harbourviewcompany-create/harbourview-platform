import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()

function readRepoFile(path: string) {
  return readFileSync(join(repoRoot, path), 'utf8')
}

const marketplaceRoutePages = [
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
  'app/intake/page.tsx',
]

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

const forbiddenPublicLeakageStrings = [
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

describe('public route smoke coverage', () => {
  const requiredPublicPages = [
    'app/page.tsx',
    'app/dashboard/page.tsx',
    'app/dashboard/country/[country]/page.tsx',
    'app/dashboard/country/[country]/intelligence/page.tsx',
    'app/marketplace/page.tsx',
    'app/marketplace/sell/page.tsx',
    ...marketplaceRoutePages,
    'app/intelligence/page.tsx',
    'app/intelligence/playbooks/page.tsx',
    'app/signals/page.tsx',
    'app/markets/page.tsx',
    'app/professionals/page.tsx',
    'app/professionals/[slug]/page.tsx',
    'app/marketplace/deals/page.tsx',
    'app/marketplace/deals/[id]/page.tsx',
    'app/marketplace/deals/new/page.tsx',
  ]

  it('keeps required public pages mounted', () => {
    for (const pagePath of requiredPublicPages) {
      expect(existsSync(join(repoRoot, pagePath)), `${pagePath} must exist`).toBe(true)
      const source = readRepoFile(pagePath)
      expect(source).toContain('export default')
    }
  })

  it('keeps the working-alpha operator dashboard exposed in navigation', () => {
    const navSource = readRepoFile('components/Nav.tsx')

    expect(navSource).toContain('Operator Dashboard')
    expect(navSource).toContain("href: '/dashboard'")
  })

  it('keeps the full marketplace route universe mounted', () => {
    for (const pagePath of marketplaceRoutePages) {
      expect(existsSync(join(repoRoot, pagePath)), `${pagePath} must exist`).toBe(true)
    }
  })

  it('keeps marketplace sell fallback redirect wired in middleware', () => {
    const middlewareEntry = existsSync(join(repoRoot, 'middleware.ts')) ? 'middleware.ts' : 'proxy.ts'
    const middlewareSource = readRepoFile(middlewareEntry)

    expect(middlewareSource).toContain("'/marketplace/submit-listing': '/marketplace/sell'")

    const hasDedicatedFallbackRoute = existsSync(join(repoRoot, 'app/marketplace/submit-listing/page.tsx'))
    if (hasDedicatedFallbackRoute) {
      const fallbackPage = readRepoFile('app/marketplace/submit-listing/page.tsx')
      expect(fallbackPage).toContain('export default')
    }
  })

  it('serves the individual marketplace listing page publicly (no redirect)', () => {
    const detailPage = readRepoFile('app/marketplace/listings/[slug]/page.tsx')

    expect(detailPage).not.toContain("redirect('/dashboard?page=marketplace')")
    expect(detailPage).toContain('export default')
  })

  it('serves category listing pages publicly (no redirect)', () => {
    for (const pagePath of liveCategoryPages) {
      const source = readRepoFile(pagePath)
      expect(source, `${pagePath} must not redirect to Command Centre`).not.toContain(
        "redirect('/dashboard?page=marketplace')",
      )
      expect(source, `${pagePath} must export a page component`).toContain('export default')
    }
  })

  it('keeps public route files free of private review and source field names', () => {
    const publicRouteFiles = [
      ...marketplaceRoutePages,
      'app/marketplace/listings/[slug]/page.tsx',
      'app/marketplace/sell/page.tsx',
    ]

    for (const pagePath of publicRouteFiles) {
      const source = readRepoFile(pagePath)
      for (const forbidden of forbiddenPublicLeakageStrings) {
        expect(source, `${pagePath} must not expose ${forbidden}`).not.toContain(forbidden)
      }
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
