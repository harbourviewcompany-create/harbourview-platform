import { NextRequest, NextResponse } from 'next/server'
import { getCountryStatusBar } from '@/lib/dashboard/dashboardServerData'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const iso2 = req.nextUrl.searchParams.get('iso2') ?? 'DE'
  const bar = getCountryStatusBar(iso2)
  return NextResponse.json(bar)
}
