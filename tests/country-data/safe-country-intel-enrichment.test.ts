import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

describe('safe country enrichment policy', () => {
  const source = readFileSync('scripts/safe-country-intel-enrichment.mjs', 'utf8')

  it('validates the complete ISO-3166-1 baseline', () => {
    expect(source).toContain('pairs.length !== 249')
    expect(source).toContain('new Set(pairs.map((row) => row.code)).size !== 249')
    expect(source).toContain('new Set(pairs.map((row) => row.alpha3)).size !== 249')
  })

  it('limits live writes to identity fields', () => {
    expect(source).toContain("country_code,country_name,commercial_pathway_summary,public_summary,review_status")
    expect(source).toContain("country_code: code")
    expect(source).toContain("country_name:")
    expect(source).toContain("review_status:")
    expect(source).not.toContain('regulatory_tier:')
    expect(source).not.toContain('opportunityScore:')
    expect(source).not.toContain("from('jurisdiction_playbooks')")
  })

  it('queues unresolved rows instead of manufacturing summaries or tiers', () => {
    expect(source).toContain('research_before_publication')
    expect(source).toContain('No regulatory classification or summary is synthesized by this tool.')
    expect(source).toContain('DRY_RUN')
  })
})
