// app/api/marketplace/listings/[slug]/route.ts
// GET /api/marketplace/listings/[slug]
// Public — single listing detail. Only approved + visible. Sanitized.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { toPublicListing } from '@/lib/marketplace/types';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('marketplace_listings')
      .select(
        'id, section, title, slug, description, price_amount, price_currency, location_country, is_featured, created_at'
      )
      .eq('slug', slug)
      .eq('review_status', 'approved')
      .eq('public_visibility', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json({ listing: toPublicListing(data) });
  } catch (err) {
    console.error('[marketplace/listings/[slug]] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
