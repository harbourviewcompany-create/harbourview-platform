import { NextRequest, NextResponse } from 'next/server'
import { getNetworkCommandForCurrentUser } from '@/lib/network/server'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const command = await getNetworkCommandForCurrentUser({
    countryIso2: req.nextUrl.searchParams.get('country'),
    roleId: req.nextUrl.searchParams.get('role'),
  })
  if (!command) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const candidate = command.candidates.find(item => item.id === id)
  if (!candidate) return NextResponse.json({ error: 'Network record not found in the current authorized context.' }, { status: 404 })

  return NextResponse.json(
    { candidate },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
