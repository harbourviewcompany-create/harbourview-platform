import { createClient } from '@supabase/supabase-js'
import { NextResponse }  from 'next/server'
import { getSupabasePublicClientKey, getSupabaseUrl, SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

function getDb() {
  return createClient(
    getSupabaseUrl(),
    getSupabasePublicClientKey(),
    { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } },
  )
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key') ?? ''
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

  const supabase = getDb()
  const [statsRes, alertsRes] = await Promise.all([
    supabase.rpc('get_corridor_stats', { p_key: key }),
    supabase
      .from('corridor_regulatory_alerts')
      .select('id,alert_date,severity,summary,detail,source')
      .eq('corridor_key', key)
      .order('alert_date', { ascending: false })
      .limit(10),
  ])

  return NextResponse.json({
    stats:  statsRes.data ?? {},
    alerts: alertsRes.data ?? [],
  })
}
