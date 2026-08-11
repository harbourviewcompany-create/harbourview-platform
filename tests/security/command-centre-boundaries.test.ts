import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  COMMAND_CENTRE_ACTIVE_REDIRECTS,
  COMMAND_CENTRE_MODULE_REGISTRY,
  COMMAND_CENTRE_PUBLIC_EXCEPTIONS,
  COMMAND_CENTRE_ROUTE_REGISTRY,
} from '@/lib/platform/commandCentreRegistry'

const root = process.cwd()

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

const clientFiles = [
  'components/dashboard/DashboardResponsiveShell.tsx',
  'components/dashboard/MobileCommandCentreRebuild.tsx',
  'components/dashboard/CommandCentreModuleRail.tsx',
  'components/dashboard/mobile-command/useMobileCommandModel.ts',
  'components/dashboard/mobile-command/WorkspacePanels.tsx',
  'components/dashboard/mobile-command/sections/CoreSections.tsx',
  'components/dashboard/mobile-command/sections/MarketplaceSections.tsx',
  'components/dashboard/mobile-command/sections/DomainSections.tsx',
  'components/dashboard/mobile-command/sections/IntelligenceSections.tsx',
  'components/dashboard/mobile-command/sections/OperationsSections.tsx',
]

const forbiddenPublicFields = [
  'sourceUrl',
  'sourceName',
  'provenanceSummary',
  'sourceEvidence',
  'internalReviewNotes',
  'reviewedBy',
  'lastReviewedAt',
  'nextReviewDueAt',
  'sellerAuthorizationStatus',
]

describe('Command Centre access and leakage boundaries', () => {
  it('keeps service-role configuration out of every client Command Centre module', () => {
    for (const relativePath of clientFiles) {
      const source = read(relativePath)
      expect(source, relativePath).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
      expect(source, relativePath).not.toContain('createServiceRoleClient')
      expect(source, relativePath).not.toContain('service_role')
    }
  })

  it('does not introduce private provenance fields into new public/mobile surfaces', () => {
    const publicSurfaceSource = [
      read('components/dashboard/CommandCentreModuleRail.tsx'),
      read('components/dashboard/CommandCentreDataBoundary.tsx'),
      read('components/dashboard/MobileCommandCentreRebuild.tsx'),
      read('components/dashboard/mobile-command/sections/MarketplaceSections.tsx'),
    ].join('\n')

    for (const field of forbiddenPublicFields) {
      expect(publicSurfaceSource).not.toContain(field)
    }
  })

  it('activates only explicitly approved redirects', () => {
    expect(COMMAND_CENTRE_ACTIVE_REDIRECTS).toEqual([
      {
        source: '/commercial-intelligence',
        destination: '/intelligence',
        permanent: false,
      },
      {
        source: '/intelligence/counterparty-intelligence',
        destination: '/dashboard?page=evidence',
        permanent: false,
      },
      {
        source: '/marketplace/sell',
        destination: '/dashboard?page=marketplace&section=supply&marketView=cannabis&tool=supply-intake',
        permanent: false,
      },
      {
        source: '/marketplace/wanted',
        destination: '/dashboard?page=marketplace&section=marketplace&marketView=wanted&tool=wanted-intake',
        permanent: false,
      },
      {
        source: '/marketplace/financing',
        destination: '/dashboard?page=trade-calc&section=financing&tool=financing-intake',
        permanent: false,
      },
    ])

    const inactivePolicies = COMMAND_CENTRE_ROUTE_REGISTRY.filter(route => route.mode !== 'redirect-now')
    expect(inactivePolicies.length).toBeGreaterThan(0)
    expect(inactivePolicies.every(route => !COMMAND_CENTRE_ACTIVE_REDIRECTS.some(active => active.source === route.source))).toBe(true)
  })

  it('preserves public auth legal and accessibility entry routes', () => {
    expect(COMMAND_CENTRE_PUBLIC_EXCEPTIONS).toEqual(expect.arrayContaining([
      '/',
      '/login',
      '/forgot-password',
      '/reset-password',
      '/auth/callback',
      '/legal/privacy',
      '/legal/terms',
      '/accessibility',
    ]))
  })

  it('keeps all 32 modules inside one dashboard routing contract', () => {
    expect(COMMAND_CENTRE_MODULE_REGISTRY).toHaveLength(32)
    expect(COMMAND_CENTRE_MODULE_REGISTRY.every(module => module.desktopPage && module.mobileSection)).toBe(true)
  })
})