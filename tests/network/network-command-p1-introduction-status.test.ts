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

  it('preserves the authoritative security-definer advancement function and transition audit', () => {
    expect(migration).toContain('hv_network_advance_introduction')
    expect(migration).toContain('hv_network_introduction_transition_allowed')
    expect(migration).toContain('security definer')
    expect(migration).toContain('status_advanced')
    expect(migration).not.toMatch(
      /grant\s+select,\s*insert,\s*update\s+on\s+table\s+public\.network_introductions\s+to\s+authenticated/i,
    )
  })
})

describe('Network P0-P1 release hardening', () => {
  const migration = readFileSync(
    'supabase/migrations/20260828130000_network_command_p0_p1_release_hardening.sql',
    'utf8',
  )
  const requestRoute = readFileSync('app/api/network/introduction-requests/route.ts', 'utf8')
  const advanceRoute = readFileSync('app/api/network/introduction-requests/[id]/route.ts', 'utf8')
  const missionRoute = readFileSync('app/api/network/missions/route.ts', 'utf8')
  const lifecycleUi = readFileSync('components/network/NetworkIntroductionLifecycle.tsx', 'utf8')
  const networkSection = readFileSync('components/dashboard/mobile-command/sections/NetworkCommandSection.tsx', 'utf8')
  const supabaseEnv = readFileSync('lib/supabase/env.ts', 'utf8')

  it('creates introduction + requested audit event in one authenticated definer RPC', () => {
    expect(migration).toMatch(/create or replace function api\.hv_network_request_introduction/i)
    expect(migration).toMatch(/security definer/i)
    expect(migration).toContain('actor_user_id uuid := auth.uid()')
    expect(migration).toContain('public.hv_network_active_workspace_member(p_workspace_id)')
    expect(migration).toContain("raise exception 'NETWORK_MISSION_WORKSPACE_MISMATCH'")
    expect(migration).toContain("raise exception 'NETWORK_INTRODUCTION_TARGET_NOT_FOUND'")
    expect(migration).toContain("raise exception 'NETWORK_INTRODUCTION_TARGET_MISMATCH'")
    expect(migration).toContain('insert into public.network_introductions')
    expect(migration).toContain('insert into public.network_introduction_events')
    expect(migration).toContain("'requested'")
    expect(migration).toContain("'review'")
  })

  it('removes direct authenticated introduction/event insertion and anonymous RPC execution', () => {
    expect(migration).toMatch(/revoke insert on table public\.network_introductions from authenticated/i)
    expect(migration).toMatch(/revoke insert on table public\.network_introduction_events from authenticated/i)
    expect(migration).toMatch(/revoke insert on api\.network_introductions from authenticated/i)
    expect(migration).toMatch(/revoke insert on api\.network_introduction_events from authenticated/i)
    expect(migration).toContain('drop policy if exists network_introductions_member_insert')
    expect(migration).toContain('drop policy if exists network_introduction_events_member_insert')
    expect(migration).toMatch(/revoke all on function api\.hv_network_request_introduction[\s\S]+from public, anon/i)
    expect(migration).toMatch(/grant execute on function api\.hv_network_request_introduction[\s\S]+to authenticated, service_role/i)
  })

  it('keeps P1 authoritative while exposing only an api-schema invoker transport', () => {
    expect(migration).toMatch(/create or replace function api\.hv_network_advance_introduction/i)
    expect(migration).toMatch(/security invoker/i)
    expect(migration).toContain('select public.hv_network_advance_introduction(')
    expect(migration).not.toContain('create or replace function public.hv_network_advance_introduction')
  })

  it('makes mission + requirement creation atomic', () => {
    expect(migration).toMatch(/create or replace function api\.hv_network_create_mission/i)
    expect(migration).toContain('insert into public.network_missions')
    expect(migration).toContain('insert into public.network_mission_requirements')
    expect(missionRoute).toContain(".rpc('hv_network_create_mission'")
    expect(missionRoute).not.toContain(".from('network_missions')\n    .insert")
    expect(missionRoute).not.toContain("status: 'archived'")
  })

  it('routes customer introduction creation only through the atomic RPC', () => {
    expect(requestRoute).toContain(".rpc('hv_network_request_introduction'")
    expect(requestRoute).not.toContain(".from('network_introductions')\n    .insert")
    expect(requestRoute).not.toContain(".from('network_introduction_events')\n    .insert")
  })

  it('keeps cross-workspace and audit-forgery defenses database-authoritative', () => {
    expect(migration).toContain('where m.id = p_mission_id')
    expect(migration).toContain('and m.workspace_id = p_workspace_id')
    expect(migration).toContain('l.resolution_status = \'resolved\'')
    expect(migration).toContain('and l.entity_id is distinct from p_target_entity_id')
    expect(migration).toContain('revoke insert on table public.network_introduction_events from authenticated')
    expect(migration).toContain('drop policy if exists network_introduction_events_member_insert')
  })

  it('wires actor-specific P1 transitions into the Network UI', () => {
    expect(advanceRoute).toContain(".rpc('hv_network_is_staff'")
    expect(advanceRoute).toContain('allowedIntroductionTransitions(existing.status, isStaff)')
    expect(advanceRoute).toContain(".rpc('hv_network_advance_introduction'")
    expect(lifecycleUi).toContain("method: 'PATCH'")
    expect(lifecycleUi).toContain('allowedTransitions')
    expect(lifecycleUi).toContain('transitionAuthority')
    expect(networkSection).toContain('<NetworkIntroductionLifecycle />')
  })

  it('documents the real Data API exposure model instead of relying on public being hidden', () => {
    expect(supabaseEnv).toContain('Production PostgREST currently exposes both `api` and `public`')
    expect(supabaseEnv).toContain('security must never depend on')
    expect(supabaseEnv).toContain('base-table grants and RLS remain authoritative')
  })
})
