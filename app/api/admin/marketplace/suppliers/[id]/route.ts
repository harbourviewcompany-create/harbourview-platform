// app/api/admin/marketplace/suppliers/[id]/route.ts
// GET   — full supplier row including admin-only fields (contact, internal_notes)
// PATCH — update verification_status, featured, internal_notes
// Admin only. Audit event on verification transitions.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createServerClient } from '@/lib/supabase/server';
import { requireMarketplaceAdmin, unauthorizedResponse } from '@/lib/marketplace/admin-auth';
import { AdminSupplierUpdateSchema } from '@/lib/marketplace/schemas';
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
    .from('marketplace_suppliers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
  }

  return NextResponse.json({ supplier: data });
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

  const parsed = AdminSupplierUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const supabase = createServiceClient();

  const { data: current } = await supabase
    .from('marketplace_suppliers')
    .select('verification_status')
    .eq('id', id)
    .single();

  if (!current) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('marketplace_suppliers')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  // Audit on verification change
  if (
    parsed.data.verification_status &&
    parsed.data.verification_status !== current.verification_status
  ) {
    const auditAction =
      parsed.data.verification_status === 'verified'
        ? AUDIT_ACTIONS.SUPPLIER_VERIFIED
        : parsed.data.verification_status === 'suspended'
        ? AUDIT_ACTIONS.SUPPLIER_SUSPENDED
        : 'supplier_updated';

    const userClient = await createServerClient();
    await userClient.from('audit_events').insert({
      entity_type: 'marketplace_suppliers',
      entity_id: id,
      action: auditAction,
      actor_id: auth.userId,
      payload: { update: parsed.data },
    });
  }

  return NextResponse.json({ success: true });
}
