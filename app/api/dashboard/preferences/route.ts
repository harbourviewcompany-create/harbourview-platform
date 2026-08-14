import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveMarketCountryIso2 } from '@/lib/market/marketCode'

export const dynamic = 'force-dynamic'

const ALLOWED_HEATMAP_LAYERS = new Set(['opportunity', 'regulatory', 'activity', 'none'])

/**
 * The globe sends the market the operator actually selected, which may be a
 * subdivision (`US-KS`, `CA-ON`) rather than a country. This previously tested
 * `/^[A-Z]{2}$/` against the raw value, so every subdivision failed, the field
 * was dropped, and the stored country went null — after which the Command
 * Centre fell back to rendering Canada for a Kansas selection.
 *
 * A subdivision narrows the country, it does not replace it, so resolve to the
 * parent and store that. `user_dashboard_preferences` has no region column, so
 * the subdivision itself is not persisted here; it stays in the route's
 * `region` query parameter for in-session context.
 */
function normalizeIso2(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string') return undefined
  return resolveMarketCountryIso2(value) ?? undefined
}

function normalizeString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  return typeof value === 'string' ? value.trim() : undefined
}

function normalizeHeatmapLayer(value: unknown): string | null | undefined {
  const normalized = normalizeString(value)
  if (normalized === undefined || normalized === null) return normalized
  return ALLOWED_HEATMAP_LAYERS.has(normalized) ? normalized : undefined
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ preferences: null })

    const { data } = await supabase
      .from('user_dashboard_preferences')
      .select('country_iso2, role_id, heatmap_layer')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ preferences: data ?? null })
  } catch {
    return NextResponse.json({ preferences: null })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false }, { status: 401 })

    const body = await req.json() as Record<string, unknown>
    const countryIso2 = normalizeIso2(body.country_iso2)
    const roleId = normalizeString(body.role_id)
    const heatmapLayer = normalizeHeatmapLayer(body.heatmap_layer)

    if (countryIso2 === undefined || roleId === undefined || heatmapLayer === undefined) {
      return NextResponse.json({ ok: false, error: 'Invalid dashboard preference payload.' }, { status: 400 })
    }

    const payload: {
      user_id: string
      updated_at: string
      country_iso2?: string | null
      role_id?: string | null
      heatmap_layer?: string | null
    } = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    }

    if ('country_iso2' in body) payload.country_iso2 = countryIso2
    if ('role_id' in body) payload.role_id = roleId
    if ('heatmap_layer' in body) payload.heatmap_layer = heatmapLayer

    const { error } = await supabase
      .from('user_dashboard_preferences')
      .upsert(payload, { onConflict: 'user_id' })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
