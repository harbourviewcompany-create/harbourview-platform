import { NextRequest, NextResponse } from 'next/server'
import { getCountryStatusBar, getEmptyCountryStatusBar } from '@/lib/dashboard/dashboardServerData'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const rawIso2 = req.nextUrl.searchParams.get('iso2')
  const iso2 = rawIso2?.trim().toUpperCase()
  const bar = iso2 ? getCountryStatusBar(iso2) : getEmptyCountryStatusBar()
  return NextResponse.json(bar)
}
