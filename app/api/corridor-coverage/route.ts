import { NextResponse } from 'next/server'
import { getCorridorCoverageReport } from '@/lib/intelligence/corridorCoverage'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Public transparency: which tracked corridors can derive an execution plan. */
export async function GET() {
  const report = await getCorridorCoverageReport()
  return NextResponse.json({
    report,
    meta: {
      generatedAt: new Date().toISOString(),
      surface: 'public_orientation',
    },
  })
}
