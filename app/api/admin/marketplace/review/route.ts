// app/api/admin/marketplace/review/route.ts
// GET /api/admin/marketplace/review
// Admin only — pending submissions queue across listings, wanted requests, suppliers.
// Uses service client to bypass RLS. Admin auth verified first.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireMarketplaceAdmin, unauthorizedResponse } from '@/lib/marketplace/admin-auth';
import { AdminReviewQueueQuerySchema } from '@/lib/marketplace/schemas';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireMarketplaceAdmin();
  if (!auth.authorized) return unauthorizedResponse(auth.reason);

  const { searchParams } = new URL(request.url);
  const parsed = AdminReviewQueueQuerySchema.safeParse({
    status: searchParams.get('status') ?? undefined,
    entity_type: searchParams.get('entity_type') ?? undefined,
    page: searchParams.get('page') ?? 1,
    limit: searchParams.get('limit') ?? 50,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status, entity_type, page, limit } = parsed.data;
  const offset = (page - 1) * limit;
  const supabase = createServiceClient();
  const results: Record<string, unknown[]> = {};

  if (!entity_type || entity_type === 'listing') {
    let q = supabase
      .from('marketplace_listings')
      .select(
        'id, slug, section, title, review_status, public_visibility, is_featured, created_at'
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (status) q = q.eq('review_status', status);
    else q = q.eq('review_status', 'pending');
    const { data } = await q;
    results.listings = data ?? [];
  }

  if (!entity_type || entity_type === 'wanted') {
    let q = supabase
      .from('marketplace_wanted_requests')
      .select('id, title, review_status, public_visibility, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (status) q = q.eq('review_status', status);
    else q = q.eq('review_status', 'pending');
    const { data } = await q;
    results.wanted = data ?? [];
  }

  if (!entity_type || entity_type === 'supplier') {
    let q = supabase
      .from('marketplace_suppliers')
      .select('id, slug, company_name, verification_status, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    // For suppliers "pending" maps to verification_status = 'pending_review'
    const verificationFilter = !status || status === 'pending' ? 'pending_review' : status;
    q = q.eq('verification_status', verificationFilter);
    const { data } = await q;
    results.suppliers = data ?? [];
  }

  return NextResponse.json({ queue: results, page, limit });
}
