// app/api/marketplace/wanted/route.ts
// GET  /api/marketplace/wanted — public list of approved wanted requests
// POST /api/marketplace/wanted — submit a new wanted request (rate-limited)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { WantedRequestSubmissionSchema } from '@/lib/marketplace/schemas';
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/marketplace/rate-limit';
import { toPublicWantedRequest } from '@/lib/marketplace/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const offset = (page - 1) * limit;

  try {
    const supabase = await createServerClient();

    const { data, count, error } = await supabase
      .from('marketplace_wanted_requests')
      .select('id, title, description, category, budget_range, created_at', { count: 'exact' })
      .eq('review_status', 'approved')
      .eq('public_visibility', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[marketplace/wanted GET] DB error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch wanted requests' }, { status: 500 });
    }

    return NextResponse.json({
      wanted: (data ?? []).map(toPublicWantedRequest),
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err) {
    console.error('[marketplace/wanted GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`wanted:${ip}`, { maxRequests: 3, windowSeconds: 60 });

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rl.retryAfterSeconds) }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = WantedRequestSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const input = parsed.data;

  try {
    const supabase = await createServerClient();
    const slug = `wanted-${Math.random().toString(36).slice(2, 10)}`;

    const { error } = await supabase.from('marketplace_wanted_requests').insert({
      slug,
      title: input.title,
      description: input.description,
      category: input.category ?? null,
      budget_range: input.budget_range ?? null,
      review_status: 'pending',
      public_visibility: false,
    });

    if (error) {
      console.error('[marketplace/wanted POST] Insert error:', error.message);
      return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message: 'Your wanted request has been submitted for review.' },
      { status: 201 }
    );
  } catch (err) {
    console.error('[marketplace/wanted POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
