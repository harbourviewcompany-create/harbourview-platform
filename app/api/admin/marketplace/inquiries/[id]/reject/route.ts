import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { getAdminDataClient } from '@/lib/supabase/adminDataClient'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Props = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Props) {
  await requireAdminAuth()

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const client = getAdminDataClient()
  if (!client.ok) return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 })

  const res = await fetch(
    `${client.data.url}/rest/v1/marketplace_inquiries?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: client.data.serviceRoleKey,
        Authorization: `Bearer ${client.data.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ review_status: 'rejected' }),
      cache: 'no-store',
    }
  )

  if (!res.ok) return NextResponse.json({ error: 'Update failed' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
