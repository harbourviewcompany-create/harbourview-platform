import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { createIaCounterparty } from '@/lib/intelligence-automation/db'

const VALID_ROLES = [
  'buyer', 'seller', 'importer', 'distributor', 'supplier', 'consultant',
  'equipment_vendor', 'packaging_supplier', 'logistics_provider', 'market_access_partner',
] as const

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth()

    const body = await request.json()
    const { name, role, markets, categories, needsProfile, supplyProfile, notes } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `role must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 },
      )
    }
    if (!Array.isArray(markets) || markets.length === 0) {
      return NextResponse.json({ error: 'markets must be a non-empty array' }, { status: 400 })
    }
    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ error: 'categories must be a non-empty array' }, { status: 400 })
    }

    const result = await createIaCounterparty({
      name,
      role,
      markets,
      categories,
      needsProfile: needsProfile ?? undefined,
      supplyProfile: supplyProfile ?? undefined,
      notes: notes ?? undefined,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
