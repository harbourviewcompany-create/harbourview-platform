import { NextResponse } from 'next/server'
import { getExpectedSupabaseProjectRef, getSupabaseEnvStatus } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const status = getSupabaseEnvStatus()
    const host = status.url ? new URL(status.url).hostname : null

    if (!status.configured) {
      return NextResponse.json(
        {
          ok: false,
          expectedProjectRef: getExpectedSupabaseProjectRef(),
          missing: status.missing,
          supabaseUrlHost: host,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      expectedProjectRef: getExpectedSupabaseProjectRef(),
      supabaseUrlHost: host,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        expectedProjectRef: getExpectedSupabaseProjectRef(),
        error: error instanceof Error ? error.message : 'Unknown Supabase configuration error',
      },
      { status: 500 }
    )
  }
}
