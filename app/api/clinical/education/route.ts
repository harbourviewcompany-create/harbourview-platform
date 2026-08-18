import { NextResponse } from 'next/server'
import { getClinicalEducationModules } from '@/lib/server/clinicalEducationQuery'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const modules = await getClinicalEducationModules()
    const publicModules = modules.filter(
      (m) => m.publicUseApproved || m.moduleStatus === 'Live',
    )
    return NextResponse.json(
      { state: publicModules.length ? 'loaded' : 'empty', modules: publicModules },
      { headers: { 'Cache-Control': 'private, max-age=60' } },
    )
  } catch (e) {
    return NextResponse.json(
      {
        state: 'error',
        modules: [],
        error: e instanceof Error ? e.message : 'Education query failed',
      },
      { status: 503 },
    )
  }
}
