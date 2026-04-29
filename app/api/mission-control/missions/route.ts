import { NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, missions: [], fallback: true })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('mission_control_missions')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, missions: data })
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, fallback: true })
  }

  const body = await req.json()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('mission_control_missions')
    .upsert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, mission: data })
}
