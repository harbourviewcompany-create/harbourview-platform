import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * PostgREST on zvxdgdkukjrrwamdpqrg is configured as
 *
 *   pgrst.db_schemas = "public, graphql_public, job_search, api"
 *
 * so the DEFAULT schema is `public`, not `api`. supabase-js sends
 * Accept-Profile from its `db.schema` option, but a raw fetch() does not —
 * it resolves to `public` unless it sets the header itself.
 *
 * For relations whose public.* counterpart grants SELECT to service_role only,
 * that difference is the gap between "175 rows" and "no rows for any visitor".
 * It took the Market feed down without any error surfacing to the UI.
 *
 * Verified live 2026-09-06:
 *
 *   relation                          public.anon  public.authenticated  api.anon
 *   listings                          false        false                 true
 *   marketplace_public_listings_v1    false        false                 true
 *
 * Any browser-role (anon/publishable key) raw fetch against these MUST carry
 * 'Accept-Profile': 'api'. service_role callers are exempt — service_role does
 * hold SELECT on the public.* views, so they work through the default schema.
 */
const API_ONLY_FOR_BROWSER_ROLES = ['listings', 'marketplace_public_listings_v1']

const SEARCH_ROOTS = ['lib', 'app', 'components']
const repoRoot = process.cwd()

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

const files = SEARCH_ROOTS.flatMap(root => {
  const dir = path.join(repoRoot, root)
  return fs.existsSync(dir) ? walk(dir) : []
})

/** Files that reach one of the guarded relations over raw REST with a browser role. */
function offenders(): string[] {
  const bad: string[] = []
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8')
    if (!source.includes('/rest/v1/')) continue

    const usesBrowserRole = /NEXT_PUBLIC_SUPABASE_(ANON_KEY|PUBLISHABLE_KEY)/.test(source)
    if (!usesBrowserRole) continue

    // Only relations that actually differ between schemas matter. Match both the
    // literal path and the `${CONST}` form listingsQuery uses, by checking
    // whether the relation name appears anywhere in a file that does raw REST.
    const touchesGuarded = API_ONLY_FOR_BROWSER_ROLES.some(rel =>
      new RegExp(`rest/v1/${rel}\\b`).test(source) ||
      new RegExp(`['"\`]${rel}['"\`]`).test(source),
    )
    if (!touchesGuarded) continue

    if (!/['"]Accept-Profile['"]\s*:\s*['"]api['"]/.test(source)) {
      bad.push(path.relative(repoRoot, file))
    }
  }
  return bad.sort()
}

describe('raw PostgREST callers target the schema their grants actually live in', () => {
  it('every browser-role caller of an api-only relation sets Accept-Profile: api', () => {
    expect(offenders()).toEqual([])
  })

  it('records why the default schema is not api, so the fix is not undone', () => {
    const client = fs.readFileSync(path.join(repoRoot, 'lib/supabase/client.ts'), 'utf8')
    // The old comment claimed public was not exposed. If that claim ever comes
    // back, the raw-fetch modules lose their reason to send the header.
    expect(client).not.toMatch(/only exposes the `api` schema/)
    expect(client).toMatch(/pgrst\.db_schemas/)
    expect(client).toMatch(/db: \{ schema: 'api' \}/)
  })
})
