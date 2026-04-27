import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { redactBuyerRequest } from '@/lib/marketplace/redact'

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, context: Context) {
  const { id } = await context.params

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from('buyer_requests')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json({ request: redactBuyerRequest(data) })
  } catch (err) {
    console.error('[Wanted GET id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
