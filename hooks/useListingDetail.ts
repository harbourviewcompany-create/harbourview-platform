'use client'

import { useEffect, useState } from 'react'
import { getSupabasePublicClientKey, getSupabaseUrl } from '@/lib/supabase/env'

export type ListingDetail = {
  id: string
  slug: string | null
  title: string
  description: string
  category: string
  subcategory: string | null
  marketplace_section: string
  product_type: string | null
  region: string
  condition: string | null
  location_country: string | null
  location_region: string | null
  price_amount: number | null
  price_currency: string
  price_display: string | null
  seller_type: string
  is_featured: boolean
  high_level_specs: Record<string, unknown>
  created_at: string
  average_rating: number | null
  review_count: number | null
}

type DetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; data: ListingDetail }
  | { status: 'error' }

const SELECT_COLS =
  'id,slug,title,description,category,subcategory,marketplace_section,product_type,region,condition,location_country,location_region,price_amount,price_currency,price_display,seller_type,is_featured,high_level_specs,created_at,average_rating,review_count'

const cache = new Map<string, ListingDetail>()

export function useListingDetail(listingId: string | null | undefined): DetailState {
  const [state, setState] = useState<DetailState>({ status: 'idle' })

  useEffect(() => {
    if (!listingId) { setState({ status: 'idle' }); return }

    const cached = cache.get(listingId)
    if (cached) { setState({ status: 'ok', data: cached }); return }

    let url = ''
    let key = ''
    try {
      url = getSupabaseUrl()
      key = getSupabasePublicClientKey()
    } catch {
      setState({ status: 'error' })
      return
    }

    setState({ status: 'loading' })
    const params = new URLSearchParams({
      select: SELECT_COLS,
      id: `eq.${listingId}`,
      limit: '1',
    })

    fetch(`${url.replace(/\/$/, '')}/rest/v1/marketplace_public_listings_v1?${params}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((rows: ListingDetail[]) => {
        const listing = rows[0]
        if (listing) {
          cache.set(listingId, listing)
          setState({ status: 'ok', data: listing })
        } else {
          setState({ status: 'error' })
        }
      })
      .catch(() => setState({ status: 'error' }))
  }, [listingId])

  return state
}
