// Admin matches endpoint (create + list)

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function assertAdmin(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth || auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    throw new Error('Unauthorized');
  }
}

export async function GET(request: Request) {
  try {
    assertAdmin(request);

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ matches: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    assertAdmin(request);

    const body = await request.json();

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('matches')
      .insert({
        listing_id: body.listing_id || null,
        buyer_request_id: body.buyer_request_id || null,
        inquiry_id: body.inquiry_id || null,
        status: 'proposed'
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ match: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
