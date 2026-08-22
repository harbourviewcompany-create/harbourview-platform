import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { counterpartyIntelligencePathways } from '@/lib/intelligence-automation/counterparty-pathways'

const pageSource = readFileSync(
  'app/admin/(protected)/intelligence-automation/counterparty-intelligence/page.tsx',
  'utf8',
)
const hubSource = readFileSync('app/admin/(protected)/intelligence-automation/page.tsx', 'utf8')
const navSource = readFileSync('lib/admin/navConfig.ts', 'utf8')

function sourceIds(pathway: (typeof counterpartyIntelligencePathways)[number]) {
  return new Set(pathway.sources.map(source => source.id))
}

describe('Counterparty intelligence pathways', () => {
  it('ships the three Aug 21 material pathways with unique canonical identities', () => {
    expect(counterpartyIntelligencePathways).toHaveLength(3)
    expect(new Set(counterpartyIntelligencePathways.map(pathway => pathway.id)).size).toBe(3)
    expect(new Set(counterpartyIntelligencePathways.map(pathway => pathway.slug)).size).toBe(3)

    expect(counterpartyIntelligencePathways.map(pathway => pathway.slug)).toEqual([
      'germany-q1-import-revision',
      'tilray-275t-capacity-expansion',
      'aurora-internode-hap-acquisition',
    ])

    for (const pathway of counterpartyIntelligencePathways) {
      expect(pathway.eventClass).toBe('material_advancement')
      expect(pathway.asOf).toBe('2026-08-21')
      expect(pathway.verifiedFacts.length).toBeGreaterThan(0)
      expect(pathway.counterparties.length).toBeGreaterThan(0)
      expect(pathway.commercialOpenings.length).toBeGreaterThan(0)
      expect(pathway.nextTriggers.length).toBeGreaterThan(0)
      expect(pathway.sources.length).toBeGreaterThan(0)
    }
  })

  it('requires every verified claim and mapped counterparty to resolve to pathway-local evidence', () => {
    for (const pathway of counterpartyIntelligencePathways) {
      const availableSources = sourceIds(pathway)

      for (const claim of pathway.verifiedFacts) {
        expect(claim.state).toBe('verified')
        expect(claim.sourceIds.length).toBeGreaterThan(0)
        for (const sourceId of claim.sourceIds) expect(availableSources.has(sourceId)).toBe(true)
      }

      for (const counterparty of pathway.counterparties) {
        expect(counterparty.sourceIds.length).toBeGreaterThan(0)
        for (const sourceId of counterparty.sourceIds) expect(availableSources.has(sourceId)).toBe(true)
      }

      for (const change of pathway.ownershipChanges) {
        expect(change.sourceIds.length).toBeGreaterThan(0)
        for (const sourceId of change.sourceIds) expect(availableSources.has(sourceId)).toBe(true)
      }

      for (const regulator of pathway.regulators) {
        expect(regulator.sourceIds.length).toBeGreaterThan(0)
        for (const sourceId of regulator.sourceIds) expect(availableSources.has(sourceId)).toBe(true)
      }

      for (const trigger of pathway.nextTriggers) {
        expect(trigger.sourceIds.length).toBeGreaterThan(0)
        for (const sourceId of trigger.sourceIds) expect(availableSources.has(sourceId)).toBe(true)
      }
    }
  })

  it('keeps commercial winners and losers explicitly inferential', () => {
    for (const pathway of counterpartyIntelligencePathways) {
      for (const item of [...pathway.likelyWinners, ...pathway.likelyLosers]) {
        expect(item.state).toBe('inference')
      }
    }
  })

  it('keeps unresolved evidence gaps fail-closed rather than converting them to verified facts', () => {
    for (const pathway of counterpartyIntelligencePathways) {
      const availableSources = sourceIds(pathway)
      for (const note of pathway.dataQualityNotes) {
        expect(note.state).toBe('unresolved')
        expect(note.decisionRule.trim().length).toBeGreaterThan(20)
        for (const sourceId of note.sourceIds) expect(availableSources.has(sourceId)).toBe(true)
      }
    }
  })

  it('preserves the Germany revised-total reconciliation gate', () => {
    const germany = counterpartyIntelligencePathways.find(
      pathway => pathway.slug === 'germany-q1-import-revision',
    )
    expect(germany).toBeDefined()

    const corpus = JSON.stringify(germany)
    expect(corpus).toContain('67.569')
    expect(corpus).toContain('50.539')
    expect(corpus).toContain('17.030')
    expect(corpus).toContain('Do not recalculate supplier-country market shares')
    expect(germany?.counterparties.some(cp => cp.name === 'Cansativa Group' && cp.accessPosture === 'open_gateway')).toBe(true)
    expect(germany?.counterparties.some(cp => cp.name === 'Cantourage Group SE' && cp.accessPosture === 'open_gateway')).toBe(true)
    expect(germany?.counterparties.some(cp => cp.name === 'Four 20 Pharma GmbH' && cp.accessPosture === 'vertically_controlled')).toBe(true)
  })

  it('preserves Tilray capacity, Quebec certification and vertical-integration boundaries', () => {
    const tilray = counterpartyIntelligencePathways.find(
      pathway => pathway.slug === 'tilray-275t-capacity-expansion',
    )
    expect(tilray).toBeDefined()

    const corpus = JSON.stringify(tilray)
    expect(corpus).toContain('275')
    expect(corpus).toContain('210')
    expect(corpus).toContain('30 tonnes')
    expect(corpus).toContain('not yet established')
    expect(corpus).toContain('Lyphe Group')
    expect(corpus).toContain('CC Pharma')
  })

  it('preserves Aurora UK licence, ownership and pharmacy-resolution boundaries', () => {
    const aurora = counterpartyIntelligencePathways.find(
      pathway => pathway.slug === 'aurora-internode-hap-acquisition',
    )
    expect(aurora).toBeDefined()

    const corpus = JSON.stringify(aurora)
    expect(corpus).toContain('Internode Pharma Limited')
    expect(corpus).toContain('HAP Pharma Limited')
    expect(corpus).toContain('WDA(H) 58825')
    expect(corpus).toContain('£2.1 million')
    expect(corpus).toContain('GPhC')
    expect(corpus).toContain('unresolved')
    expect(corpus).toContain('Curaleaf')
  })

  it('keeps the feature inside protected admin routing and discoverable from Harbourview intelligence navigation', () => {
    expect(pageSource).toContain("import { requireAdminAuth } from '@/lib/auth/adminGuard'")
    expect(pageSource).toContain('await requireAdminAuth()')
    expect(pageSource).toContain('verified facts')
    expect(pageSource).toContain('Evidence boundary:')

    const route = '/admin/intelligence-automation/counterparty-intelligence'
    expect(hubSource).toContain(route)
    expect(navSource).toContain(route)
  })
})
