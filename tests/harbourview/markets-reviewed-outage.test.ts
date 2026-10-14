import { afterEach, describe, expect, it, vi } from 'vitest'
import { isValidElement } from 'react'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}))

import MarketsPage from '@/app/markets/page'

// Traverse only JSX children; serializing a React element directly includes
// internal references and can throw on circular owner structures.
function renderedText(node: unknown): string {
  if (Array.isArray(node)) return node.map(renderedText).join(' ')
  if (isValidElement<{ children?: unknown }>(node)) return renderedText(node.props.children)
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  return ''
}

function setupBriefingQuery() {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-public-key')
  vi.stubEnv('NEXT_PHASE', '')

  const query = {
    select: mocks.select,
    eq: mocks.eq,
    order: mocks.order,
  }
  mocks.select.mockReturnValue(query)
  mocks.eq.mockReturnValue(query)
  mocks.from.mockReturnValue(query)
  mocks.createClient.mockReturnValue({ from: mocks.from })
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

describe('/markets reviewed briefing source and outage fallback', () => {
  it('does not throw HTTP 500 when the database returns a query error', async () => {
    setupBriefingQuery()
    mocks.order.mockResolvedValue({ data: null, error: { message: 'upstream unavailable' } })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const rendered = await MarketsPage()
    expect(renderedText(rendered)).toContain('Live reviewed briefings are temporarily unavailable')
    expect(mocks.from).toHaveBeenCalledWith('cc_jurisdiction_briefings')
    expect(mocks.eq).toHaveBeenCalledWith('jurisdiction_type', 'country')
    expect(mocks.eq).toHaveBeenCalledWith('review_state', 'reviewed')
    expect(console.error).toHaveBeenCalledWith(
      '[markets] reviewed country briefings unavailable',
      { message: 'upstream unavailable' },
    )
  })

  it('does not throw when the database client rejects the request', async () => {
    setupBriefingQuery()
    mocks.order.mockRejectedValue(new Error('fetch failed'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(MarketsPage()).resolves.toBeTruthy()
    expect(console.error).toHaveBeenCalledWith(
      '[markets] reviewed country briefing fetch failed',
      { message: 'fetch failed' },
    )
  })

  it('renders reviewed canonical data without invented maturity or signal counts', async () => {
    setupBriefingQuery()
    mocks.order.mockResolvedValue({
      error: null,
      data: [{
        country_iso2: 'CA',
        program_status: 'medical_only',
        market_dynamics: 'Reviewed Canadian market narrative',
        public_summary: 'Reviewed public summary',
        last_reviewed_date: '2026-10-10',
      }],
    })

    const rendered = await MarketsPage()
    const output = renderedText(rendered)
    expect(output).toContain('Reviewed Canadian market narrative')
    expect(output).toContain('Reviewed 2026-10-10')
    expect(output).toContain('Reviewed briefing')
    expect(output).not.toContain('undefined signals')
    expect(mocks.order).toHaveBeenCalledWith('last_reviewed_date', { ascending: false })
  })

  it('shows an honest empty state when reviewed rows are absent', async () => {
    setupBriefingQuery()
    mocks.order.mockResolvedValue({ data: [], error: null })

    const rendered = await MarketsPage()
    expect(renderedText(rendered)).toContain('Reviewed briefing pending')
    expect(renderedText(rendered)).not.toContain('temporarily unavailable')
  })
})
