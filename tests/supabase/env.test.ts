import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  assertBrowserSafeSupabaseKey,
  getSupabaseEnvStatus,
  getSupabasePublicClientKey,
  getSupabaseUrl,
  isExplicitLocalSupabaseUrl,
  isSupabaseSecretKey,
  resolveLockedSupabaseUrl,
} from '@/lib/supabase/env'

const ORIGINAL_ENV = { ...process.env }

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function fakeJwtWithRole(role: string) {
  return [
    encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
    encodeBase64Url(JSON.stringify({ role })),
    'signature',
  ].join('.')
}

describe('getSupabaseEnvStatus', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.unstubAllGlobals()
  })

  it('does not throw and reports malformed URL deterministically', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not a url'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-test-key'
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    delete process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE
    delete process.env.NEXT_PUBLIC_HARBOURVIEW_ALLOW_LOCAL_SUPABASE

    expect(() => getSupabaseEnvStatus()).not.toThrow()

    const status = getSupabaseEnvStatus()
    expect(status).toMatchObject({
      configured: true,
      missing: [],
      host: null,
      resolvedHost: 'zvxdgdkukjrrwamdpqrg.supabase.co',
      urlUsesExpectedProject: false,
      usesExplicitLocalSupabase: false,
      hasUrl: true,
      hasAnonKey: true,
      hasPublishableKey: false,
      publicClientKeySource: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      invalidPublicClientKey: false,
    })
  })

  it('keeps missing/configured deterministic for malformed URL with no keys', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '://bad-url'
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    delete process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE
    delete process.env.NEXT_PUBLIC_HARBOURVIEW_ALLOW_LOCAL_SUPABASE

    expect(() => getSupabaseEnvStatus()).not.toThrow()

    const status = getSupabaseEnvStatus()
    expect(status).toMatchObject({
      configured: false,
      missing: ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY'],
      host: null,
      urlUsesExpectedProject: false,
      usesExplicitLocalSupabase: false,
      hasUrl: true,
      hasAnonKey: false,
      hasPublishableKey: false,
      publicClientKeySource: null,
      invalidPublicClientKey: false,
    })
  })

  it('accepts an explicitly gated loopback Supabase URL on the server outside Vercel', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-local-test-key'
    process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'
    delete process.env.NEXT_PUBLIC_HARBOURVIEW_ALLOW_LOCAL_SUPABASE
    delete process.env.VERCEL
    delete process.env.VERCEL_ENV

    expect(isExplicitLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)).toBe(true)
    expect(resolveLockedSupabaseUrl()).toBe('http://127.0.0.1:54321')
    expect(getSupabaseUrl()).toBe('http://127.0.0.1:54321')
    expect(getSupabaseEnvStatus()).toMatchObject({
      configured: true,
      host: '127.0.0.1',
      resolvedHost: '127.0.0.1',
      urlUsesExpectedProject: false,
      usesExplicitLocalSupabase: true,
    })
  })

  it('accepts an explicitly gated loopback Supabase URL in browser code', () => {
    vi.stubGlobal('window', {})
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-local-test-key'
    process.env.NEXT_PUBLIC_HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'
    delete process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE
    delete process.env.VERCEL
    delete process.env.VERCEL_ENV

    expect(isExplicitLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)).toBe(true)
    expect(getSupabaseUrl()).toBe('http://localhost:54321')
  })

  it('accepts the IPv6 loopback host under the explicit local gate', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://[::1]:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-local-test-key'
    process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'
    delete process.env.VERCEL
    delete process.env.VERCEL_ENV

    expect(isExplicitLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)).toBe(true)
    expect(getSupabaseUrl()).toBe('http://[::1]:54321')
  })

  it('keeps loopback URLs locked to the canonical project without the explicit gate', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-local-test-key'
    delete process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE
    delete process.env.NEXT_PUBLIC_HARBOURVIEW_ALLOW_LOCAL_SUPABASE
    delete process.env.VERCEL
    delete process.env.VERCEL_ENV

    expect(isExplicitLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)).toBe(false)
    expect(resolveLockedSupabaseUrl()).toBe('https://zvxdgdkukjrrwamdpqrg.supabase.co')
    expect(getSupabaseUrl()).toBe('https://zvxdgdkukjrrwamdpqrg.supabase.co')
  })

  it('never accepts loopback Supabase URLs in a Vercel deployment environment', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-local-test-key'
    process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'
    process.env.NEXT_PUBLIC_HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'
    process.env.VERCEL = '1'
    process.env.VERCEL_ENV = 'preview'

    expect(isExplicitLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)).toBe(false)
    expect(resolveLockedSupabaseUrl()).toBe('https://zvxdgdkukjrrwamdpqrg.supabase.co')
    expect(getSupabaseUrl()).toBe('https://zvxdgdkukjrrwamdpqrg.supabase.co')
  })

  it('rejects non-loopback alternate Supabase hosts even when the local gate is enabled', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-test-key'
    process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE = '1'
    delete process.env.VERCEL
    delete process.env.VERCEL_ENV

    expect(isExplicitLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)).toBe(false)
    expect(resolveLockedSupabaseUrl()).toBe('https://zvxdgdkukjrrwamdpqrg.supabase.co')
  })

  it('rejects Supabase sb_secret keys for browser/public clients', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zvxdgdkukjrrwamdpqrg.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_secret_fake_key_for_test_only'
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    expect(isSupabaseSecretKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)).toBe(true)
    expect(() => getSupabasePublicClientKey()).toThrow(/Forbidden Supabase secret\/service-role key/)
    expect(getSupabaseEnvStatus()).toMatchObject({
      configured: false,
      invalidPublicClientKey: true,
      publicClientKeySource: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    })
  })

  it('rejects service_role JWTs for browser/public clients', () => {
    const serviceRoleJwt = fakeJwtWithRole('service_role')

    expect(isSupabaseSecretKey(serviceRoleJwt)).toBe(true)
    expect(() => assertBrowserSafeSupabaseKey(serviceRoleJwt, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')).toThrow(
      /Forbidden Supabase secret\/service-role key/
    )
  })

  it('prefers NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY over a misconfigured anon env value', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zvxdgdkukjrrwamdpqrg.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_secret_fake_key_for_test_only'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fake_key_for_test_only'

    expect(getSupabasePublicClientKey()).toBe('sb_publishable_fake_key_for_test_only')
    expect(getSupabaseEnvStatus()).toMatchObject({
      configured: true,
      invalidPublicClientKey: false,
      publicClientKeySource: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    })
  })
})
