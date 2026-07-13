import { createClient } from '@supabase/supabase-js'
import { NextResponse }  from 'next/server'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } },
  )
}

type Body = { corridorKey?: unknown; daysTaken?: unknown; role?: unknown }

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body

  const corridorKey = typeof body.corridorKey === 'string' ? body.corridorKey.trim() : ''
  const daysTaken   = typeof body.daysTaken   === 'number' ? Math.round(body.daysTaken) : NaN
  const role        = typeof body.role        === 'string' ? body.role.trim().slice(0, 80) : ''

  if (!corridorKey)           return NextResponse.json({ error: 'Missing corridorKey' }, { status: 400 })
  if (isNaN(daysTaken) || daysTaken < 1 || daysTaken > 999)
                               return NextResponse.json({ error: 'Invalid daysTaken' }, { status: 400 })

  const supabase = getDb()
  const { error } = await supabase.from('corridor_processing_times').insert({
    corridor_key:   corridorKey,
    days_taken:     daysTaken,
    submitter_role: role || null,
    verified:       false,
  })

  if (error) {
    console.error('[corridors/submit]', error)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
