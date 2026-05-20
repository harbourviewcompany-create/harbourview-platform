import { describe, expect, it } from 'vitest'
import { getSupabaseEnvStatus } from '@/lib/supabase/env'

describe('getSupabaseEnvStatus', () => {
  it('does not throw and reports malformed URL deterministically', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not a url'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-test-key'
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    expect(() => getSupabaseEnvStatus()).not.toThrow()

    const status = getSupabaseEnvStatus()
    expect(status).toMatchObject({
      configured: true,
      missing: [],
      host: null,
      resolvedHost: 'zvxdgdkukjrrwamdpqrg.supabase.co',
      urlUsesExpectedProject: false,
      hasUrl: true,
      hasAnonKey: true,
      hasPublishableKey: false,
    })
  })

  it('keeps missing/configured deterministic for malformed URL with no keys', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '://bad-url'
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    expect(() => getSupabaseEnvStatus()).not.toThrow()

    const status = getSupabaseEnvStatus()
    expect(status).toMatchObject({
      configured: false,
      missing: ['NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
      host: null,
      urlUsesExpectedProject: false,
      hasUrl: true,
      hasAnonKey: false,
      hasPublishableKey: false,
    })
  })
})
