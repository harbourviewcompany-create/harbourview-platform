import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  assertPublicRegulatorySignalSafe,
  containsForbiddenRegulatorySignalLeakage,
} from '@/lib/regulatory-signals/safety'
import type { PublicRegulatorySignal } from '@/lib/regulatory-signals/types'

const SAFE_URL = 'https://regulator.example/public/source-document'

function approvedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'approved-safe',
    slug: 'approved-safe',
    headline: 'Regulator updates filing guidance',
    signal_type: 'regulatory_guidance',
    confidence: 'high',
    impact_level: 'moderate',
    country_code: 'CA',
    country_name: 'Canada',
    region: 'North America',
    jurisdiction: 'Canada',
    regulator_name: 'Health Canada',
    signal_date: '2026-08-21',
    source_tier: 'tier_1_official',
    source_type: 'regulator',
    canonical_source_url: SAFE_URL,
    public_summary: 'Public filing guidance changed.',
    public_implication: 'Review the updated filing requirements.',
    published_at: '2026-08-21T12:00:00Z',
    last_reviewed_at: '2026-08-21T12:00:00Z',
    ...overrides,
  }
}

function reviewedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'reviewed-safe',
    date: '2026-08-21',
    cat: 'GAZETTE',
    headline: 'Regulator updates import guidance',
    summary: 'Public import guidance changed.',
    country: 'Canada',
    commercial_impact: 'Review the updated import requirements.',
    source: 'Health Canada',
    url: SAFE_URL,
    tier: '1',
    created_at: '2026-08-21T12:00:00Z',
    reviewed: true,
    quality_label: 'signal',
    quality_confidence: 0.92,
    content_type: 'regulatory',
    impact: 'medium',
    title_en: null,
    summary_en: null,
    lang_detected: 'en',
    is_representative: true,
    cluster_rep_id: null,
    ...overrides,
  }
}

function jsonResponse(rows: unknown[]) {
  return new Response(JSON.stringify(rows), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function safeSignal(): PublicRegulatorySignal {
  return {
    id: 'safe',
    slug: 'safe',
    headline: 'Regulator updates filing guidance',
    signal_type: 'regulatory_guidance',
    confidence: 'high',
    impact_level: 'moderate',
    country_code: 'CA',
    country_name: 'Canada',
    region: 'North America',
    jurisdiction: 'Canada',
    regulator_name: 'Health Canada',
    signal_date: '2026-08-21',
    source_tier: 'tier_1_official',
    source_type: 'regulator',
    canonical_source_url: SAFE_URL,
    public_summary: 'Public filing guidance changed.',
    public_implication: 'Review the updated filing requirements.',
    published_at: '2026-08-21',
    last_reviewed_at: '2026-08-21',
    content_type: 'regulatory',
    confidence_score: 92,
    corroboration_count: 1,
    original_language: null,
    original_language_label: null,
    translated: false,
    country_slug: 'canada',
  }
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('normalized regulatory-signal public leakage enforcement', () => {
  it('allows canonical_source_url while rejecting the exact forbidden source_url field', () => {
    const safe = safeSignal()
    expect(() => assertPublicRegulatorySignalSafe(safe)).not.toThrow()

    const unsafe = { ...safe, source_url: 'https://internal.example/source' } as PublicRegulatorySignal
    expect(() => assertPublicRegulatorySignalSafe(unsafe)).toThrow(/source_url/i)
  })

  it('normalizes case, camel boundaries and separators for forbidden public content', () => {
    expect(containsForbiddenRegulatorySignalLeakage('BUYER__DEMAND')).toBe(true)
    expect(containsForbiddenRegulatorySignalLeakage('Internal-Review')).toBe(true)
    expect(containsForbiddenRegulatorySignalLeakage('sellerListing')).toBe(true)
  })

  it('keeps a safe approved-view row with canonical_source_url', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse([approvedRow()])))
    const { getPublicRegulatorySignalFeed } = await import('@/lib/regulatory-signals/public')

    const feed = await getPublicRegulatorySignalFeed()
    const signal = feed.signals.find((entry) => entry.id === 'approved-safe')
    expect(signal?.canonical_source_url).toBe(SAFE_URL)
  })

  it('excludes normalized forbidden content from the approved-view path', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(jsonResponse([approvedRow({ id: 'approved-unsafe', slug: 'approved-unsafe', public_summary: 'Escalated BUYER__DEMAND noted.' })]))
        .mockResolvedValueOnce(jsonResponse([])),
    )
    const { getPublicRegulatorySignalFeed } = await import('@/lib/regulatory-signals/public')

    const feed = await getPublicRegulatorySignalFeed()
    expect(feed.signals.some((entry) => entry.id === 'approved-unsafe')).toBe(false)
  })

  it('keeps a safe reviewed fallback row with canonical_source_url', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(jsonResponse([]))
        .mockResolvedValueOnce(jsonResponse([reviewedRow()])),
    )
    const { getPublicRegulatorySignalFeed } = await import('@/lib/regulatory-signals/public')

    const feed = await getPublicRegulatorySignalFeed()
    const signal = feed.signals.find((entry) => entry.id === 'reviewed-safe')
    expect(signal?.canonical_source_url).toBe(SAFE_URL)
  })

  it('excludes normalized forbidden content from the reviewed fallback path', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(jsonResponse([]))
        .mockResolvedValueOnce(jsonResponse([reviewedRow({ id: 'reviewed-unsafe', summary: 'Contains Internal-Review material.' })])),
    )
    const { getPublicRegulatorySignalFeed } = await import('@/lib/regulatory-signals/public')

    const feed = await getPublicRegulatorySignalFeed()
    expect(feed.signals.some((entry) => entry.id === 'reviewed-unsafe')).toBe(false)
  })
})
