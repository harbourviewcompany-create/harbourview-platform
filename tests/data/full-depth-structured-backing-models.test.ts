import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('full-depth structured backing models', () => {
  const migration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260922240000_full_depth_structured_backing_models.sql'),
    'utf8',
  )

  test('provides structured regulatory rule coverage', () => {
    expect(migration).toContain("rule_dimension text not null check (rule_dimension in ('access_rules','commercial_activity','import','export','distribution','testing','packaging_labeling','tax_fees'))")
    expect(migration).toContain('source_url text not null')
    expect(migration).toContain('verification_status')
    expect(migration).toContain('effective_from')
    expect(migration).toContain('effective_to')
  })

  test('provides regulator, change, participant, relationship and opportunity models', () => {
    for (const table of [
      'jurisdiction_regulators',
      'jurisdiction_regulatory_changes',
      'jurisdiction_market_participants',
      'jurisdiction_relationships',
      'jurisdiction_opportunities',
    ]) {
      expect(migration).toContain(`create table if not exists public.${table}`)
    }
  })

  test('research queue remains fail-closed', () => {
    expect(migration).toContain("when s.applicability='unknown' then 'open'")
    expect(migration).toContain("when s.status in ('missing','unmeasured','stale','blocked','conflict') then 'open'")
    expect(migration).toContain('Structured evidence required; no completion inferred.')
  })

  test('does not seed fabricated market or regulatory facts', () => {
    expect(migration).not.toMatch(/insert\s+into\s+public\.(jurisdiction_regulatory_rules|jurisdiction_regulators|jurisdiction_market_participants|jurisdiction_relationships|jurisdiction_opportunities)\s*\(/i)
  })
})
