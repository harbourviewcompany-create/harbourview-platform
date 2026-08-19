import { NextRequest, NextResponse } from 'next/server'
import {
  calcLandedCost,
  EXPORTER_ORIGINS,
  DESTINATION_MARKETS,
  FREIGHT_CORRIDORS,
  LANDED_PRODUCT_LABELS,
  type LandedProductType,
} from '@/components/dashboard/data/landedCostData'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ISO2 = /^[A-Z]{2}$/
const PRODUCTS = new Set<LandedProductType>([
  'flower-premium',
  'flower-standard',
  'oil',
  'biomass',
  'distillate',
])

/**
 * Public-safe orientation landed-cost estimate.
 * Uses published reference ranges only — not a quote or commercial offer.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  if (searchParams.get('meta') === '1') {
    return NextResponse.json({
      origins: EXPORTER_ORIGINS.map((o) => ({
        iso2: o.iso2,
        label: o.label,
        regulatoryBody: o.regulatoryBody,
      })),
      destinations: DESTINATION_MARKETS.map((d) => ({
        iso2: d.iso2,
        label: d.label,
        currency: d.currency,
        regulatoryBody: d.regulatoryBody,
      })),
      products: Object.entries(LANDED_PRODUCT_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      freightPairs: FREIGHT_CORRIDORS.map((c) => `${c.originIso2}-${c.destIso2}`),
      disclaimer:
        'Orientation-level reference ranges only. Not a commercial quote. Verify all fees and duties with licensed operators and competent authorities.',
    })
  }

  const origin = (searchParams.get('origin') ?? '').trim().toUpperCase()
  const destination = (searchParams.get('destination') ?? '').trim().toUpperCase()
  const productRaw = (searchParams.get('product') ?? 'flower-premium').trim().toLowerCase()
  const product = (PRODUCTS.has(productRaw as LandedProductType)
    ? productRaw
    : 'flower-premium') as LandedProductType
  const volumeRaw = Number(searchParams.get('volume') ?? '10')
  const volumeKg = Number.isFinite(volumeRaw) && volumeRaw > 0 ? Math.min(5000, volumeRaw) : 10

  if (!ISO2.test(origin) || !ISO2.test(destination)) {
    return NextResponse.json(
      {
        error: 'origin and destination must be ISO2 (e.g. origin=CA&destination=DE)',
        hint: 'Use ?meta=1 for available origins, destinations, and products.',
      },
      { status: 400 },
    )
  }

  const result = calcLandedCost(origin, destination, product, volumeKg)

  if (!result.available) {
    return NextResponse.json(
      {
        error: 'Product not typically exported from this origin, or origin/destination unknown in reference data.',
        origin,
        destination,
        product,
        volumeKg,
        corridorFound: result.corridorFound,
      },
      { status: 404 },
    )
  }

  return NextResponse.json({
    input: { origin, destination, product, volumeKg },
    result,
    labels: {
      product: LANDED_PRODUCT_LABELS[product],
      origin: EXPORTER_ORIGINS.find((o) => o.iso2 === origin)?.label ?? origin,
      destination: DESTINATION_MARKETS.find((d) => d.iso2 === destination)?.label ?? destination,
    },
    meta: {
      generatedAt: new Date().toISOString(),
      surface: 'public_orientation',
      currency: 'USD',
      disclaimer:
        'Orientation-level reference ranges only. Not a commercial quote. Freight, permits, and duties change; verify before acting.',
    },
  })
}
