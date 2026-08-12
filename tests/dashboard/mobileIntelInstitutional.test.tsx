import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseHTML } from 'linkedom'
import { describe, expect, it, vi } from 'vitest'
import type { MobileCommandCentreProps } from '@/components/dashboard/mobile-command/props'
import type { NormalizedListing } from '@/components/dashboard/mobile-command/contracts'
import { buildCommandSearchIndex, searchCommandRecords } from '@/components/dashboard/mobile-command/intelSearch'
import {
  LocalIntelSection,
  RegulatoryWatchSection,
  SearchSection,
  WeeklySignalsSection,
} from '@/components/dashboard/mobile-command/sections/IntelligenceSections'

const noopRef = () => {}

function documentFrom(element: ReturnType<typeof createElement>) {
  const markup = renderToStaticMarkup(element)
  return parseHTML(`<!doctype html><html><body>${markup}</body></html>`).document
}

const germanySignal = {
  id: 'signal-de',
  title: 'German import requirements updated',
  market: 'Germany',
  type: 'REGULATORY_CHANGE',
  commercialImpact: 'Importer pathway review required.',
  confidence: 88,
  timeAgo: '2h ago',
  analysis: {
    what_changed: 'A reviewed German regulatory signal changed.',
    recommended_action: 'Review the current import pathway.',
  },
} as unknown as MobileCommandCentreProps['signals'][number]

const kenyaSignal = {
  id: 'signal-ke',
  title: 'Kenya cannabis court proceeding',
  market: 'Kenya',
  type: 'REGULATORY_CHANGE',
  commercialImpact: 'Monitor for developing relevance.',
  confidence: 90,
  timeAgo: '13h ago',
} as unknown as MobileCommandCentreProps['signals'][number]

const germanListing: NormalizedListing = {
  id: 'listing-de',
  title: 'German pharmacy supply lot',
  summary: 'Reviewed marketplace record for Germany.',
  jurisdiction: 'Germany',
  category: 'Cannabis',
  status: 'approved',
  channel: 'Harbourview mediated',
  confidence: 82,
  view: 'cannabis',
}

const watchItems = Array.from({ length: 9 }, (_, index) => ({
  id: `watch-${index}`,
  jurisdiction: 'Germany',
  item_type: 'regulation',
  title: `German regulatory watch ${index + 1}`,
  latest_change_note: `Reviewed change note ${index + 1}`,
  next_action: 'Continue watch',
})) as unknown as NonNullable<MobileCommandCentreProps['watchlistData']>['items']

const localIntel = {
  coverageStatus: 'available',
  authorities: {
    keyList: [
      { name: 'Federal Institute for Drugs and Medical Devices (BfArM)', role: 'National medical cannabis regulator' },
      ...Array.from({ length: 6 }, (_, index) => ({ name: `Authority ${index + 2}`, role: `Mandate ${index + 2}` })),
    ],
  },
  municipalities: Array.from({ length: 9 }, (_, index) => ({
    name: `Subdivision ${index + 1}`,
    status: index === 0 ? 'low' : 'active',
    note: `Local note ${index + 1}`,
  })),
  constraints: [{ label: 'Constraint', text: 'A reviewed local constraint.', icon: '◇' }],
  routes: [{ label: 'Route', text: 'A reviewed market-access route.', icon: '→' }],
  openQuestions: Array.from({ length: 7 }, (_, index) => `Open question ${index + 1}`),
} as unknown as NonNullable<MobileCommandCentreProps['localIntel']>

function searchIndex() {
  return buildCommandSearchIndex({
    signals: [germanySignal, kenyaSignal],
    listings: [germanListing],
    watchItems,
    localIntel,
    countryLabel: 'Germany',
    countryIntel: {
      public_summary: 'Germany operating context.',
      regulator_label: 'BfArM',
      review_status: 'approved',
    } as MobileCommandCentreProps['countryIntel'],
    directories: [{ id: 'operator-1', kind: 'Licensed operator', title: 'German Operator GmbH', subtitle: 'Germany operator', status: 'Reviewed' }],
    genetics: [{ id: 'genetics-1', kind: 'Cultivar passport', title: 'German Trial Cultivar', subtitle: 'Germany research record', status: 'Reviewed' }],
    actions: [{ id: 'action-1', label: 'Validate the Germany access pathway', detail: 'Confirm requirements.', href: '/dashboard', tone: 'gold' }],
    evidenceDocuments: [{ id: 'doc-1', title: 'Germany authority evidence', jurisdiction: 'Germany', review_status: 'reviewed' }],
    talent: [{ id: 'job-1', title: 'Germany regulatory analyst', country: 'Germany', company: 'Example' }],
  })
}

describe('Mobile Intel institutional remediation', () => {
  it('indexes the authenticated command record universe instead of signals and marketplace only', () => {
    const records = searchIndex()
    const matches = searchCommandRecords(records, 'Germany')
    const kinds = new Set(matches.map(record => record.kind))

    expect(kinds).toContain('signal')
    expect(kinds).toContain('marketplace')
    expect(kinds).toContain('regulatory')
    expect(kinds).toContain('jurisdiction')
    expect(kinds).toContain('directory')
    expect(kinds).toContain('genetics')
    expect(kinds).toContain('action')
    expect(kinds).toContain('evidence')
    expect(kinds).toContain('talent')
    expect(searchCommandRecords(records, 'BfArM').some(record => record.title.includes('BfArM'))).toBe(true)
  })

  it('returns no query results for an empty query', () => {
    expect(searchCommandRecords(searchIndex(), '   ')).toEqual([])
  })

  it('orders direct jurisdiction signal matches before broader-watch signals without deleting either', () => {
    const document = documentFrom(createElement(WeeklySignalsSection, {
      sectionRef: noopRef,
      signals: [kenyaSignal, germanySignal],
      countryLabel: 'Germany',
    }))
    const cards = [...document.querySelectorAll('.hvm2-intel-signal-card')]

    expect(cards).toHaveLength(2)
    expect(cards[0]?.textContent).toContain('German import requirements updated')
    expect(cards[0]?.textContent).toContain('Context match')
    expect(cards[1]?.textContent).toContain('Kenya cannabis court proceeding')
    expect(cards[1]?.textContent).toContain('Broader watch')
    expect(cards[1]?.textContent).toContain('No direct Germany match')
  })

  it('renders all regulatory watch items with discrete metric label/value elements', () => {
    const document = documentFrom(createElement(RegulatoryWatchSection, {
      sectionRef: noopRef,
      items: watchItems,
      activeRules: 2,
      regulatoryTier: 'regulated',
      outlook: 'Reviewed outlook',
      sourceCoverageCount: 3,
      commandHref: vi.fn(() => '/dashboard?section=jurisdiction'),
    }))

    const metrics = [...document.querySelectorAll('.hvm2-regulatory-metrics .hvm2-metric')]
    expect(metrics).toHaveLength(3)
    expect(metrics[0]?.querySelector('span')?.textContent).toBe('Tracked items')
    expect(metrics[0]?.querySelector('strong')?.textContent).toBe('9')
    expect(metrics[0]?.querySelector('span')).not.toBe(metrics[0]?.querySelector('strong'))
    expect(metrics[1]?.querySelector('span')?.textContent).toBe('Watch rules')
    expect(metrics[1]?.querySelector('strong')?.textContent).toBe('2')
    expect(metrics[2]?.querySelector('span')?.textContent).toBe('Source coverage')
    expect(metrics[2]?.querySelector('strong')?.textContent).toBe('3')
    expect(document.querySelectorAll('.hvm2-intel-record-list .hvm2-intel-record-card')).toHaveLength(9)
  })

  it('renders the complete structured local-intelligence record set without legacy slice caps', () => {
    const document = documentFrom(createElement(LocalIntelSection, {
      sectionRef: noopRef,
      localIntel,
      countryLabel: 'Germany',
    }))
    const text = document.body.textContent || ''
    const firstAuthorityCard = document.querySelector('.hvm2-local-intel-groups section .hvm2-intel-record-card')

    expect(text).toContain('Jurisdiction intelligence for Germany')
    expect(firstAuthorityCard?.querySelector('.hvm2-intel-record-type')?.textContent).toBe('Authority')
    expect(firstAuthorityCard?.querySelector('strong')?.textContent).toBe('Federal Institute for Drugs and Medical Devices (BfArM)')
    expect(firstAuthorityCard?.querySelector('p')?.textContent).toBe('National medical cannabis regulator')
    expect(text).toContain('Authority 7')
    expect(text).toContain('Subdivision 9')
    expect(text).toContain('Open question 7')
    expect(text).toContain('Market-access route')
    expect(text).toContain('Constraint')
  })

  it('separates corpus counts from results before a search query', () => {
    const records = searchIndex()
    const document = documentFrom(createElement(SearchSection, {
      sectionRef: noopRef,
      searchQuery: '',
      searchRecords: records,
      onQueryChange: vi.fn(),
      onNavigate: vi.fn(),
      onListingSelect: vi.fn(),
    }))
    const text = document.body.textContent || ''

    expect(text).toContain(`Indexed ${records.length} authenticated records`)
    expect(text).toContain('Results appear only after a query')
    expect(text).not.toContain('total results')
    expect(document.querySelector('.hvm2-search-results ul')).toBeNull()
  })

  it('renders one structured left-aligned result card per Germany match and survives long German text', () => {
    const records = searchIndex()
    records.push({
      id: 'signal-long-de',
      kind: 'signal',
      kindLabel: 'Signal',
      title: 'Cannabis Social Clubs: Hier präsentieren wir erstmals eine vollständige Liste aller genehmigten Anbauvereinigungen und ihrer regulatorischen Einordnung in Deutschland',
      subtitle: 'Langer deutschsprachiger Testdatensatz zur mobilen Umbruchprüfung.',
      jurisdiction: 'Germany',
      destination: 'weekly-signals',
      searchableText: 'cannabis social clubs deutschland germany langer deutschsprachiger testdatensatz',
    })

    const matches = searchCommandRecords(records, 'Germany')
    const document = documentFrom(createElement(SearchSection, {
      sectionRef: noopRef,
      searchQuery: 'Germany',
      searchRecords: records,
      onQueryChange: vi.fn(),
      onNavigate: vi.fn(),
      onListingSelect: vi.fn(),
    }))

    const cards = [...document.querySelectorAll('.hvm2-intel-search-result')]
    expect(cards).toHaveLength(matches.length)
    expect(cards.every(card => Boolean(card.querySelector('.hvm2-intel-search-kind')))).toBe(true)
    expect(cards.every(card => Boolean(card.querySelector('strong')))).toBe(true)
    expect(cards.some(card => card.querySelector('strong')?.textContent?.includes('Cannabis Social Clubs'))).toBe(true)
    const germanSignalCard = cards.find(card => card.querySelector('strong')?.textContent === 'German import requirements updated')
    expect(germanSignalCard?.querySelector('.hvm2-intel-search-kind')?.textContent).toBe('Signal')
    expect(germanSignalCard?.querySelector('strong')?.textContent).toBe('German import requirements updated')
  })
})
