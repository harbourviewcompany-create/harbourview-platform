import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveMarketCountryIso2 } from '@/lib/market/marketCode'

export const dynamic = 'force-dynamic'

const ALLOWED_HEATMAP_LAYERS = new Set(['opportunity', 'regulatory', 'activity', 'none'])

/**
 * The globe sends the market the operator actually selected, which may be a
 * subdivision (`US-KS`, `CA-ON`) rather than a country. The parent country is
 * persisted here while the subdivision remains in route/session context.
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

function normalizeUuidOrNull(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)
    ? normalized
    : undefined
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
      .select('country_iso2, role_id, heatmap_layer, active_workspace_id')
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
    const activeWorkspaceId = normalizeUuidOrNull(body.active_workspace_id)

    if (countryIso2 === undefined || roleId === undefined || heatmapLayer === undefined || activeWorkspaceId === undefined) {
      return NextResponse.json({ ok: false, error: 'Invalid dashboard preference payload.' }, { status: 400 })
    }

    if ('active_workspace_id' in body && activeWorkspaceId) {
      const [{ data: membership }, { data: workspace }] = await Promise.all([
        supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('workspace_id', activeWorkspaceId)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .from('workspaces')
          .select('id,status')
          .eq('id', activeWorkspaceId)
          .eq('status', 'active')
          .maybeSingle(),
      ])

      if (!membership || !workspace) {
        return NextResponse.json({ ok: false, error: 'Active organization membership and active workspace required.' }, { status: 403 })
      }
    }

    const payload: {
      user_id: string
      updated_at: string
      country_iso2?: string | null
      role_id?: string | null
      heatmap_layer?: string | null
      active_workspace_id?: string | null
    } = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    }

    if ('country_iso2' in body) payload.country_iso2 = countryIso2
    if ('role_id' in body) payload.role_id = roleId
    if ('heatmap_layer' in body) payload.heatmap_layer = heatmapLayer
    if ('active_workspace_id' in body) payload.active_workspace_id = activeWorkspaceId

    const { error } = await supabase
      .from('user_dashboard_preferences')
      .upsert(payload, { onConflict: 'user_id' })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
