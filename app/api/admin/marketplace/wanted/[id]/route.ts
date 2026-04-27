// app/api/admin/marketplace/wanted/[id]/route.ts
// GET   — full wanted request row
// PATCH — update review status / public_visibility
// Admin only. Audit event on status transitions.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createServerClient } from '@/lib/supabase/server';
import { requireMarketplaceAdmin, unauthorizedResponse } from '@/lib/marketplace/admin-auth';
import { AdminWantedUpdateSchema } from '@/lib/marketplace/schemas';
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

  const { data, error } = await supabase
    .from('marketplace_wanted_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Wanted request not found' }, { status: 404 });
  }

  return NextResponse.json({ wanted: data });
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

  const parsed = AdminWantedUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const supabase = createServiceClient();

  const { data: current } = await supabase
    .from('marketplace_wanted_requests')
    .select('review_status')
    .eq('id', id)
    .single();

  if (!current) {
    return NextResponse.json({ error: 'Wanted request not found' }, { status: 404 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.review_status !== undefined) update.review_status = parsed.data.review_status;
  if (parsed.data.public_visibility !== undefined) update.public_visibility = parsed.data.public_visibility;

  const { error } = await supabase
    .from('marketplace_wanted_requests')
    .update(update)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  // Audit on status change
  if (parsed.data.review_status && parsed.data.review_status !== current.review_status) {
    const auditAction =
      parsed.data.review_status === 'approved'
        ? AUDIT_ACTIONS.WANTED_REQUEST_APPROVED
        : 'wanted_request_updated';

    const userClient = await createServerClient();
    await userClient.from('audit_events').insert({
      entity_type: 'marketplace_wanted_requests',
      entity_id: id,
      action: auditAction,
      actor_id: auth.userId,
      payload: { update: parsed.data },
    });
  }

  return NextResponse.json({ success: true });
}
