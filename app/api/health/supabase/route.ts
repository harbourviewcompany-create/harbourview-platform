import { NextResponse } from 'next/server'
import { getExpectedSupabaseProjectRef, getSupabaseUrl } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseUrl = getSupabaseUrl()
    const expectedProjectRef = getExpectedSupabaseProjectRef()

    return NextResponse.json({
      ok: true,
      expectedProjectRef,
      supabaseUrlHost: new URL(supabaseUrl).host,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown Supabase environment error',
      },
      { status: 500 }
    )
  }
}
