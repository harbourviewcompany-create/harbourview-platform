import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseHTML } from 'linkedom'
import { describe, expect, it } from 'vitest'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { buildSafeSignalPresentation } from '@/lib/dashboard/signalPresentation'
import { WeeklySignalsSection } from '@/components/dashboard/mobile-command/sections/WeeklySignalsSection'

const noopRef = () => {}

const base = {
  reviewed: true,
  created_at: '2026-08-14T12:07:38Z',
}

const rows = [
  {
    ...base,
    id: 'daily-2026-08-14-curaleaf-aurora',
    headline: 'Curaleaf puts Aurora Cannabis in play with unsolicited takeover proposal',
    summary: 'Curaleaf announced an intended unsolicited offer for Aurora Cannabis.',
    source: 'Curaleaf / Aurora Cannabis company disclosures',
    url: 'https://example.com/curaleaf-aurora',
    verification: 'official/corroborated',
    commercial_impact: 'A successful combination would consolidate international medical infrastructure.',
    country: 'Canada',
    analysis: {
      counterparties: ['Curaleaf Holdings', 'Aurora Cannabis'],
      product: 'medical cannabis portfolio',
      market_access: 'global medical cannabis',
      verified_facts: ['Formal takeover bid not yet commenced at latest verification'],
      inference: ['EU-GMP capacity appears strategically important'],
      transaction_stage: 'proposed_intended_bid',
      source_published_at: '2026-08-11',
      source_urls: ['https://private.example/provenance'],
      privateEvidence: 'must-never-render',
    },
  },
  {
    ...base,
    id: 'daily-2026-08-14-health-canada-import-export',
    headline: 'Health Canada extends cannabis import permits to 12 months and aligns export validity',
    summary: 'Health Canada updated cannabis import/export guidance.',
    source: 'Health Canada',
    url: 'https://example.com/health-canada',
    verification: 'official',
    commercial_impact: 'Longer permit validity reduces repetitive administration.',
    country: 'Canada',
    analysis: {
      jurisdiction: 'Canada',
      product: 'medical/scientific cannabis',
      market_access: 'international medical/scientific cannabis trade',
      licence_classes: ['standard cultivation', 'sale for medical purposes'],
      verified_facts: ['Import permits may be valid for up to 12 months instead of six'],
      inference: ['Repeat programs should face lower permit-renewal friction'],
      source_published_at: '2026-07-22',
      internalReviewNotes: 'must-never-render',
    },
  },
  {
    ...base,
    id: 'daily-2026-08-14-medipharm-international',
    headline: 'MediPharm advances France, Brazil, New Zealand and Australia medical-cannabis channels',
    summary: 'MediPharm reported a second GMP cannabis-oil shipment to France and other international activity.',
    source: 'MediPharm Labs Q2 2026 disclosure',
    url: 'https://example.com/medipharm',
    verification: 'company-reported',
    commercial_impact: 'The update demonstrates active multi-market commercialization.',
    country: 'Canada',
    analysis: {
      facility: 'MediPharm Canadian GMP production platform',
      products: ['GMP cannabis oils', 'Wildlife medical cannabis portfolio'],
      origin_market: 'Canada',
      destination_markets: ['France', 'Brazil', 'New Zealand', 'Australia'],
      counterparties: ['MediPharm Labs', 'unnamed French buyer'],
      licences_certifications: ['EU-GMP', 'ANVISA GMP', 'Health Canada licences'],
      verified_facts: ['Second purchase order of GMP cannabis oils shipped to France'],
      inference: ['MediPharm is converting its certification stack into repeat demand'],
      source_published_at: '2026-08-13T07:30:00-04:00',
      sourceEvidence: 'must-never-render',
    },
  },
  {
    ...base,
    id: 'daily-2026-08-14-new-york-showcase',
    headline: 'New York expands Cannabis Showcase Events for licensed microbusinesses',
    summary: 'Eligible microbusinesses may serve as cultivator and processor for approved showcase events.',
    source: 'New York State Senate',
    url: 'https://example.com/new-york',
    verification: 'official-legislation/corroborated-signing',
    commercial_impact: 'Vertically integrated microbusinesses gain a more direct event-sales path.',
    country: 'United States',
    analysis: {
      jurisdiction: 'New York',
      licence: 'adult-use microbusiness with retail, cultivation and processing activities',
      product: 'regulated adult-use cannabis products',
      market_access: 'Cannabis Showcase Events / temporary retail',
      verified_facts: ['The act provides for immediate effect upon enactment'],
      inference: ['Customer-acquisition economics improve for eligible operators'],
      image_status: 'not_applicable',
    },
  },
  {
    ...base,
    id: 'daily-2026-08-14-avicanna-quix',
    headline: 'Avicanna introduces QUIX rapid-onset medical-cannabis portfolio',
    summary: 'Avicanna introduced QUIX-powered capsules and soft chews for planned Canadian medical availability.',
    source: 'Avicanna Inc.',
    url: 'https://example.com/avicanna',
    verification: 'official-company',
    commercial_impact: 'Rapid-onset formats push differentiation toward formulation and delivery technology.',
    country: 'Canada',
    analysis: {
      product: 'QUIX rapid-onset capsules and soft chews',
      market_access: 'Canadian medical cannabis channels',
      verified_facts: ['Canadian medical-channel availability is planned for Q3 2026'],
      inference: ['Rapid-onset delivery could increase the value of formulation IP'],
      transaction_stage: 'product_announced_planned_launch',
      image_status: 'source_page_contains_image_not_ingested',
      image_url: null,
    },
  },
]

function toSignal(row: typeof rows[number]): DashboardSignal {
  const safe = buildSafeSignalPresentation(row)
  return {
    ...safe,
    id: row.id,
    title: row.headline,
    type: 'signal',
    market: row.country,
    tag: { label: 'SIGNAL', color: '#fff', bg: '#000', border: '#333' },
    timeAgo: 'recently',
    confidence: 90,
    commercialImpact: safe.commercialImpact || '',
  }
}

describe('Daily Brief authenticated signal presentation', () => {
  it('projects all five record shapes through an explicit safe allowlist', () => {
    const projected = rows.map(buildSafeSignalPresentation)
    const payload = JSON.stringify(projected)

    expect(projected).toHaveLength(5)
    expect(projected[0]?.counterparties).toEqual(['Curaleaf Holdings', 'Aurora Cannabis'])
    expect(projected[1]?.licencesCertifications).toContain('standard cultivation')
    expect(projected[2]?.facilities).toEqual(['MediPharm Canadian GMP production platform'])
    expect(projected[3]?.marketAccess).toContain('Cannabis Showcase Events / temporary retail')
    expect(projected[4]?.image?.status).toBe('source_page_contains_image_not_ingested')

    expect(payload).not.toContain('source_urls')
    expect(payload).not.toContain('privateEvidence')
    expect(payload).not.toContain('internalReviewNotes')
    expect(payload).not.toContain('sourceEvidence')
    expect(payload).not.toContain('must-never-render')
  })

  it('renders source, verification, commercial implication, safe details and canonical links without private provenance', () => {
    const markup = renderToStaticMarkup(createElement(WeeklySignalsSection, {
      sectionRef: noopRef,
      signals: rows.map(toSignal),
      countryLabel: 'Canada',
    }))
    const document = parseHTML(`<!doctype html><html><body>${markup}</body></html>`).document
    const text = document.body.textContent || ''

    for (const row of rows) {
      expect(text).toContain(row.headline)
      expect(text).toContain(row.source)
      expect(text).toContain(row.verification)
      expect(document.querySelector(`a[href="${row.url}"]`)).not.toBeNull()
    }

    expect(text).toContain('Curaleaf Holdings')
    expect(text).toContain('EU-GMP')
    expect(text).toContain('Cannabis Showcase Events / temporary retail')
    expect(text).toContain('QUIX rapid-onset capsules and soft chews')
    expect(text).toContain('Verified facts')
    expect(text).toContain('Inference')
    expect(text).not.toContain('must-never-render')
    expect(markup).not.toContain('source_urls')
    expect(markup).not.toContain('internalReviewNotes')
  })
})
