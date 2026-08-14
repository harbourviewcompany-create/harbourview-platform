import 'server-only'

import type { CommandCentreDataState } from './commandCentreDataTypes'

/**
 * Visual fixtures are deliberately available only to the isolated CI build used
 * by the Mobile Command Centre visual workflow. They make non-live operator
 * states observable without exposing a query-controlled simulation in a real
 * deployment. The browser gate captures every registered state at 375x812,
 * 390x844, and 430x932 before the mobile Command evidence pass can be accepted.
 */
export const COMMAND_VISUAL_FIXTURE_IDS = [
  'loaded',
  'empty',
  'no-match',
  'stale',
  'permission',
  'error',
] as const

export type CommandVisualFixtureId = typeof COMMAND_VISUAL_FIXTURE_IDS[number]

export type CommandVisualFixture = Readonly<{
  id: CommandVisualFixtureId
  commandDataState: CommandCentreDataState
  hasOrg?: boolean
  emptyRecords?: boolean
}>

const FIXTURES: Record<CommandVisualFixtureId, CommandVisualFixture> = {
  loaded: { id: 'loaded', commandDataState: 'live' },
  empty: { id: 'empty', commandDataState: 'empty', emptyRecords: true },
  'no-match': { id: 'no-match', commandDataState: 'live' },
  stale: { id: 'stale', commandDataState: 'stale' },
  permission: { id: 'permission', commandDataState: 'live', hasOrg: false },
  error: { id: 'error', commandDataState: 'error' },
}

type FixtureEnvironment = Readonly<Record<string, string | undefined>>

export function isIsolatedCommandVisualEnvironment(env: FixtureEnvironment = process.env): boolean {
  return env.CI === '1'
    && env.HARBOURVIEW_LOCAL_TEST_BUILD === '1'
    && env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE === '1'
    && /^http:\/\/127\.0\.0\.1(?::\d+)?(?:\/|$)/.test(env.HARBOURVIEW_PUBLIC_BASE_URL ?? '')
}

export function resolveCommandVisualFixture(
  value: string | null | undefined,
  env: FixtureEnvironment = process.env,
): CommandVisualFixture | null {
  if (!isIsolatedCommandVisualEnvironment(env)) return null
  if (!value || !COMMAND_VISUAL_FIXTURE_IDS.includes(value as CommandVisualFixtureId)) return null
  return FIXTURES[value as CommandVisualFixtureId]
}
