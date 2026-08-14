import React from 'react'
;(globalThis as { React?: typeof React }).React = React

import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { PublicCultivarPassportDTO } from '@/lib/genetics/dto'
import type { GeneticsCommandRecords } from '@/components/dashboard/mobile-command/sections/DomainSections'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('cultivar=alpha-passport'),
}))

import { GeneticsSection } from '@/components/dashboard/mobile-command/sections/DomainSections'

function passport(overrides: Partial<PublicCultivarPassportDTO> = {}): PublicCultivarPassportDTO {
  return {
    id: 'passport-1',
    slug: 'alpha-passport',
    displayName: 'Alpha Cultivar',
    publicSummary: 'Reviewed public genetics summary.',
    breederDisplayName: 'Harbour Breeding',
    rightsHolderDisplayName: 'Harbour Rights',
    originCountryCode: 'CA',
    originJurisdictionLabel: 'Ontario',
    cultivarCategory: 'cannabis',
    cannabisCategory: 'thc_dominant',
    claimStatus: 'admin_reviewed',
    evidenceScoreSummary: 'Evidence bundle reviewed.',
    verificationSummary: 'Identity reviewed against public evidence.',
    publicDisclaimer: 'Public passport summary only.',
    aliasesPublic: ['Alpha One', 'A1'],
    countryOpportunitiesPublic: [{
      countryCode: 'DE',
      jurisdictionLabel: 'Germany',
      opportunityType: 'licensing_discussion',
      status: 'open_to_discussion',
      materialTransferStatus: 'discussion_only',
      jurisdictionGateStatus: 'review_required',
      publicNote: 'Controlled licensing discussion only.',
      cta: 'Request licensing discussion',
    }],
    publicEvidenceSummaries: [{
      id: 'evidence-1',
      evidenceType: 'genotype_report',
      title: 'Public genotype summary',
      sourceLabel: 'Reviewed source',
      sourceDate: '2026-08-01',
      jurisdictionLabel: 'Ontario',
      claimStatus: 'admin_reviewed',
      publicSummary: 'Public evidence summary.',
    }],
    publicCollaborationProjects: [{
      id: 'project-1',
      slug: 'project-one',
      title: 'Verification collaboration',
      projectType: 'verification_project',
      status: 'open',
      countryCode: 'CA',
      jurisdictionLabel: 'Ontario',
      publicSummary: 'Public collaboration summary.',
      evidenceNeeded: null,
      cta: 'Start collaboration',
    }],
    accessRequestCtas: ['Request access', 'Request verification', 'View public passport'],
    ...overrides,
  }
}

function records(passports: PublicCultivarPassportDTO[]): GeneticsCommandRecords {
  return Object.assign(passports.map(item => ({
    ...item,
    kind: 'Cultivar passport',
    title: item.displayName,
    subtitle: item.publicSummary,
    status: item.claimStatus,
  })), {
    serviceProviders: [{
      id: 'provider-1',
      displayName: 'Genetics Lab',
      service_category: 'genotyping',
      service_summary: 'Reviewed genotyping service.',
      country_code: 'CA',
      jurisdiction_label: 'Ontario',
      verification_level: 'reviewed',
    }],
    collaborationProjects: [],
    sourceMeta: {
      cultivarPassports: {
        key: 'cultivarPassports', state: passports.length ? 'live' : 'empty', access: 'public',
        sourceLabel: 'Public cultivar passports', loadedAt: '2026-08-14T00:00:00Z', freshAt: null,
        staleAfterMs: null, durationMs: 1, errorCode: null, requested: true,
      },
    },
  })
}

function render(passports: PublicCultivarPassportDTO[]) {
  return renderToStaticMarkup(
    <GeneticsSection
      sectionRef={() => undefined}
      records={records(passports)}
      commandHref={(_section, changes = {}) => `/dashboard?page=genetics${changes.cultivar ? `&cultivar=${changes.cultivar}` : ''}`}
    />,
  )
}

describe('Mobile Genetics Command', () => {
  it('renders a truthful empty state for zero passports', () => {
    const html = render([])
    expect(html).toContain('No public cultivar passports loaded')
    expect(html).toContain('Passports')
    expect(html).not.toContain('private_notes')
  })

  it('renders one full public passport contract and consumes the cultivar deep link', () => {
    const html = render([passport()])
    expect(html).toContain('Alpha Cultivar')
    expect(html).toContain('Alpha One, A1')
    expect(html).toContain('Harbour Breeding')
    expect(html).toContain('Harbour Rights')
    expect(html).toContain('Ontario')
    expect(html).toContain('Public genotype summary')
    expect(html).toContain('Germany')
    expect(html).toContain('Verification collaboration')
    expect(html).toContain('Request access')
    expect(html).toContain('cultivar=alpha-passport')
    expect(html).toContain('open=""')
  })

  it('derives attention only from supported public claim states', () => {
    const html = render([
      passport({ id: 'reviewed', slug: 'reviewed', displayName: 'Reviewed', claimStatus: 'admin_reviewed' }),
      passport({ id: 'claimed', slug: 'claimed', displayName: 'Claimed', claimStatus: 'claimed' }),
      passport({ id: 'disputed', slug: 'disputed', displayName: 'Disputed', claimStatus: 'disputed' }),
    ])
    expect(html).toContain('Requires attention')
    expect(html).toContain('Claimed')
    expect(html).toContain('Disputed')
    expect(html).toContain('Search cultivars, aliases, breeder or origin')
  })

  it('renders several and large passport sets without truncating the record universe', () => {
    const several = Array.from({ length: 5 }, (_, index) => passport({ id: `p-${index}`, slug: `p-${index}`, displayName: `Cultivar ${index}` }))
    const large = Array.from({ length: 64 }, (_, index) => passport({ id: `large-${index}`, slug: `large-${index}`, displayName: `Large Cultivar ${index}` }))
    const severalHtml = render(several)
    const largeHtml = render(large)
    expect(severalHtml).toContain('Cultivar 4')
    expect(largeHtml).toContain('Large Cultivar 63')
    expect((largeHtml.match(/hvm2-genetics-record/g) ?? []).length).toBeGreaterThanOrEqual(64)
  })

  it('keeps long public content renderable and private fields absent', () => {
    const longText = 'Long genetics evidence '.repeat(80)
    const unsafe = passport({ publicSummary: longText }) as PublicCultivarPassportDTO & Record<string, unknown>
    unsafe.private_notes = 'DO NOT LEAK'
    unsafe.file_path = 'private/genetics/document.pdf'
    unsafe.review_notes_private = 'PRIVATE REVIEW'
    const html = render([unsafe])
    expect(html).toContain('Long genetics evidence')
    expect(html).not.toContain('DO NOT LEAK')
    expect(html).not.toContain('private/genetics/document.pdf')
    expect(html).not.toContain('PRIVATE REVIEW')
  })

  it('surfaces stale/error source state without converting it into a permission claim', () => {
    const stale = records([passport()])
    if (stale.sourceMeta?.cultivarPassports) stale.sourceMeta.cultivarPassports = { ...stale.sourceMeta.cultivarPassports, state: 'stale' }
    const html = renderToStaticMarkup(<GeneticsSection sectionRef={() => undefined} records={stale} commandHref={() => '/dashboard?page=genetics'} />)
    expect(html).toContain('configured freshness window')
    expect(html).toContain('Public Genetics boundary')
    expect(html).not.toContain('permission denied')
  })
})
