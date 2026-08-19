import { NextRequest, NextResponse } from 'next/server'
import {
  deriveCorridorPlan,
  listTrackedCorridorPairs,
} from '@/lib/intelligence/workflowEngine'
import type { ProductClass } from '@/lib/intelligence/tradeCorridors'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ISO2 = /^[A-Z]{2}$/
const PRODUCTS = new Set<ProductClass | 'any'>([
  'any',
  'flower',
  'extract',
  'finished_product',
  'starting_material',
])

/**
 * Public-safe corridor execution plan.
 * Returns orientation-level merged playbooks + doc checklist + trust metadata.
 * Never includes operator identities or private commercial terms.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const origin = (searchParams.get('origin') ?? '').trim().toUpperCase()
  const destination = (searchParams.get('destination') ?? '').trim().toUpperCase()
  const productRaw = (searchParams.get('product') ?? 'any').trim().toLowerCase()
  const product = (PRODUCTS.has(productRaw as ProductClass | 'any')
    ? productRaw
    : 'any') as ProductClass | 'any'

  if (searchParams.get('list') === '1') {
    return NextResponse.json({
      corridors: listTrackedCorridorPairs(),
      products: Array.from(PRODUCTS),
    })
  }

  if (!ISO2.test(origin) || !ISO2.test(destination)) {
    return NextResponse.json(
      {
        error: 'origin and destination must be ISO2 country codes (e.g. origin=CA&destination=DE)',
        corridors: listTrackedCorridorPairs(),
      },
      { status: 400 },
    )
  }

  const plan = await deriveCorridorPlan(origin, destination, { productClass: product })
  if (!plan) {
    return NextResponse.json(
      {
        error:
          'No published playbooks available for this pair, or invalid product class for the tracked corridor.',
        origin,
        destination,
        product,
        hint: 'Try a tracked pair from ?list=1 (e.g. CA→DE) after playbooks are published for both sides.',
      },
      { status: 404 },
    )
  }

  return NextResponse.json({
    plan,
    meta: {
      generatedAt: new Date().toISOString(),
      surface: 'public_orientation',
    },
  })
}
