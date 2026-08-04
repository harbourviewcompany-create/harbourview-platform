import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

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

  afterEach(() => {
    vi.useRealTimers()
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

  it('treats successful empty data plus one failure as partial rather than a full error', async () => {
    const bundle = await loadCommandCentreData(context, {
      emptyRecords: {
        load: async () => [],
        fallback: [],
        sourceLabel: 'Empty records',
      },
      unavailableRecords: {
        load: async () => { throw new Error('Unavailable') },
        fallback: [],
        sourceLabel: 'Unavailable records',
      },
    })

    expect(bundle.state).toBe('partial')
    expect(bundle.sources.emptyRecords.state).toBe('empty')
    expect(bundle.sources.unavailableRecords.state).toBe('error')
  })

  it('bounds a hanging source and records its source-level duration', async () => {
    vi.useFakeTimers()
    const bundlePromise = loadCommandCentreData(context, {
      hanging: {
        load: () => new Promise<string>(() => {}),
        fallback: 'Controlled fallback',
        sourceLabel: 'Hanging source',
        timeoutMs: 50,
      },
    })

    await vi.advanceTimersByTimeAsync(50)
    const bundle = await bundlePromise

    expect(bundle.state).toBe('partial')
    expect(bundle.data.hanging).toBe('Controlled fallback')
    expect(bundle.sources.hanging.state).toBe('fallback')
    expect(bundle.sources.hanging.errorCode).toBe('SOURCE_TIMEOUT')
    expect(bundle.sources.hanging.durationMs).toBeGreaterThanOrEqual(50)
    expect(bundle.sources.hanging.durationMs).toBeLessThan(100)
  })
})
