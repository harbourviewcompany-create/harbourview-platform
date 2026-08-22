import { describe, expect, it } from 'vitest'
import {
  PAGE_TO_SECTION,
  PRIMARY_NAV,
  SECTION_GROUPS,
  SECTION_TO_GROUP,
} from '@/components/dashboard/mobile-command/contracts'

describe('mobile Command information architecture', () => {
  it('keeps the persistent bottom navigation to the four platform modes', () => {
    expect(PRIMARY_NAV.map(item => item.label)).toEqual(['Command', 'Market', 'Intel', 'Actions'])
    expect(PRIMARY_NAV.map(item => item.id)).toEqual(['overview', 'marketplace', 'weekly-signals', 'next-actions'])
  })

  it('places the established operational domains under Command instead of global or Market navigation', () => {
    expect(SECTION_TO_GROUP.genetics).toBe('overview')
    expect(SECTION_TO_GROUP.talent).toBe('overview')
    expect(SECTION_TO_GROUP.clinical).toBe('overview')

    expect(SECTION_GROUPS.overview).toEqual(expect.arrayContaining([
      'genetics',
      'talent',
      'clinical',
      'compliance',
      'education',
      'network',
    ]))
    expect(SECTION_GROUPS.overview).not.toEqual(expect.arrayContaining(['directories']))
    expect(SECTION_GROUPS.marketplace).not.toEqual(expect.arrayContaining(['genetics', 'talent', 'clinical']))
  })

  it('preserves legacy page-to-section deep links for operational domains', () => {
    expect(PAGE_TO_SECTION.genetics).toBe('genetics')
    expect(PAGE_TO_SECTION.talent).toBe('talent')
    expect(PAGE_TO_SECTION.jobs).toBe('talent')
    expect(PAGE_TO_SECTION.clinical).toBe('clinical')
    expect(PAGE_TO_SECTION.compliance).toBe('compliance')
    expect(PAGE_TO_SECTION.experts).toBe('network')
  })

  it('assigns every grouped section to exactly one persistent destination', () => {
    const groupedSections = Object.values(SECTION_GROUPS).flat()
    expect(new Set(groupedSections).size).toBe(groupedSections.length)
  })
})
