import { describe, expect, it } from 'vitest'
import {
  COMMAND_VISUAL_FIXTURE_IDS,
  isIsolatedCommandVisualEnvironment,
  resolveCommandVisualFixture,
} from '@/lib/dashboard/commandVisualFixtures'

const isolatedEnv = {
  CI: '1',
  HARBOURVIEW_LOCAL_TEST_BUILD: '1',
  HARBOURVIEW_ALLOW_LOCAL_SUPABASE: '1',
  HARBOURVIEW_PUBLIC_BASE_URL: 'http://127.0.0.1:3000',
} as const

describe('Command visual fixtures', () => {
  it('is enabled only by the isolated local visual-workflow environment', () => {
    expect(isIsolatedCommandVisualEnvironment(isolatedEnv)).toBe(true)
    expect(isIsolatedCommandVisualEnvironment({ ...isolatedEnv, CI: '0' })).toBe(false)
    expect(isIsolatedCommandVisualEnvironment({ ...isolatedEnv, HARBOURVIEW_PUBLIC_BASE_URL: 'https://harbourview.vercel.app' })).toBe(false)
    expect(isIsolatedCommandVisualEnvironment({ ...isolatedEnv, HARBOURVIEW_ALLOW_LOCAL_SUPABASE: '0' })).toBe(false)
  })

  it('resolves every approved fixture and rejects unknown or production requests', () => {
    expect(COMMAND_VISUAL_FIXTURE_IDS.map(id => resolveCommandVisualFixture(id, isolatedEnv)?.id)).toEqual(COMMAND_VISUAL_FIXTURE_IDS)
    expect(resolveCommandVisualFixture('unsupported', isolatedEnv)).toBeNull()
    expect(resolveCommandVisualFixture('error', { ...isolatedEnv, HARBOURVIEW_PUBLIC_BASE_URL: 'https://harbourview.vercel.app' })).toBeNull()
  })

  it('keeps the empty, no-match, stale, permission, and error contracts distinct', () => {
    expect(resolveCommandVisualFixture('loaded', isolatedEnv)).toMatchObject({ commandDataState: 'live' })
    expect(resolveCommandVisualFixture('empty', isolatedEnv)).toMatchObject({ commandDataState: 'empty', emptyRecords: true })
    expect(resolveCommandVisualFixture('no-match', isolatedEnv)).toMatchObject({ commandDataState: 'live' })
    expect(resolveCommandVisualFixture('stale', isolatedEnv)).toMatchObject({ commandDataState: 'stale' })
    expect(resolveCommandVisualFixture('permission', isolatedEnv)).toMatchObject({ commandDataState: 'live', hasOrg: false })
    expect(resolveCommandVisualFixture('error', isolatedEnv)).toMatchObject({ commandDataState: 'error' })
  })
})
