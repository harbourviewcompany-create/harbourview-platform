import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('full-depth dimension contract RLS', () => {
  const migration = fs.readFileSync(
    path.join(process.cwd(),'supabase/migrations/20260925060000_harden_full_depth_dimension_contract_rls.sql'),
    'utf8',
  )
  it('enables RLS and keeps the contract read-only to clients', () => {
    expect(migration).toContain('enable row level security')
    expect(migration).toContain('for select')
    expect(migration).toContain('to anon, authenticated')
    expect(migration).toContain('revoke insert, update, delete, truncate')
  })
})
