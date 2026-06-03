import { NextRequest, NextResponse } from 'next/server'
import { getPublicListingsByCategory } from '@/lib/server/listingsQuery'

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category') ?? ''
  if (!category) return NextResponse.json([])
  const listings = await getPublicListingsByCategory(category)
  return NextResponse.json(listings)
}
