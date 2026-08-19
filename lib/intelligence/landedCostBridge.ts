/**
 * Maps corridor product classes ↔ landed-cost product types and builds public links.
 * Client-safe — no server-only imports.
 */

import type { ProductClass } from './tradeCorridors'
import type { LandedProductType } from '@/components/dashboard/data/landedCostData'

export function productClassToLanded(
  product: ProductClass | 'any' | string | undefined,
): LandedProductType {
  switch (product) {
    case 'flower':
      return 'flower-premium'
    case 'extract':
      return 'oil'
    case 'finished_product':
      return 'distillate'
    case 'starting_material':
      return 'biomass'
    default:
      return 'flower-premium'
  }
}

export function landedCostHref(opts: {
  origin: string
  destination: string
  product?: ProductClass | 'any' | string
  volumeKg?: number
}): string {
  const params = new URLSearchParams({
    origin: opts.origin.toUpperCase(),
    destination: opts.destination.toUpperCase(),
    product: productClassToLanded(opts.product),
  })
  if (opts.volumeKg && opts.volumeKg > 0) {
    params.set('volume', String(opts.volumeKg))
  }
  return `/intelligence/landed-cost?${params.toString()}`
}

export const LANDED_PRODUCT_OPTIONS: { value: LandedProductType; label: string }[] = [
  { value: 'flower-premium', label: 'Flower — Premium (EU-GMP)' },
  { value: 'flower-standard', label: 'Flower — Standard' },
  { value: 'oil', label: 'Cannabis oil / extract' },
  { value: 'biomass', label: 'Biomass / trim' },
  { value: 'distillate', label: 'Distillate (>85% THC)' },
]
