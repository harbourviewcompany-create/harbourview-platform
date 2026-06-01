import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const ALLOWED_HEATMAP_LAYERS = new Set(['opportunity', 'regulatory', 'activity', 'none'])

function normalizeIso2(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string') return undefined
  const iso2 = value.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(iso2) ? iso2 : undefined
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
