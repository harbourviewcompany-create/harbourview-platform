import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const context = {
  countryIso2: 'CA',
  roleId: 'importer',
  page: 'briefing',
  userId: 'user-test',
  userEmail: 'test@example.com',
  hasOrganization: true,
} as const

describe('loadCommandCentreData', () => {
  let loadCommandCentreData: typeof import('@/lib/dashboard/loadCommandCentreData').loadCommandCentreData

  beforeAll(async () => {
    ;({ loadCommandCentreData } = await import('@/lib/dashboard/loadCommandCentreData'))
  })

  it('isolates one failed source and retains successful data', async () => {
    const bundle = await loadCommandCentreData(context, {
      liveRecords: {
        load: async () => [{ id: 'record-1' }],
        fallback: [],
        sourceLabel: 'Live records',
      },
      unavailableRecords: {
        load: async () => {
          const error = new Error('Private database detail')
          error.name = 'SOURCE_TIMEOUT'
          throw error
        },
        fallback: [],
        sourceLabel: 'Unavailable records',
      },
    })

    expect(bundle.state).toBe('partial')
    expect(bundle.data.liveRecords).toEqual([{ id: 'record-1' }])
    expect(bundle.data.unavailableRecords).toEqual([])
    expect(bundle.sources.liveRecords.state).toBe('live')
    expect(bundle.sources.unavailableRecords.state).toBe('error')
    expect(bundle.sources.unavailableRecords.errorCode).toBe('SOURCE_TIMEOUT')
  })

  it('labels configured fallback data without exposing the source error', async () => {
    const bundle = await loadCommandCentreData(context, {
      summary: {
        load: async () => { throw new Error('sensitive raw message') },
        fallback: { text: 'Controlled fallback' },
        sourceLabel: 'Country summary',
      },
    })

    expect(bundle.state).toBe('partial')
    expect(bundle.data.summary).toEqual({ text: 'Controlled fallback' })
    expect(bundle.sources.summary.state).toBe('fallback')
    expect(bundle.sources.summary.errorCode).toBe('Error')
    expect(JSON.stringify(bundle.sources.summary)).not.toContain('sensitive raw message')
  })

  it('marks old data stale using the configured freshness window', async () => {
    const bundle = await loadCommandCentreData(context, {
      signals: {
        load: async () => [{ id: 'signal-1', updatedAt: '2020-01-01T00:00:00.000Z' }],
        fallback: [],
        sourceLabel: 'Signals',
        freshAt: data => data[0]?.updatedAt,
        staleAfterMs: 24 * 60 * 60 * 1000,
      },
    })

    expect(bundle.state).toBe('stale')
    expect(bundle.sources.signals.state).toBe('stale')
  })

  it('reports an empty bundle distinctly from an unavailable bundle', async () => {
    const bundle = await loadCommandCentreData(context, {
      records: {
        load: async () => [],
        fallback: [],
        sourceLabel: 'Records',
      },
    })

    expect(bundle.state).toBe('empty')
    expect(bundle.sources.records.state).toBe('empty')
  })
})
