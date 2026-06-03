import { NextResponse } from 'next/server'
import { dashboardPreferenceWhitelist, type DashboardClientPreferences } from '@/lib/dashboard/dashboardClientTypes'

const whitelist = new Set<string>(dashboardPreferenceWhitelist)
const validModes = new Set(['single_market', 'multi_market', 'not_sure'])

function isIso2(value: unknown) {
  return typeof value === 'string' && /^[A-Z]{2}$/.test(value.trim().toUpperCase())
}

function sanitizePreferences(input: unknown): DashboardClientPreferences {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  const result: DashboardClientPreferences = {}
  const record = input as Record<string, unknown>

  for (const [key, value] of Object.entries(record)) {
    if (!whitelist.has(key)) continue
    if (key === 'countryIso2' && isIso2(value)) result.countryIso2 = String(value).trim().toUpperCase()
    if (key === 'countries' && Array.isArray(value)) result.countries = value.filter(isIso2).map((entry) => String(entry).trim().toUpperCase())
    if (key === 'roleId' && typeof value === 'string') result.roleId = value as DashboardClientPreferences['roleId']
    if (key === 'intentId' && typeof value === 'string') result.intentId = value as DashboardClientPreferences['intentId']
    if (key === 'mode' && typeof value === 'string' && validModes.has(value)) result.mode = value as DashboardClientPreferences['mode']
    if (key === 'source' && value === 'globe_router') result.source = 'globe_router'
    if (key === 'layerId' && typeof value === 'string') result.layerId = value as DashboardClientPreferences['layerId']
    if (key === 'marketplaceTab' && typeof value === 'string') result.marketplaceTab = value
    if (key === 'notificationPanelOpen' && typeof value === 'boolean') result.notificationPanelOpen = value
  }

  return result
}

export async function PATCH(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  return NextResponse.json({ preferences: sanitizePreferences(payload) })
}
