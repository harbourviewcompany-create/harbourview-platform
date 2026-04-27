// app/api/admin/marketplace/inquiries/route.ts
// GET /api/admin/marketplace/inquiries
// Admin only — full inquiry list with buyer contact and internal notes.
// Service client used to bypass RLS.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireMarketplaceAdmin, unauthorizedResponse } from '@/lib/marketplace/admin-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireMarketplaceAdmin();
  if (!auth.authorized) return unauthorizedResponse(auth.reason);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const listing_id = searchParams.get('listing_id') ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();

  let query = supabase
    .from('marketplace_inquiries')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (listing_id) query = query.eq('listing_id', listing_id);

  const { data, count, error } = await query;

  if (error) {
    console.error('[admin/marketplace/inquiries] DB error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }

  return NextResponse.json({
    inquiries: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}
