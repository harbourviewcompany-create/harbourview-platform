import { NextResponse } from 'next/server'
import { getExpectedSupabaseProjectRef, getSupabaseEnvStatus } from '@/lib/supabase/env'

function getSafeSupabaseStatus() {
  try {
    const status = getSupabaseEnvStatus()

    return {
      configured: status.configured,
      projectRef: status.projectRef,
      missing: status.missing,
    }
  } catch (error) {
    return {
      configured: false,
      projectRef: getExpectedSupabaseProjectRef(),
      missing: [],
      error: error instanceof Error ? error.message : 'Unknown Supabase environment error',
    }
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'harbourview-public-site',
    timestamp: new Date().toISOString(),
    checks: {
      supabase: getSafeSupabaseStatus(),
    },
  })
}
