// app/api/marketplace/suppliers/route.ts
// GET /api/marketplace/suppliers
// Public — returns verified suppliers only. Sanitized. No contact or admin fields.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { SuppliersQuerySchema } from '@/lib/marketplace/schemas';
import { toPublicSupplier } from '@/lib/marketplace/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const parsed = SuppliersQuerySchema.safeParse({
    featured: searchParams.get('featured') ?? undefined,
    page: searchParams.get('page') ?? 1,
    limit: searchParams.get('limit') ?? 20,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { featured, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const supabase = await createServerClient();

    // Public route always filters to verified only
    let query = supabase
      .from('marketplace_suppliers')
      .select(
        'id, company_name, slug, description, is_featured, created_at',
        { count: 'exact' }
      )
      .eq('verification_status', 'verified')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (featured === 'true') query = query.eq('is_featured', true);

    const { data, count, error } = await query;

    if (error) {
      console.error('[marketplace/suppliers] DB error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
    }

    return NextResponse.json({
      suppliers: (data ?? []).map(toPublicSupplier),
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err) {
    console.error('[marketplace/suppliers] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
