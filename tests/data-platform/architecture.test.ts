import { describe, expect, it } from 'vitest'
import { DATA_OWNERSHIP, ownerFor } from '@/lib/data/ownership'
import { canServeAuthenticatedApp, canServeIntelligence, platformHealth } from '@/lib/data/health'
import type { DependencyHealth } from '@/lib/data/contracts'

const health = (name: DependencyHealth['name'], status: DependencyHealth['status']): DependencyHealth => ({
  name, status, checkedAt: new Date(0).toISOString(),
})

describe('data platform boundaries', () => {
  it('has one owner for every declared data kind', () => {
    expect(Object.values(DATA_OWNERSHIP).every(Boolean)).toBe(true)
    expect(ownerFor('originalEvidence')).toBe('evidence')
    expect(ownerFor('regulation')).toBe('intelligence')
    expect(ownerFor('workspace')).toBe('core')
  })

  it('keeps the authenticated app available when optional intelligence fails', () => {
    const dependencies = [
      health('core', 'healthy'),
      health('identity', 'healthy'),
      health('intelligence', 'unavailable'),
    ]
    expect(platformHealth(dependencies)).toBe('degraded')
    expect(canServeAuthenticatedApp(dependencies)).toBe(true)
    expect(canServeIntelligence(dependencies)).toBe(false)
  })

  it('fails closed when a critical dependency is unavailable', () => {
    const dependencies = [health('core', 'unavailable'), health('identity', 'healthy')]
    expect(platformHealth(dependencies)).toBe('unavailable')
    expect(canServeAuthenticatedApp(dependencies)).toBe(false)
  })
})
