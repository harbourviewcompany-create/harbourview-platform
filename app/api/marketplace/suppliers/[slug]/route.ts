// app/api/marketplace/suppliers/[slug]/route.ts
// GET /api/marketplace/suppliers/[slug]
// Public — single verified supplier profile. Sanitized.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { toPublicSupplier } from '@/lib/marketplace/types';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('marketplace_suppliers')
      .select('id, company_name, slug, description, is_featured, created_at')
      .eq('slug', slug)
      .eq('verification_status', 'verified')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ supplier: toPublicSupplier(data) });
  } catch (err) {
    console.error('[marketplace/suppliers/[slug]] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
