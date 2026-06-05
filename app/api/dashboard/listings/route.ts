import { NextRequest, NextResponse } from 'next/server'
import { getPublicListingsByCategory, getPublicListings } from '@/lib/server/listingsQuery'

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category') ?? ''
  const limit    = parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10)
  const listings = category
    ? await getPublicListingsByCategory(category)
    : await getPublicListings(limit)
  return NextResponse.json(listings)
}
