import { afterEach, describe, expect, it } from 'vitest'
import {
  assertBrowserSafeSupabaseKey,
  getSupabaseEnvStatus,
  getSupabasePublicClientKey,
  isSupabaseSecretKey,
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
  })

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
      publicClientKeySource: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      invalidPublicClientKey: false,
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
      missing: ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY'],
      host: null,
      urlUsesExpectedProject: false,
      hasUrl: true,
      hasAnonKey: false,
      hasPublishableKey: false,
      publicClientKeySource: null,
      invalidPublicClientKey: false,
    })
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
