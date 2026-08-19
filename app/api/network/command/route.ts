import { NextRequest, NextResponse } from 'next/server'
import { getNetworkCommandForCurrentUser } from '@/lib/network/server'

export const dynamic = 'force-dynamic'

function countryFrom(req: NextRequest): string | null {
  const value = req.nextUrl.searchParams.get('country')?.trim().toUpperCase() ?? ''
  return /^[A-Z]{2}$/.test(value) ? value : null
}

export async function GET(req: NextRequest) {
  const command = await getNetworkCommandForCurrentUser({
    countryIso2: countryFrom(req),
    roleId: req.nextUrl.searchParams.get('role')?.trim() || null,
  })

  if (!command) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(
    { command },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
