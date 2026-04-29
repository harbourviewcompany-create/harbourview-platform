// Admin matches endpoint (create, list, update)

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MATCH_STATUSES = [
  'proposed',
  'disclosure_requested',
  'disclosure_approved',
  'introduced',
  'closed_won',
  'closed_lost',
] as const;

type MatchStatus = typeof MATCH_STATUSES[number];

function assertAdmin(req: Request) {
  const auth = req.headers.get('authorization');
  if (!process.env.ADMIN_SECRET) throw new Error('ADMIN_SECRET missing');
  if (!auth || auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    throw new Error('Unauthorized');
  }
}

function isMatchStatus(v: unknown): v is MatchStatus {
  return typeof v === 'string' && MATCH_STATUSES.includes(v as MatchStatus);
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
    return NextResponse.json({ matches: data ?? [] });
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
        status: 'proposed',
        monetization_path: body.monetization_path || null,
        success_fee_amount: body.success_fee_amount ? Number(body.success_fee_amount) : null,
        success_fee_currency: body.success_fee_currency || 'USD',
      })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ match: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    assertAdmin(request);
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'id required' }, { status: 422 });
    }

    const update: any = {};

    if (body.status) {
      if (!isMatchStatus(body.status)) {
        return NextResponse.json({ error: 'invalid status' }, { status: 422 });
      }
      update.status = body.status;
      if (body.status === 'introduced') update.introduced_at = new Date().toISOString();
      if (body.status === 'closed_won' || body.status === 'closed_lost') update.closed_at = new Date().toISOString();
    }

    if (body.success_fee_amount !== undefined) update.success_fee_amount = body.success_fee_amount;
    if (body.monetization_path !== undefined) update.monetization_path = body.monetization_path;

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('matches')
      .update(update)
      .eq('id', body.id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ match: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
