import { NextResponse } from 'next/server'
import { getCommandCentreReadinessSummary } from '@/lib/platform/commandCentreRegistry'
import { getSupabaseEnvStatus } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checkedAt = new Date().toISOString()

  try {
    const registry = getCommandCentreReadinessSummary()
    const supabase = getSupabaseEnvStatus()
    const ready = registry.totalModules === 32 && supabase.configured && !supabase.invalidPublicClientKey

    return NextResponse.json(
      {
        status: ready ? 'ready' : 'degraded',
        checkedAt,
        commandCentre: {
          totalModules: registry.totalModules,
          launchCriticalModules: registry.launchCriticalModules,
          uniqueDesktopPages: registry.uniqueDesktopPages,
          mobileModuleDestinations: registry.mobileSections,
          routePolicies: registry.routePolicies,
        },
        dependencies: {
          supabase: supabase.configured ? 'configured' : 'misconfigured',
          expectedProject: supabase.urlUsesExpectedProject || supabase.usesExplicitLocalSupabase,
        },
      },
      {
        status: ready ? 200 : 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    )
  } catch (error) {
    console.error('[command-centre-health]', {
      code: error instanceof Error ? error.name : 'HEALTH_CHECK_FAILED',
    })

    return NextResponse.json(
      {
        status: 'unavailable',
        checkedAt,
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    )
  }
}
