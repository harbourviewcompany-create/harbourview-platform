import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  allowedIntroductionTransitions,
  isIntroductionTransitionAllowed,
  isTerminalIntroductionStatus,
} from '@/lib/network/introductionStatus'

describe('Network introduction status transitions (P1-A)', () => {
  it('allows members draft→review and early close/withdraw only', () => {
    expect(allowedIntroductionTransitions('draft', false)).toEqual(['review', 'closed'])
    expect(allowedIntroductionTransitions('review', false)).toEqual(['closed'])
    expect(allowedIntroductionTransitions('disclosure_pending', false)).toEqual([])
    expect(isIntroductionTransitionAllowed('draft', 'review', false)).toBe(true)
    expect(isIntroductionTransitionAllowed('review', 'disclosure_pending', false)).toBe(false)
  })

  it('allows staff the controlled pipeline', () => {
    expect(allowedIntroductionTransitions('review', true)).toEqual(
      expect.arrayContaining(['disclosure_pending', 'declined', 'closed']),
    )
    expect(isIntroductionTransitionAllowed('disclosure_pending', 'consent_pending', true)).toBe(true)
    expect(isIntroductionTransitionAllowed('consent_pending', 'approved', true)).toBe(true)
    expect(isIntroductionTransitionAllowed('approved', 'introduced', true)).toBe(true)
    expect(isIntroductionTransitionAllowed('introduced', 'converted', true)).toBe(true)
  })

  it('blocks terminal and same-status transitions', () => {
    for (const terminal of ['converted', 'declined', 'expired', 'closed'] as const) {
      expect(isTerminalIntroductionStatus(terminal)).toBe(true)
      expect(allowedIntroductionTransitions(terminal, true)).toEqual([])
      expect(isIntroductionTransitionAllowed(terminal, 'review', true)).toBe(false)
    }
    expect(isIntroductionTransitionAllowed('review', 'review', true)).toBe(false)
  })

  it('rejects unknown from-status', () => {
    expect(allowedIntroductionTransitions('not-a-status', true)).toEqual([])
  })
})

describe('Network Command P1-A migration boundary', () => {
  const migration = readFileSync(
    'supabase/migrations/20260820100000_network_command_p1_introduction_status.sql',
    'utf8',
  )
  const p0Security = readFileSync(
    'supabase/migrations/20260818133600_network_command_p0_security.sql',
    'utf8',
  )

  it('adds security-definer advance without broad authenticated UPDATE grant', () => {
    expect(migration).toContain('hv_network_advance_introduction')
    expect(migration).toContain('hv_network_introduction_transition_allowed')
    expect(migration).toContain('security definer')
    expect(migration).toContain("event_type")
    expect(migration).toContain('status_advanced')
    expect(migration).not.toMatch(
      /grant\s+select,\s*insert,\s*update\s+on\s+table\s+public\.network_introductions\s+to\s+authenticated/i,
    )
  })

  it('keeps P0 introduction write policy (select+insert only for authenticated)', () => {
    expect(p0Security).toContain(
      'grant select, insert on table public.network_introductions to authenticated',
    )
    expect(p0Security).not.toContain(
      'grant select, insert, update on table public.network_introductions to authenticated',
    )
  })
})
