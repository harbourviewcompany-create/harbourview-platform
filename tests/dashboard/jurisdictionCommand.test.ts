import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  aggregateDependencyState,
  normalizeJurisdictionAccessState,
  requirementStatusToDependencyState,
} from '@/lib/dashboard/jurisdictionCommandContract'

describe('Jurisdiction Command access semantics', () => {
  it('does not collapse regulated or limited access into a generic available state', () => {
    expect(normalizeJurisdictionAccessState('Active')).toBe('available')
    expect(normalizeJurisdictionAccessState('Regulated')).toBe('conditional')
    expect(normalizeJurisdictionAccessState('Limited')).toBe('restricted')
    expect(normalizeJurisdictionAccessState('Prohibited')).toBe('unavailable')
    expect(normalizeJurisdictionAccessState(null)).toBe('unknown')
  })

  it('maps organization requirement evidence into explicit dependency states', () => {
    expect(requirementStatusToDependencyState('verified')).toBe('satisfied')
    expect(requirementStatusToDependencyState('waived')).toBe('satisfied')
    expect(requirementStatusToDependencyState('pending')).toBe('missing')
    expect(requirementStatusToDependencyState('rejected')).toBe('blocked')
    expect(requirementStatusToDependencyState('in_review')).toBe('unknown')
    expect(requirementStatusToDependencyState(null)).toBe('unknown')
    expect(requirementStatusToDependencyState(null, false)).toBe('not_applicable')
  })

  it('gives blockers priority over missing or unknown pathway evidence', () => {
    expect(aggregateDependencyState(['satisfied', 'satisfied'])).toBe('satisfied')
    expect(aggregateDependencyState(['satisfied', 'missing'])).toBe('missing')
    expect(aggregateDependencyState(['missing', 'blocked'])).toBe('blocked')
    expect(aggregateDependencyState(['satisfied', 'unknown'])).toBe('unknown')
  })
})

describe('Jurisdiction Command production contracts', () => {
  const root = process.cwd()
  const sectionSource = fs.readFileSync(
    path.join(root, 'components/dashboard/mobile-command/sections/JurisdictionCommandSection.tsx'),
    'utf8',
  )
  const routeSource = fs.readFileSync(
    path.join(root, 'app/api/dashboard/jurisdiction-command/route.ts'),
    'utf8',
  )
  const migrationSource = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260815222000_jurisdiction_command_canada_refresh.sql'),
    'utf8',
  )
  const visualWorkflowSource = fs.readFileSync(
    path.join(root, '.github/workflows/jurisdiction-command-visual.yml'),
    'utf8',
  )

  it('keeps All roles useful instead of returning the legacy dead-end pathway copy', () => {
    expect(sectionSource).toContain('Country-level access remains available in All roles')
    expect(sectionSource).not.toContain('No access pathway is available for this context')
    expect(sectionSource).toContain('Harbourview does not manufacture an arbitrary pathway')
  })

  it('uses active-workspace context for organization-specific dependency status', () => {
    expect(routeSource).toContain("resolveActiveWorkspace(user.id)")
    expect(routeSource).toContain(".eq('org_id', workspaceId)")
    expect(routeSource).toContain("workspaceState = active.stale ? 'stale'")
  })

  it('refuses to infer scoped trade routes when no reviewed trade-flow record matches', () => {
    expect(routeSource).toContain("routeCoverage = 'unsupported'")
    expect(routeSource).toContain('Harbourview will not infer a transaction route')
  })

  it('keeps claim-level conflict detection explicit as unsupported rather than fabricating certainty', () => {
    expect(routeSource).toContain("conflictAssessment: 'not-modeled'")
    expect(sectionSource).toContain('Conflict assessment')
    expect(sectionSource).toContain('Not modelled')
  })

  it('corrects the Canada ACMPR and legislative-review timeline in a forward migration', () => {
    expect(migrationSource).toContain('March 22, 2024')
    expect(migrationSource).toContain('Cannabis Regulations, not the former ACMPR framework')
    expect(migrationSource).toContain("last_reviewed_date = DATE '2026-08-15'")
    expect(migrationSource).not.toContain('review was completed in 2023')
  })

  it('keeps the Industrial Hemp future state source-grounded without inventing an exact date', () => {
    expect(visualWorkflowSource).toContain('Health Canada Forward Regulatory Plan 2026-2028')
    expect(visualWorkflowSource).toContain('expected in spring 2027')
    expect(visualWorkflowSource).toContain('null::date')
    expect(visualWorkflowSource).not.toContain('current_date + 90')
  })
})
