import 'server-only'

import {
  getPublicListingBySlug,
  getPublicListingsByCategoryFiltered,
  type PublicListing,
} from '@/lib/server/listingsQuery'
import { matchesTradingCategory } from '@/lib/marketplace/tradingMarketplace'

export type TradingBoardFilters = {
  category?: string
  search?: string
  country?: string
  page?: number
  pageSize?: number
}

export type TradingBoardPage = {
  rows: PublicListing[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  countries: string[]
}

const MAX_CATEGORY_ROWS = 250

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

export async function getTradingBoardPage(filters: TradingBoardFilters = {}): Promise<TradingBoardPage> {
  const [inventory, services] = await Promise.all([
    getPublicListingsByCategoryFiltered('cannabis_inventory', {}, MAX_CATEGORY_ROWS),
    getPublicListingsByCategoryFiltered('services', {}, MAX_CATEGORY_ROWS),
  ])

  const category = filters.category?.trim() || 'all'
  const search = normalize(filters.search)
  const country = normalize(filters.country)

  const allRows = [...inventory, ...services]
  const countries = Array.from(
    new Set(allRows.map((row) => row.location_country?.trim()).filter((value): value is string => Boolean(value))),
  ).sort((a, b) => a.localeCompare(b))

  const filtered = allRows.filter((row) => {
    if (!matchesTradingCategory(category, row)) return false
    if (country && normalize(row.location_country) !== country) return false
    if (search) {
      const specsText = Object.entries(row.high_level_specs ?? {})
        .filter(([key, value]) => !key.toLowerCase().includes('url') && typeof value === 'string')
        .map(([, value]) => value)
        .join(' ')
      const haystack = `${row.title} ${row.description} ${row.product_type ?? ''} ${row.location_country ?? ''} ${specsText}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })

  const pageSize = Math.min(Math.max(filters.pageSize ?? 24, 6), 48)
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(filters.page ?? 1, 1), totalPages)
  const offset = (page - 1) * pageSize

  return {
    rows: filtered.slice(offset, offset + pageSize),
    page,
    pageSize,
    total,
    totalPages,
    countries,
  }
}

export async function getTradingListingBySlug(slug: string): Promise<PublicListing | null> {
  const listing = await getPublicListingBySlug(slug)
  if (!listing) return null
  if (listing.category !== 'cannabis_inventory' && listing.category !== 'services') return null
  return listing
}
