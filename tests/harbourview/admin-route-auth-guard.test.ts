/**
 * CI guard (audit P1-1): every admin page/route except login/logout must
 * either live under app/admin/(protected)/ or call an admin auth helper.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(process.cwd(), 'app', 'admin')
const EXEMPT_PATH_FRAGMENTS = ['app/admin/login/', 'app/admin/logout/', 'app/admin/layout.tsx']
const AUTH_MARKERS = ['requireAdminAuth', 'getAdminAuthCheck', 'getAdminAuth', 'requireAdminApiAuth']

function walk(dir: string, out: string[] = []): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return out
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (name === 'page.tsx' || name === 'route.ts' || name === 'layout.tsx') out.push(full)
  }
  return out
}

function isExempt(repoPath: string): boolean {
  return EXEMPT_PATH_FRAGMENTS.some((f) => repoPath.includes(f) || repoPath.endsWith(f.replace(/\/$/, '')))
}
function isUnderProtected(repoPath: string): boolean {
  return repoPath.includes('app/admin/(protected)/') || repoPath.includes('app/admin/(protected)\\')
}

describe('admin route auth guard inventory', () => {
  it('every admin page/route is protected or explicitly admin-authenticated', () => {
    const files = walk(ROOT)
    expect(files.length).toBeGreaterThan(5)
    const violations: string[] = []
    for (const file of files) {
      const repoPath = relative(process.cwd(), file).replace(/\\/g, '/')
      if (isExempt(repoPath) || isUnderProtected(repoPath) || repoPath.endsWith('layout.tsx')) continue
      const src = readFileSync(file, 'utf8')
      if (!AUTH_MARKERS.some((m) => src.includes(m))) violations.push(repoPath)
    }
    expect(violations, `Admin surfaces missing admin auth:\n${violations.join('\n')}`).toEqual([])
  })

  it('(protected)/layout.tsx enforces requireAdminAuth', () => {
    const layout = join(ROOT, '(protected)', 'layout.tsx')
    expect(readFileSync(layout, 'utf8')).toContain('requireAdminAuth')
  })
})
