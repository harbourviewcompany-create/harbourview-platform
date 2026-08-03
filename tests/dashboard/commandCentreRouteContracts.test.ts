import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

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

  it('renders custom modules into the canonical shell main regions instead of a standalone frame', () => {
    const source = read('components/dashboard/CommandCentreIntegrationGateway.tsx')
    expect(source).toContain("const selector = isMobile ? '.hvm-main' : '.cc-main'")
    expect(source).toContain('createPortal(')
    expect(source).toContain('data-command-centre-shell=')
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
    for (const route of [
      '/signals',
      '/intelligence',
      '/genetics',
      '/network',
      '/network/clinical-education',
      '/opportunities',
      '/reviewed-connections',
      '/professionals',
      '/assessments',
      '/compliance',
      '/education',
      '/marketplace/sell',
      '/marketplace/intake',
      '/marketplace/financing',
      '/marketplace/my-listings',
    ]) {
      expect(source).toContain(`'${route}'`)
    }
    expect(source).toContain("url.searchParams.set('focus', target.focus)")
  })

  it('keeps personal briefing data behind authentication and entitlement checks', () => {
    const source = read('app/api/dashboard/personal-briefings/route.ts')
    expect(source).toContain('if (!user)')
    expect(source).toContain("checkFeatureAccess({ app_metadata: user.app_metadata }, 'watchlist')")
    expect(source).toContain('status: 403')
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
    ]) {
      expect(source).toContain(`function ${moduleName}`)
    }
  })
})
