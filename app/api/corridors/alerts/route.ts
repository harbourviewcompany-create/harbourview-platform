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

const SEVERITIES = new Set(['major', 'minor', 'watch'])

// Cross-corridor regulatory-alert feed. Unlike /api/corridors/data (single corridor,
// fetched on row-expand), this surfaces the most recent alerts across every corridor so
// the dashboard can show them as a standing feed. Public-safe columns only.
export async function GET(request: Request) {
  const url = new URL(request.url)

  const limitRaw = parseInt(url.searchParams.get('limit') ?? '20', 10)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20

  const severity = url.searchParams.get('severity')?.toLowerCase() ?? ''
  const corridorKey = url.searchParams.get('key') ?? ''

  const supabase = getDb()
  let query = supabase
    .from('corridor_regulatory_alerts')
    .select('id,corridor_key,alert_date,severity,summary,detail,source')
    .order('alert_date', { ascending: false })
    .limit(limit)

  if (severity && SEVERITIES.has(severity)) query = query.eq('severity', severity)
  if (corridorKey) query = query.eq('corridor_key', corridorKey)

  const { data, error } = await query
  if (error) return NextResponse.json({ alerts: [], error: error.message }, { status: 500 })

  return NextResponse.json({ alerts: data ?? [] })
}
