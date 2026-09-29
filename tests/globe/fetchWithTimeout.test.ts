import { describe, it, expect, vi } from 'vitest'
import { createTimeoutFetch } from '@/lib/globe/fetchWithTimeout'

const hangingFetch = () =>
  vi.fn(
    (_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason ?? new Error('aborted')))
      }),
  ) as unknown as typeof fetch

describe('createTimeoutFetch', () => {
  it('aborts a hung request after the timeout', async () => {
    const f = createTimeoutFetch(40, hangingFetch())
    const started = Date.now()
    await expect(f('https://example.test/rest/v1/countries')).rejects.toBeDefined()
    expect(Date.now() - started).toBeLessThan(1000)
  })

  it('still honours a caller-supplied abort signal', async () => {
    const f = createTimeoutFetch(10_000, hangingFetch())
    const controller = new AbortController()
    const pending = f('https://example.test/x', { signal: controller.signal })
    controller.abort(new Error('caller aborted'))
    await expect(pending).rejects.toThrow(/caller aborted/)
  })

  it('passes successful responses through untouched', async () => {
    const ok = vi.fn(async () => new Response('{"ok":true}', { status: 200 })) as unknown as typeof fetch
    const res = await createTimeoutFetch(1000, ok)('https://example.test/ok')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})
