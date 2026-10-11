import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

describe('Harbourview Supabase project selector', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    delete process.env.NEXT_PUBLIC_HARBOURVIEW_SUPABASE_PROJECT_REF
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.resetModules()
  })

  it('defaults to the original production project', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zvxdgdkukjrrwamdpqrg.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-test-key'

    const env = await import('@/lib/supabase/env')

    expect(env.getExpectedSupabaseProjectRef()).toBe('zvxdgdkukjrrwamdpqrg')
    expect(env.getExpectedSupabaseHost()).toBe('zvxdgdkukjrrwamdpqrg.supabase.co')
    expect(env.getSupabaseUrl()).toBe('https://zvxdgdkukjrrwamdpqrg.supabase.co')
  })

  it('accepts the explicitly reviewed recovery project', async () => {
    process.env.NEXT_PUBLIC_HARBOURVIEW_SUPABASE_PROJECT_REF = 'vxosexkwpqbswusapook'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://vxosexkwpqbswusapook.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-test-key'

    const env = await import('@/lib/supabase/env')

    expect(env.getExpectedSupabaseProjectRef()).toBe('vxosexkwpqbswusapook')
    expect(env.getExpectedSupabaseHost()).toBe('vxosexkwpqbswusapook.supabase.co')
    expect(env.getSupabaseUrl()).toBe('https://vxosexkwpqbswusapook.supabase.co')
    expect(env.getSupabaseEnvStatus()).toMatchObject({
      configured: true,
      projectRef: 'vxosexkwpqbswusapook',
      resolvedHost: 'vxosexkwpqbswusapook.supabase.co',
      urlUsesExpectedProject: true,
    })
  })

  it('fails closed for any unapproved project ref', async () => {
    process.env.NEXT_PUBLIC_HARBOURVIEW_SUPABASE_PROJECT_REF = 'unapprovedprojectref'

    await expect(import('@/lib/supabase/env')).rejects.toThrow(/Unapproved Supabase project ref/)
  })
})
