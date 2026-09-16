// CI guard: every route under app/api/**/admin/** must have an approved server-side auth boundary.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const API_ROOT = join(process.cwd(), 'app', 'api')

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

function hasApprovedAdminGuard(source: string): boolean {
  if (source.includes('requireAdminApiAuth') || source.includes('requireAdminAuth')) return true
  if (source.includes('getAuthenticatedUser') && source.includes('isPlatformStaff')) return true
  if (source.includes('.auth.getUser()') && source.includes("profile?.role !== 'admin'")) return true
  if (
    source.includes('process.env.CRON_SECRET')
    && source.includes('authorization')
    && source.includes('Bearer ${cronSecret}')
  ) return true
  if (source.includes('requireClinicalUser')) return true
  return false
}

describe('admin API route auth guard', () => {
  it('every app/api/**/admin/**/route.ts has an approved server-side auth boundary', () => {
    const violations: string[] = []
    for (const file of walkAdminRoutes(API_ROOT)) {
      const repoPath = relative(process.cwd(), file).replace(/\\/g, '/')
      if (!hasApprovedAdminGuard(readFileSync(file, 'utf8'))) violations.push(repoPath)
    }
    expect(violations, `Admin API routes missing approved server auth boundary:\n${violations.join('\n')}`).toEqual([])
  })
})
