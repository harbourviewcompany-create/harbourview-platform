/** CI guard: every admin page/route except login/logout must be protected or explicitly admin-authenticated. */
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
    const full = join(dir, name), st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (['page.tsx', 'route.ts', 'layout.tsx'].includes(name)) out.push(full)
  }
  return out
}
function isExempt(p: string) { return EXEMPT_PATH_FRAGMENTS.some((f) => p.includes(f) || p.endsWith(f.replace(/\/$/, ''))) }
function isProtected(p: string) { return p.includes('app/admin/(protected)/') || p.includes('app/admin/(protected)\\') }
describe('admin route auth guard inventory', () => {
  it('every admin page/route is protected or explicitly admin-authenticated', () => {
    const files = walk(ROOT); expect(files.length).toBeGreaterThan(5)
    const violations: string[] = []
    for (const file of files) {
      const p = relative(process.cwd(), file).replace(/\\/g, '/')
      if (isExempt(p) || isProtected(p) || p.endsWith('layout.tsx')) continue
      if (!AUTH_MARKERS.some((m) => readFileSync(file, 'utf8').includes(m))) violations.push(p)
    }
    expect(violations, `Admin surfaces missing admin auth:\n${violations.join('\n')}`).toEqual([])
  })
  it('(protected)/layout.tsx enforces requireAdminAuth', () => {
    expect(readFileSync(join(ROOT, '(protected)', 'layout.tsx'), 'utf8')).toContain('requireAdminAuth')
  })
})
