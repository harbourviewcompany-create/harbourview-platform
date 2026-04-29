// POST /api/marketplace/inquire — buyer inquiry submission
// Aligned to live DB schema

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  let body: any;

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    body = await request.json();
  } else {
    const form = await request.formData();
    body = Object.fromEntries(form.entries());
  }

  const supabase = createAdminClient();

  const { error, data } = await supabase
    .from('marketplace_inquiries')
    .insert({
      listing_id: body.listing_id || null,
      message: body.message,
      contact_name: body.buyer_name || body.contact_name,
      contact_email: body.buyer_email || body.contact_email,
      contact_company: body.buyer_company || null,
      contact_phone: body.buyer_phone || null,
      status: 'received'
    })
    .select('id, status, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inquiry: data });
}
