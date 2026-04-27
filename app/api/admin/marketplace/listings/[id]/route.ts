// app/api/admin/marketplace/listings/[id]/route.ts
// GET   — full listing + private metadata
// PATCH — update review status, visibility, featured, private metadata
// Admin only. Writes audit event on status transitions.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createServerClient } from '@/lib/supabase/server';
import { requireMarketplaceAdmin, unauthorizedResponse } from '@/lib/marketplace/admin-auth';
import { AdminListingUpdateSchema } from '@/lib/marketplace/schemas';
import { AUDIT_ACTIONS } from '@/lib/marketplace/types-admin';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireMarketplaceAdmin();
  if (!auth.authorized) return unauthorizedResponse(auth.reason);

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: listing, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  const { data: meta } = await supabase
    .from('marketplace_listing_metadata_private')
    .select('*')
    .eq('listing_id', id)
    .single();

  return NextResponse.json({ listing: { ...listing, private_meta: meta ?? null } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireMarketplaceAdmin();
  if (!auth.authorized) return unauthorizedResponse(auth.reason);

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = AdminListingUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const serviceClient = createServiceClient();

  // Get current state for audit diff
  const { data: current, error: fetchErr } = await serviceClient
    .from('marketplace_listings')
    .select('review_status, public_visibility, is_featured')
    .eq('id', id)
    .single();

  if (fetchErr || !current) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  const update: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };

  // Enforce visibility rules server-side based on status
  if (parsed.data.review_status === 'approved') {
    update.public_visibility = true;
  } else if (
    parsed.data.review_status === 'rejected' ||
    parsed.data.review_status === 'archived'
  ) {
    update.public_visibility = false;
  }

  const { data, error: updateErr } = await serviceClient
    .from('marketplace_listings')
    .update(update)
    .eq('id', id)
    .select('id, review_status, public_visibility, is_featured, updated_at')
    .single();

  if (updateErr || !data) {
    console.error('[admin/listings/[id] PATCH] Update error:', updateErr?.message);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  // Determine audit action
  let auditAction: string = 'listing_updated';
  if (parsed.data.review_status === 'approved') auditAction = AUDIT_ACTIONS.LISTING_APPROVED;
  else if (parsed.data.review_status === 'rejected') auditAction = AUDIT_ACTIONS.LISTING_REJECTED;
  else if (parsed.data.review_status === 'archived') auditAction = AUDIT_ACTIONS.LISTING_ARCHIVED;
  else if (parsed.data.is_featured === true) auditAction = AUDIT_ACTIONS.LISTING_FEATURED;
  else if (parsed.data.is_featured === false) auditAction = AUDIT_ACTIONS.LISTING_UNFEATURED;

  // Write audit via user-authenticated client (exercises RLS on audit_events)
  const userClient = await createServerClient();
  const { error: auditErr } = await userClient.from('audit_events').insert({
    entity_type: 'marketplace_listings',
    entity_id: id,
    action: auditAction,
    actor_id: auth.userId,
    payload: { update: parsed.data, result: data },
  });

  if (auditErr) {
    console.error('[admin/listings/[id]] Audit write failed:', auditErr.message);
    return NextResponse.json(
      { error: 'Audit logging failed — action not completed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ listing: data });
}
