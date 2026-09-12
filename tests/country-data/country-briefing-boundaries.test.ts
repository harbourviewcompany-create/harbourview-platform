import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

describe('country briefing evidence boundary', () => {
  const source = readFileSync('lib/country-data/server.ts', 'utf8')

  it('does not read or publish country_intel.regulatory_tier', () => {
    expect(source).not.toContain('regulatory_tier')
    expect(source).toContain('status: null')
  })

  it('does not assign a synthetic opportunity score', () => {
    expect(source).toContain('opportunityScore: null')
    expect(source).not.toContain('opportunityScore: 50')
  })

  it('does not use the geography registry as regulatory evidence', () => {
    expect(source).toContain('Market-access briefing requires verified primary-source evidence')
    expect(source).not.toContain('geo?.localIntelSummary')
  })
})
