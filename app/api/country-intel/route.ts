import { getCountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const iso2 = searchParams.get('iso2')?.trim().toUpperCase().replace(/[^A-Z]/g, '') ?? ''
  if (iso2.length < 2) {
    return NextResponse.json({ error: 'Missing iso2' }, { status: 400 })
  }
  const profile = await getCountryIntelProfile(iso2)
  if (!profile) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(profile, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
  })
}
