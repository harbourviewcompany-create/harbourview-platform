// app/api/marketplace/listings/route.ts
// GET /api/marketplace/listings
// Public — approved + visible listings with pagination and section/featured/location filters.
// Sanitized: only PublicListing fields returned. No private data.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ListingsQuerySchema } from '@/lib/marketplace/schemas';
import { toPublicListing } from '@/lib/marketplace/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const parsed = ListingsQuerySchema.safeParse({
    section: searchParams.get('section') ?? undefined,
    featured: searchParams.get('featured') ?? undefined,
    location: searchParams.get('location') ?? undefined,
    page: searchParams.get('page') ?? 1,
    limit: searchParams.get('limit') ?? 20,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { section, featured, location, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const supabase = await createServerClient();

    // Explicitly select only public fields
    let query = supabase
      .from('marketplace_listings')
      .select(
        'id, section, title, slug, description, price_amount, price_currency, location_country, is_featured, created_at',
        { count: 'exact' }
      )
      .eq('review_status', 'approved')
      .eq('public_visibility', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (section) query = query.eq('section', section);
    if (featured === 'true') query = query.eq('is_featured', true);
    if (location) query = query.ilike('location_country', `%${location}%`);

    const { data, count, error } = await query;

    if (error) {
      console.error('[marketplace/listings] DB error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }

    return NextResponse.json({
      listings: (data ?? []).map(toPublicListing),
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err) {
    console.error('[marketplace/listings] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
