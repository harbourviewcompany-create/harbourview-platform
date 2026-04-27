// GET /api/marketplace — public listing directory
// Returns only approved, public-visible listings via safe view.
// NO private fields. NO service-role. anon-safe.

import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { PublicListing } from '@/lib/marketplace/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section');

  const supabase = await createServerClient();

  let query = supabase
    .from('marketplace_listings_public_view')
    .select('id, section, title, slug, description, price_amount, price_currency, location_country, is_featured, created_at')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (section) {
    query = query.eq('section', section);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[marketplace] GET error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }

  return NextResponse.json({ listings: (data ?? []) as PublicListing[] });
}
