import { NextResponse } from 'next/server'
import { getExpectedSupabaseHost, getExpectedSupabaseProjectRef, getSupabaseEnvStatus } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const status = getSupabaseEnvStatus()

    if (!status.configured) {
      return NextResponse.json(
        {
          ok: false,
          expectedProjectRef: getExpectedSupabaseProjectRef(),
          expectedHost: getExpectedSupabaseHost(),
          missing: status.missing,
          supabaseUrlHost: status.host,
          hasUrl: status.hasUrl,
          hasAnonKey: status.hasAnonKey,
          hasPublishableKey: status.hasPublishableKey,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      expectedProjectRef: getExpectedSupabaseProjectRef(),
      expectedHost: getExpectedSupabaseHost(),
      supabaseUrlHost: status.host,
      hasUrl: status.hasUrl,
      hasAnonKey: status.hasAnonKey,
      hasPublishableKey: status.hasPublishableKey,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        expectedProjectRef: getExpectedSupabaseProjectRef(),
        expectedHost: getExpectedSupabaseHost(),
        error: error instanceof Error ? error.message : 'Unknown Supabase configuration error',
      },
      { status: 500 }
    )
  }
}
