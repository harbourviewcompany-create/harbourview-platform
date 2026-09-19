/**
 * Command Centre smoke — boot contracts + pipeline-health route surface.
 * Runs in CI without Supabase (structural / import-level checks).
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8')
}

describe('dashboard boot contracts', () => {
  it('exposes DashboardResponsiveShell server + client split', () => {
    expect(existsSync(join(root, 'components/dashboard/DashboardResponsiveShell.tsx'))).toBe(true)
    expect(existsSync(join(root, 'components/dashboard/DashboardResponsiveShellClient.tsx'))).toBe(true)
    const server = read('components/dashboard/DashboardResponsiveShell.tsx')
    expect(server).toContain('DashboardResponsiveShellClient')
    expect(server).toContain('initialIsMobile')
    const client = read('components/dashboard/DashboardResponsiveShellClient.tsx')
    expect(client).toMatch(/['"]use client['"]/)
    expect(client).toContain('DashboardResponsiveShellContent')
    expect(client).toContain('CommandCentre')
  })

  it('CommandCentre still routes briefing and signals pages', () => {
    const cc = read('components/dashboard/CommandCentre.tsx')
    expect(cc).toContain("case 'briefing'")
    expect(cc).toContain("case 'signals'")
    expect(cc).toContain("case 'marketplace'")
  })

  it('Briefing surfaces marketplace funnel + pipeline health hooks', () => {
    if (existsSync(join(root, 'components/dashboard/pages/BriefingRoomPage.tsx'))) {
      const br = read('components/dashboard/pages/BriefingRoomPage.tsx')
      expect(br).toContain('pipeline-health')
      expect(br).toContain('priorityActions')
      expect(br).toContain('MARKETPLACE FUNNEL')
    } else {
      const cc = read('components/dashboard/CommandCentre.tsx')
      expect(cc).toContain('MARKETPLACE FUNNEL')
    }
  })
})

describe('pipeline-health API contract', () => {
  it('route module exists and requires auth', () => {
    const rel = 'app/api/dashboard/pipeline-health/route.ts'
    expect(existsSync(join(root, rel))).toBe(true)
    const src = read(rel)
    expect(src).toContain('export async function GET')
    expect(src).toMatch(/Unauthorized|getUser/)
    expect(src).toContain('hv_intelligence_outcome_check')
  })
})

describe('signal provenance contract', () => {
  it('Signals page renders source attribution helpers', () => {
    const rel = 'components/dashboard/pages/SignalsPage.tsx'
    if (!existsSync(join(root, rel))) {
      const cc = read('components/dashboard/CommandCentre.tsx')
      expect(cc.length).toBeGreaterThan(1000)
      return
    }
    const src = read(rel)
    expect(src).toContain('signalProvenance')
    expect(src).toContain('sourceLabel')
    expect(src).toMatch(/Source:/)
  })
})


describe('role defaults + pipeline SLO modules', () => {
  it('exposes role command defaults', () => {
    const rel = 'lib/dashboard/roleCommandDefaults.ts'
    expect(existsSync(join(root, rel))).toBe(true)
    const src = read(rel)
    expect(src).toContain('resolveCommandHome')
    expect(src).toContain('ROLE_COMMAND_DEFAULTS')
    expect(src).toContain('Importer')
    expect(src).toContain('Compliance')
  })

  it('exposes pipeline SLO thresholds', () => {
    const rel = 'lib/dashboard/pipelineSlo.ts'
    expect(existsSync(join(root, rel))).toBe(true)
    const src = read(rel)
    expect(src).toContain('PIPELINE_SLO')
    expect(src).toContain('evaluateFeedSlo')
    expect(src).toContain('combinePipelineStatus')
  })
})


describe('marketplace funnel + coverage + briefing actions', () => {
  it('exposes marketplace funnel metrics module and API', () => {
    expect(existsSync(join(root, 'lib/dashboard/marketplaceFunnelMetrics.ts'))).toBe(true)
    expect(existsSync(join(root, 'app/api/dashboard/marketplace-funnel/route.ts'))).toBe(true)
    const api = read('app/api/dashboard/marketplace-funnel/route.ts')
    expect(api).toMatch(/Unauthorized|getUser/)
    expect(api).toContain('buildMarketplaceFunnelMetrics')
  })

  it('exposes coverage map and briefing actions builders', () => {
    expect(existsSync(join(root, 'lib/dashboard/coverageMap.ts'))).toBe(true)
    expect(existsSync(join(root, 'lib/dashboard/briefingActions.ts'))).toBe(true)
    const actions = read('lib/dashboard/briefingActions.ts')
    expect(actions).toContain('buildBriefingActions')
    expect(actions).toContain('deadlineLabel')
  })
})
