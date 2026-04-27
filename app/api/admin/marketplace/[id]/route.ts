// PATCH /api/admin/marketplace/[id] — admin approve/reject/archive/feature
// Server-side only. Admin role verified. Audit event written on every action.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { AdminListingUpdateSchema } from '@/lib/marketplace/schemas';
import { AUDIT_ACTIONS } from '@/lib/marketplace/types-admin';

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('platform_role')
    .eq('id', user.id)
    .single();

  if (profile?.platform_role !== 'admin') return null;
  return user;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const admin = await verifyAdmin(supabase);

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = AdminListingUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const update: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };

  // Set public_visibility based on review_status
  if (parsed.data.review_status === 'approved') {
    update.public_visibility = true;
  } else if (parsed.data.review_status === 'rejected' || parsed.data.review_status === 'archived') {
    update.public_visibility = false;
  }

  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from('marketplace_listings')
    .update(update)
    .eq('id', id)
    .select('id, review_status, public_visibility, is_featured, updated_at')
    .single();

  if (error || !data) {
    console.error('[admin/marketplace] update error:', error?.message);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  // Determine audit action
  let auditAction: string = 'listing_updated';
  if (parsed.data.review_status === 'approved') auditAction = AUDIT_ACTIONS.LISTING_APPROVED;
  else if (parsed.data.review_status === 'rejected') auditAction = AUDIT_ACTIONS.LISTING_REJECTED;
  else if (parsed.data.review_status === 'archived') auditAction = AUDIT_ACTIONS.LISTING_ARCHIVED;
  else if (parsed.data.is_featured === true) auditAction = AUDIT_ACTIONS.LISTING_FEATURED;
  else if (parsed.data.is_featured === false) auditAction = AUDIT_ACTIONS.LISTING_UNFEATURED;

  // Write audit event (append-only — no update/delete on this table)
  await serviceClient.from('audit_events').insert({
    entity_type: 'marketplace_listings',
    entity_id: id,
    action: auditAction,
    actor_id: admin.id,
    payload: { update: parsed.data, result: data },
  });

  return NextResponse.json({ listing: data });
}
