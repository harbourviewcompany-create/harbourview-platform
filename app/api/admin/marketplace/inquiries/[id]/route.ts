// app/api/admin/marketplace/inquiries/[id]/route.ts
// GET   — single inquiry full detail (buyer contact, message, internal note)
// PATCH — update status and internal note
// Admin only.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireMarketplaceAdmin, unauthorizedResponse } from '@/lib/marketplace/admin-auth';
import { AdminInquiryUpdateSchema } from '@/lib/marketplace/schemas';

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
    .from('marketplace_inquiries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
  }

  return NextResponse.json({ inquiry: data });
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

  const parsed = AdminInquiryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const supabase = createServiceClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.internal_note !== undefined) update.internal_note = parsed.data.internal_note;

  const { error } = await supabase
    .from('marketplace_inquiries')
    .update(update)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
