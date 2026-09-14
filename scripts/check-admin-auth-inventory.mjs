#!/usr/bin/env node
/**
 * Local/CI inventory: list admin pages and whether they satisfy the auth guard.
 * Usage: node scripts/check-admin-auth-inventory.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(process.cwd(), 'app', 'admin')
const EXEMPT = ['app/admin/login/', 'app/admin/logout/', 'app/admin/layout.tsx']
const MARKERS = ['requireAdminAuth', 'getAdminAuthCheck', 'getAdminAuth', 'requireAdminApiAuth']

function walk(dir, out = []) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return out
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (['page.tsx', 'route.ts', 'layout.tsx'].includes(name)) out.push(full)
  }
  return out
}

const rows = []
let failures = 0

for (const file of walk(ROOT)) {
  const repoPath = relative(process.cwd(), file).replace(/\\/g, '/')
  const exempt = EXEMPT.some((f) => repoPath.includes(f) || repoPath.endsWith('app/admin/layout.tsx'))
  const underProtected = repoPath.includes('app/admin/(protected)/')
  const src = readFileSync(file, 'utf8')
  const hasMarker = MARKERS.some((m) => src.includes(m))
  const ok = exempt || underProtected || hasMarker || repoPath.endsWith('layout.tsx')
  if (!ok && (repoPath.endsWith('page.tsx') || repoPath.endsWith('route.ts'))) failures++
  rows.push({ path: repoPath, exempt, underProtected, hasMarker, ok })
}

console.log('Admin auth inventory')
console.log('path\texempt\tprotected\tmarker\tok')
for (const r of rows) console.log(`${r.path}\t${r.exempt}\t${r.underProtected}\t${r.hasMarker}\t${r.ok}`)

if (failures > 0) {
  console.error(`\n${failures} violation(s)`)
  process.exit(1)
}
console.log(`\nOK (${rows.length} files scanned)`)
