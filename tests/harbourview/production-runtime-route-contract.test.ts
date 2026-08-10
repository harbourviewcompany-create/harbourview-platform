import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const readRepoFile = (path: string) => readFileSync(join(repoRoot, path), 'utf8')

describe('production runtime route contract', () => {
  it('keeps /marketplace/wanted a 200-class public route', () => {
    const verifier = readRepoFile('scripts/production-runtime-verification.mjs')
    const proxy = readRepoFile('proxy.ts')
    const wantedPage = readRepoFile('app/marketplace/wanted/page.tsx')

    expect(verifier).toContain("{ path: '/marketplace/wanted', expected: 'ok' }")
    expect(wantedPage).toContain('export default async function WantedPage()')
    expect(proxy).not.toContain("'/marketplace/wanted',")
    expect(proxy).not.toContain("'/marketplace/wanted/:path*',")
  })

  it('reports redirect targets so public-route drift is actionable', () => {
    const verifier = readRepoFile('scripts/production-runtime-verification.mjs')

    expect(verifier).toContain("const location = response.headers.get('location') || ''")
    expect(verifier).toContain('| Route | Result | HTTP | Location | Title | Forbidden hits | Runtime markers |')
    expect(verifier).toContain('redirects are failures and their `Location` target is reported')
  })
})
