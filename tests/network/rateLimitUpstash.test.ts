import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const upstashMocks = vi.hoisted(() => {
  const redisConstructor = vi.fn()
  const ratelimitConstructor = vi.fn()
  const limitCall = vi.fn()
  const slidingWindow = vi.fn((limit: number, window: string) => ({ limit, window }))

  class MockRedis {
    constructor(options: unknown) {
      redisConstructor(options)
    }
  }

  class MockRatelimit {
    static slidingWindow = slidingWindow
    limit = limitCall

    constructor(options: unknown) {
      ratelimitConstructor(options)
    }
  }

  return { MockRedis, MockRatelimit, redisConstructor, ratelimitConstructor, limitCall, slidingWindow }
})

vi.mock('@upstash/redis', () => ({ Redis: upstashMocks.MockRedis }))
vi.mock('@upstash/ratelimit', () => ({ Ratelimit: upstashMocks.MockRatelimit }))

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
}

function restoreEnvValue(key: keyof typeof originalEnv) {
  const value = originalEnv[key]
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

function setRedisEnv(url?: string, token?: string) {
  if (url === undefined) delete process.env.UPSTASH_REDIS_REST_URL
  else process.env.UPSTASH_REDIS_REST_URL = url
  if (token === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN
  else process.env.UPSTASH_REDIS_REST_TOKEN = token
}

async function loadRateLimitModule() {
  vi.resetModules()
  return import('../../lib/network/rateLimit')
}

describe('network rate limiter Upstash integration contract', () => {
  beforeEach(() => {
    upstashMocks.redisConstructor.mockReset()
    upstashMocks.ratelimitConstructor.mockReset()
    upstashMocks.limitCall.mockReset()
    upstashMocks.slidingWindow.mockClear()
    vi.spyOn(Date, 'now').mockReturnValue(1_000)
    process.env.NODE_ENV = 'test'
    delete process.env.VERCEL_ENV
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
    restoreEnvValue('NODE_ENV')
    restoreEnvValue('VERCEL_ENV')
    restoreEnvValue('UPSTASH_REDIS_REST_URL')
    restoreEnvValue('UPSTASH_REDIS_REST_TOKEN')
  })

  it('preserves allowed, blocked, remaining, reset, identity-key, and limiter-reuse semantics on the Redis path', async () => {
    setRedisEnv('https://example.upstash.io', 'test-token')
    upstashMocks.limitCall
      .mockResolvedValueOnce({ success: true, remaining: 2, reset: 61_000 })
      .mockResolvedValueOnce({ success: false, remaining: 0, reset: 31_000 })

    const { enforceRateLimit } = await loadRateLimitModule()
    const identity = 'User@Example.COM'
    const identityHash = createHash('sha256').update(identity.toLowerCase()).digest('hex').slice(0, 16)

    const first = await enforceRateLimit({ route: 'marketplace:quote', ip: '203.0.113.9', identity, limit: 3, windowMs: 60_000 })
    const second = await enforceRateLimit({ route: 'marketplace:capture', ip: '203.0.113.10', identity, limit: 3, windowMs: 60_000 })

    expect(upstashMocks.redisConstructor).toHaveBeenCalledTimes(1)
    expect(upstashMocks.redisConstructor).toHaveBeenCalledWith({ url: 'https://example.upstash.io', token: 'test-token' })
    expect(upstashMocks.slidingWindow).toHaveBeenCalledOnce()
    expect(upstashMocks.slidingWindow).toHaveBeenCalledWith(3, '60000 ms')
    expect(upstashMocks.ratelimitConstructor).toHaveBeenCalledOnce()
    expect(upstashMocks.ratelimitConstructor).toHaveBeenCalledWith(expect.objectContaining({ limiter: { limit: 3, window: '60000 ms' }, prefix: 'harbourview:ratelimit', analytics: true }))
    expect(upstashMocks.limitCall).toHaveBeenNthCalledWith(1, `marketplace:quote:203.0.113.9:${identityHash}`)
    expect(upstashMocks.limitCall).toHaveBeenNthCalledWith(2, `marketplace:capture:203.0.113.10:${identityHash}`)
    expect(first).toEqual({ allowed: true, remaining: 2, retryAfterSeconds: 60 })
    expect(second).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 30 })
  })

  it('creates a separate limiter only when the limit/window policy changes', async () => {
    setRedisEnv('https://example.upstash.io', 'test-token')
    upstashMocks.limitCall.mockResolvedValue({ success: true, remaining: 1, reset: 61_000 })
    const { enforceRateLimit } = await loadRateLimitModule()

    await enforceRateLimit({ route: 'a', ip: '203.0.113.1', limit: 2, windowMs: 60_000 })
    await enforceRateLimit({ route: 'b', ip: '203.0.113.2', limit: 2, windowMs: 60_000 })
    await enforceRateLimit({ route: 'c', ip: '203.0.113.3', limit: 5, windowMs: 300_000 })

    expect(upstashMocks.redisConstructor).toHaveBeenCalledTimes(1)
    expect(upstashMocks.ratelimitConstructor).toHaveBeenCalledTimes(2)
    expect(upstashMocks.slidingWindow).toHaveBeenNthCalledWith(1, 2, '60000 ms')
    expect(upstashMocks.slidingWindow).toHaveBeenNthCalledWith(2, 5, '300000 ms')
  })

  it('falls back deterministically to in-memory enforcement when Redis credentials are absent', async () => {
    setRedisEnv()
    const { enforceRateLimit } = await loadRateLimitModule()
    const options = { route: 'fallback-test', ip: '198.51.100.8', limit: 1, windowMs: 60_000 }

    const first = await enforceRateLimit(options)
    const second = await enforceRateLimit(options)

    expect(upstashMocks.redisConstructor).not.toHaveBeenCalled()
    expect(upstashMocks.ratelimitConstructor).not.toHaveBeenCalled()
    expect(upstashMocks.limitCall).not.toHaveBeenCalled()
    expect(first).toEqual({ allowed: true, remaining: 0, retryAfterSeconds: 60 })
    expect(second).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 60 })
  })

  it.each([[undefined, undefined], ['https://example.upstash.io', undefined], [undefined, 'test-token']])(
    'logs the production fallback warning when Redis configuration is incomplete',
    async (url, token) => {
      process.env.NODE_ENV = 'production'
      process.env.VERCEL_ENV = 'production'
      setRedisEnv(url, token)
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

      await loadRateLimitModule()

      expect(upstashMocks.redisConstructor).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalledOnce()
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('UPSTASH_REDIS_REST_URL/TOKEN not set in production'))
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('per-instance in-memory tracking'))
    },
  )

  it('does not emit the production fallback warning when both Redis credentials are configured', async () => {
    process.env.NODE_ENV = 'production'
    process.env.VERCEL_ENV = 'production'
    setRedisEnv('https://example.upstash.io', 'test-token')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await loadRateLimitModule()

    expect(upstashMocks.redisConstructor).toHaveBeenCalledOnce()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('keeps the installed Redis and Ratelimit constructor surfaces compatible without making a network request', async () => {
    const redisPackage = await vi.importActual<typeof import('@upstash/redis')>('@upstash/redis')
    const ratelimitPackage = await vi.importActual<typeof import('@upstash/ratelimit')>('@upstash/ratelimit')
    const redis = new redisPackage.Redis({ url: 'https://example.upstash.io', token: 'constructor-contract-only' })
    const limiter = new ratelimitPackage.Ratelimit({
      redis,
      limiter: ratelimitPackage.Ratelimit.slidingWindow(2, '60000 ms'),
      prefix: 'harbourview:ratelimit:test-contract',
      analytics: false,
    })

    expect(redis).toBeInstanceOf(redisPackage.Redis)
    expect(typeof limiter.limit).toBe('function')
  })
})
