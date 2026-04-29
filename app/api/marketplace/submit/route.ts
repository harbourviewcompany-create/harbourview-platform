// POST /api/marketplace/submit — listing or wanted request submission
// Now supports BOTH JSON and browser form submissions.
// Writes use admin client to bypass RLS safely after validation.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function normalizeBody(body: any) {
  return {
    ...body,
    price_amount: body.price_amount ? Number(body.price_amount) : null,
  };
}

function mapSectionToCategory(section: string) {
  switch (section) {
    case 'equipment': return 'new_products';
    case 'surplus_inventory': return 'used_surplus';
    case 'packaging': return 'new_products';
    case 'services': return 'services';
    case 'introductions': return 'business_opportunities';
    default: return 'new_products';
  }
}

export async function POST(request: Request) {
  let raw: any;

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    raw = await request.json();
  } else {
    const form = await request.formData();
    raw = Object.fromEntries(form.entries());
  }

  const body = normalizeBody(raw);

  const isWanted = body.type === 'wanted';

  const supabase = createAdminClient();

  if (isWanted) {
    const { error, data } = await supabase
      .from('buyer_requests')
      .insert({
        category: 'wanted_requests',
        title: body.title,
        description: body.description,
        product_type: body.category || body.title,
        region: 'global',
        buyer_type: 'other',
        requirements: {},
        budget_range: body.budget_range || null,
        public_visibility: false,
        status: 'pending_review'
      })
      .select('id, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ submission: data });
  }

  const slugBase = String(body.title).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const slug = `${slugBase}-${Date.now()}`;

  const { error, data } = await supabase
    .from('listings')
    .insert({
      marketplace_section: body.section,
      category: mapSectionToCategory(body.section),
      title: body.title,
      description: body.description,
      product_type: body.title,
      region: 'global',
      seller_type: 'other',
      high_level_specs: {},
      slug,
      price_amount: body.price_amount || null,
      price_currency: body.price_currency || 'USD',
      location_country: body.location_country || null,
      public_visibility: false,
      status: 'pending_review'
    })
    .select('id, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submission: data });
}
