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

// Independent, sourced price references from `market_metrics` — a live, per-country table
// used elsewhere on the dashboard. Surfaced here as a *secondary cross-check* next to the
// curated PRICE_BENCHMARKS (which stay primary): these are country-level figures, often a
// different channel (pharmacy/retail) than the wholesale benchmarks, so they are context,
// not a replacement. Public-safe columns only (all sourced/attributable market data).
export async function GET() {
  const supabase = getDb()
  const { data, error } = await supabase
    .from('market_metrics')
    .select('country_iso2,metric_name,metric_value,metric_unit,source_name,source_url,source_date')
    .or('metric_name.ilike.%price%,metric_name.ilike.%wholesale%,metric_name.ilike.%retail%')
    .order('source_date', { ascending: false })

  if (error) return NextResponse.json({ references: [], error: error.message }, { status: 500 })

  return NextResponse.json({ references: data ?? [] })
}
