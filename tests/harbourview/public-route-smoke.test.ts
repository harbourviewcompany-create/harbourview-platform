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
    'app/marketplace/sell/page.tsx',
    'app/marketplace/wanted/page.tsx',
    'app/intelligence/page.tsx',
    'app/signals/page.tsx',
    'app/intake/page.tsx',
  ]

  it('keeps required public pages mounted', () => {
    for (const pagePath of requiredPublicPages) {
      expect(existsSync(join(repoRoot, pagePath)), `${pagePath} must exist`).toBe(true)
      const source = readRepoFile(pagePath)
      expect(source).toContain('export default')
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
