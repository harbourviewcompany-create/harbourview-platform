// GET /api/marketplace/[slug] — single listing detail
// Returns only approved public listing. No private fields.

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { PublicListing } from '@/lib/marketplace/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('marketplace_listings_public_view')
    .select('id, section, title, slug, description, price_amount, price_currency, location_country, is_featured, created_at')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  return NextResponse.json({ listing: data as PublicListing });
}
