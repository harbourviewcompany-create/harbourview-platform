/** CI guard: every route under app/api/**/admin/** must call an admin auth helper. */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const API_ROOT = join(process.cwd(), 'app', 'api')
const AUTH_MARKERS = ['requireAdminAuth', 'getAdminAuthCheck', 'getAdminAuth', 'requireAdminApiAuth']
function walkAdminRoutes(dir: string, out: string[] = []): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return out
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walkAdminRoutes(full, out)
    else if (name === 'route.ts') {
      const repoPath = relative(process.cwd(), full).replace(/\\/g, '/')
      if (repoPath.includes('/admin/')) out.push(full)
    }
  }
  return out
}
describe('admin API route auth guard', () => {
  it('every app/api/**/admin/**/route.ts calls an admin auth helper', () => {
    const violations: string[] = []
    for (const file of walkAdminRoutes(API_ROOT)) {
      const repoPath = relative(process.cwd(), file).replace(/\\/g, '/')
      if (!AUTH_MARKERS.some((m) => readFileSync(file, 'utf8').includes(m))) violations.push(repoPath)
    }
    expect(violations, `Admin API routes missing admin auth helper:\n${violations.join('\n')}`).toEqual([])
  })
})
