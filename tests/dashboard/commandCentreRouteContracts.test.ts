import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { commandCentreTarget, isPublicAuthException } from '@/middleware'

const root = process.cwd()
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8')

describe('Command Centre route contracts', () => {
  it('wraps both canonical responsive shells in the integration gateway', () => {
    const source = read('components/dashboard/DashboardResponsiveShell.tsx')
    expect(source).toContain('CommandCentreIntegrationGateway')
    expect(source).toContain('<MobileCommandCentre {...props} />')
    expect(source).toContain('<CommandCentre {...props} />')
  })

  it('uses one shared module registry for desktop and mobile navigation', () => {
    const source = read('components/dashboard/CommandCentreIntegrationGateway.tsx')
    expect(source).toContain('COMMAND_CENTRE_MODULES.map')
    expect(source).toContain("mode: 'desktop' | 'mobile' | 'inline'")
    expect(source).toContain('ccig-nav--${mode}')
    expect(source).toContain("mode={isMobile ? 'mobile' : 'desktop'}")
    expect(source).toContain('mode="inline"')
  })

  it('renders custom modules and focused workflows into the canonical shell main regions', () => {
    const source = read('components/dashboard/CommandCentreIntegrationGateway.tsx')
    expect(source).toContain("const selector = isMobile ? '.hvm-main' : '.cc-main'")
    expect(source).toContain('createPortal(')
    expect(source).toContain('data-command-centre-shell=')
    expect(source).toContain('data-command-centre-action=')
    expect(source).not.toContain('function Frame(')
    expect(source).not.toContain('ccig-shell')
  })

  it('routes legacy authenticated standalone pages into the canonical shell', () => {
    expect(read('app/dashboard/my-briefings/page.tsx'))
      .toContain("redirect('/dashboard?page=digest&module=personal-briefings')")
    expect(read('app/dashboard/signals/search/page.tsx'))
      .toContain("redirect('/dashboard?page=signals&module=search')")
  })

  it('redirects authenticated product routes only after auth and tier checks', () => {
    const source = read('middleware.ts')
    const authIndex = source.indexOf('if (!user)')
    const tierIndex = source.indexOf('if (matchedTierPrefix)')
    const redirectIndex = source.indexOf('const target = commandCentreTarget')
    expect(authIndex).toBeGreaterThan(-1)
    expect(tierIndex).toBeGreaterThan(authIndex)
    expect(redirectIndex).toBeGreaterThan(tierIndex)
    expect(source).toContain("url.searchParams.set('focus', target.focus)")
    expect(source).toContain("loginUrl.searchParams.set('next', requestedDestination)")
  })

  it('resolves protected route outputs directly, including descendant focus', () => {
    const cases = [
      ['/dashboard/my-briefings', { page: 'digest', module: 'personal-briefings' }],
      ['/dashboard/signals/search', { page: 'signals', module: 'search' }],
      ['/marketplace/financing', { page: 'marketplace', module: 'financing' }],
      ['/marketplace/my-listings', { page: 'marketplace', action: 'my-listings' }],
      ['/marketplace/sell/equipment', { page: 'marketplace', action: 'sell', focus: 'equipment' }],
      ['/marketplace/intake/wanted', { page: 'marketplace', action: 'intake', focus: 'wanted' }],
      ['/signals/search/advanced', { page: 'signals', module: 'search', focus: 'advanced' }],
      ['/signals/regulatory', { page: 'signals', focus: 'regulatory' }],
      ['/network/clinical-education', { page: 'clinical' }],
      ['/network/operators', { page: 'experts', module: 'directories', focus: 'operators' }],
      ['/education/pharmacists', { page: 'education', focus: 'pharmacists' }],
    ] as const

    for (const [pathname, expected] of cases) {
      expect(commandCentreTarget(pathname)).toMatchObject(expected)
    }
    expect(commandCentreTarget('/network/clinical-education/request')).toMatchObject({
      page: 'experts',
      module: 'directories',
      focus: 'clinical-education/request',
    })
  })

  it('allows only exact public exception paths', () => {
    expect(isPublicAuthException('/intelligence/watchlists')).toBe(true)
    expect(isPublicAuthException('/intelligence/watchlists/private')).toBe(false)
    expect(isPublicAuthException('/network/clinical-education/request')).toBe(true)
    expect(isPublicAuthException('/network/clinical-education/request/private')).toBe(false)
  })

  it('keeps personal briefing data behind authentication, entitlement checks and bounded generation caching', () => {
    const source = read('app/api/dashboard/personal-briefings/route.ts')
    expect(source).toContain('if (!user)')
    expect(source).toContain("checkFeatureAccess({ app_metadata: user.app_metadata }, 'watchlist')")
    expect(source).toContain('status: 403')
    const dataSource = read('lib/dashboard/personalBriefingsData.ts')
    expect(dataSource).toContain('PERSONAL_BRIEFING_CACHE_TTL_MS')
    expect(dataSource).toContain('personalBriefingFingerprint')
    expect(dataSource).toContain('getCachedPersonalBriefing(userId')
  })

  it('integrates all custom surfaces through the gateway', () => {
    const source = read('components/dashboard/CommandCentreIntegrationGateway.tsx')
    for (const moduleName of [
      'MarketModule',
      'SupplyModule',
      'FinancingModule',
      'DirectoriesModule',
      'PersonalBriefingsModule',
      'SearchModule',
      'TalentModule',
      'MarketplaceActionSurface',
    ]) {
      expect(source).toContain(`function ${moduleName}`)
    }
    expect(source).toContain('<DynamicMarketplaceIntakeForm')
    expect(source).toContain('<MySubmissionsPanel />')
    expect(source).toContain("type MarketplaceAction = 'sell' | 'intake' | 'my-listings'")
  })

  it('allows local Supabase only in explicit GitHub Actions loopback verification', () => {
    const envSource = read('lib/supabase/env.ts')
    const workflow = read('.github/workflows/command-centre-authenticated-visual.yml')
    expect(envSource).toContain("process.env.VERCEL_ENV === 'production'")
    expect(envSource).toContain("process.env.CI !== '1' || process.env.GITHUB_ACTIONS !== 'true'")
    expect(envSource).toContain("process.env.HARBOURVIEW_ALLOW_LOCAL_SUPABASE !== '1'")
    expect(envSource).toContain("parsed.protocol === 'http:'")
    expect(envSource).toContain('LOCAL_SUPABASE_HOSTS.has(parsed.hostname)')
    expect(workflow).toContain("HARBOURVIEW_ALLOW_LOCAL_SUPABASE: '1'")
  })
})
