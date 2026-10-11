import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function readRepoFile(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

describe('Cannabis Export OS private boundary', () => {
  it('guards the page with Harbourview admin/operator auth', () => {
    const page = readRepoFile('app/intelligence/cannabis-export/page.tsx')
    expect(page).toContain("import { requireAdminAuth } from '@/lib/admin-auth'")
    expect(page).toContain('await requireAdminAuth()')
  })

  it('guards both API reads and writes before touching private data', () => {
    const route = readRepoFile('app/api/intelligence/cannabis-export/route.ts')
    expect(route).toContain('getAdminAuthCheck(request)')
    expect(route).toContain('export async function GET')
    expect(route).toContain('export async function PATCH')
    expect(route).toContain("Admin or operator access required.")
  })

  it('does not seed researched counterparties or commercial assumptions in the public repository', () => {
    const migration = readRepoFile('supabase/migrations/20261011152500_cannabis_export_workspace.sql')
    expect(migration).not.toMatch(/insert\s+into\s+public\.cannabis_export_/i)
    expect(migration).not.toContain('linkedin.com/in/')
    expect(migration).not.toContain('@')
  })

  it('enables RLS and denies browser roles on every private export table', () => {
    const migration = readRepoFile('supabase/migrations/20261011152500_cannabis_export_workspace.sql')
    const tables = [
      'cannabis_export_accounts',
      'cannabis_export_markets',
      'cannabis_export_playbooks',
      'cannabis_export_contacts',
      'cannabis_export_products',
      'cannabis_export_matches',
      'cannabis_export_rfqs',
      'cannabis_export_deals',
      'cannabis_export_benchmarks',
      'cannabis_export_tasks',
    ]

    for (const table of tables) {
      expect(migration).toContain(`alter table public.${table} enable row level security;`)
      expect(migration).toContain(`revoke all on table public.${table} from public, anon, authenticated;`)
      expect(migration).toContain(`grant select, insert, update, delete on table public.${table} to service_role;`)
    }
  })

  it('keeps marketplace supplier approval policy separate from export research', () => {
    const migration = readRepoFile('supabase/migrations/20261011152500_cannabis_export_workspace.sql')
    expect(migration).not.toMatch(/insert\s+into\s+public\.supplier_profiles/i)
    expect(migration).not.toMatch(/update\s+public\.supplier_profiles/i)
  })
})
