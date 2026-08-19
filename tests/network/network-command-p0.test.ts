import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { evaluateNetworkFit, evaluateNetworkRequirement } from '@/lib/network/commandMatching'
import type { NetworkMissionDTO, NetworkSourceCandidate } from '@/lib/network/types'

function candidate(overrides: Partial<NetworkSourceCandidate> = {}): NetworkSourceCandidate {
  return {
    id: 'cannabis_operator:operator-1',
    entityId: null,
    sourceKind: 'cannabis_operator',
    sourceId: 'operator-1',
    kind: 'operator',
    name: 'Example Operator',
    subtitle: 'Importer',
    countryIso2: 'DE',
    jurisdictionLabel: 'Germany',
    capabilities: ['import', 'wholesale'],
    verificationStatus: 'verified',
    lastVerifiedAt: null,
    summary: null,
    availability: null,
    licences: [{
      licenceClass: 'Medical wholesale',
      issuingRegulator: 'Example regulator',
      authorizedActivities: ['import', 'wholesale'],
      status: 'active',
      gmpCertified: true,
      gacpCertified: null,
      facilityCity: null,
      facilityProvinceState: null,
      lastVerifiedAt: null,
    }],
    evidenceSummary: [],
    unknowns: [],
    warnings: [],
    ...overrides,
  }
}

function mission(requirements: NetworkMissionDTO['requirements']): NetworkMissionDTO {
  return {
    id: 'mission-1',
    name: 'German route',
    objective: 'Identify a qualified route into Germany.',
    status: 'active',
    countryIso2: 'DE',
    targetCountryIso2s: ['DE'],
    targetDate: null,
    confidentiality: 'workspace',
    requirements,
    createdAt: '2026-08-18T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z',
  }
}

const requirementBase = {
  description: null,
  hardRequirement: true,
  capabilityCode: null,
  licenceActivity: null,
  countryIso2: null,
  expectedValue: {},
  status: 'active',
  sortOrder: 0,
}

describe('Network Command deterministic matching', () => {
  it('uses explicit jurisdiction and licensed activity facts', () => {
    const subject = candidate()
    expect(evaluateNetworkRequirement(subject, {
      ...requirementBase,
      id: 'r1',
      requirementType: 'jurisdiction',
      label: 'Germany',
      countryIso2: 'DE',
    })).toBe('meets')
    expect(evaluateNetworkRequirement(subject, {
      ...requirementBase,
      id: 'r2',
      requirementType: 'licence_activity',
      label: 'Import activity',
      licenceActivity: 'import',
    })).toBe('meets')
  })

  it('returns unknown instead of inventing an unsupported capability', () => {
    expect(evaluateNetworkRequirement(candidate({ capabilities: [] }), {
      ...requirementBase,
      id: 'r1',
      requirementType: 'capability',
      label: 'Distribution capability',
      capabilityCode: 'distribution',
    })).toBe('unknown')
  })

  it('marks an explicit hard jurisdiction mismatch blocked', () => {
    const fit = evaluateNetworkFit(candidate({ countryIso2: 'CA' }), mission([{
      ...requirementBase,
      id: 'r1',
      requirementType: 'jurisdiction',
      label: 'Germany',
      countryIso2: 'DE',
    }]))
    expect(fit.verdict).toBe('blocked')
    expect(fit.blocked).toEqual(['Germany'])
  })

  it('distinguishes partial fit from false precision', () => {
    const fit = evaluateNetworkFit(candidate(), mission([
      { ...requirementBase, id: 'r1', requirementType: 'jurisdiction', label: 'Germany', countryIso2: 'DE' },
      { ...requirementBase, id: 'r2', requirementType: 'capability', label: 'Cold chain', capabilityCode: 'cold_chain', sortOrder: 1 },
    ]))
    expect(fit.verdict).toBe('partial')
    expect(fit.satisfiedCount).toBe(1)
    expect(fit.unknown).toEqual(['Cold chain'])
    expect(fit).not.toHaveProperty('score')
  })

  it('uses explicit GMP false as a blocker but missing GMP state as unknown', () => {
    const gmpRequirement = {
      ...requirementBase,
      id: 'gmp',
      requirementType: 'gmp_certified',
      label: 'GMP certified',
    }
    expect(evaluateNetworkRequirement(candidate({ licences: [{
      licenceClass: null,
      issuingRegulator: null,
      authorizedActivities: [],
      status: 'active',
      gmpCertified: false,
      gacpCertified: null,
      facilityCity: null,
      facilityProvinceState: null,
      lastVerifiedAt: null,
    }] }), gmpRequirement)).toBe('blocked')
    expect(evaluateNetworkRequirement(candidate({ licences: [] }), gmpRequirement)).toBe('unknown')
  })
})

describe('Network Command P0 database boundary', () => {
  const core = readFileSync('supabase/migrations/20260818133500_network_command_p0_core.sql', 'utf8')
  const security = readFileSync('supabase/migrations/20260818133600_network_command_p0_security.sql', 'utf8')
  const identity = readFileSync('supabase/migrations/20260818133700_network_command_p0_identity_backfill.sql', 'utf8')

  it('keeps entities as canonical identity and adds only a resolution bridge', () => {
    expect(core).toContain('references public.entities(id)')
    expect(core).toContain('create table public.network_source_entity_links')
    expect(core).not.toMatch(/create table public\.network_entities\b/i)
    expect(identity).toContain("'cannabis_operator'")
    expect(identity).toContain("'existing_bridge'")
  })

  it('requires active workspace membership for Network private objects', () => {
    expect(security).toContain("wm.status = 'active'")
    expect(security).toContain("w.status = 'active'")
    expect(security).toContain('hv_network_active_workspace_member')
  })

  it('keeps introduction advancement and interaction history controlled', () => {
    expect(security).toContain('grant select, insert on table public.network_introductions to authenticated')
    expect(security).toContain('grant select, insert on table public.network_interactions to authenticated')
    expect(security).not.toContain('grant select, insert, update, delete on table public.network_interactions to authenticated')
  })

  it('hardens workspace watch access to active memberships', () => {
    expect(security).toContain('create policy cc_watchlist_items_member_read')
    expect(security).toContain('public.hv_network_active_workspace_member(org_id)')
  })
})
