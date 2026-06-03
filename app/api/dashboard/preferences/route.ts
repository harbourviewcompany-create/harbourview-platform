import { NextResponse } from 'next/server'
import { dashboardPreferenceWhitelist, sanitizePreferencePatch } from '@/lib/dashboard/dashboardShared'

export async function PATCH(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json({ error: 'Preference patch must be an object.' }, { status: 400 })
  }

  const unknownFields = Object.keys(payload).filter(
    (field) => !dashboardPreferenceWhitelist.includes(field as (typeof dashboardPreferenceWhitelist)[number]),
  )

  if (unknownFields.length > 0) {
    return NextResponse.json({ error: 'Unsupported preference field.', fields: unknownFields }, { status: 400 })
  }

  return NextResponse.json({ preferences: sanitizePreferencePatch(payload) })
}
