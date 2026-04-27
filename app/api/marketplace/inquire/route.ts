// POST /api/marketplace/inquire — buyer inquiry submission
// Rate-limited. Validated. Requires authentication (THC-004 fix).
// Response never echoes buyer PII fields.

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { InquirySubmissionSchema } from '@/lib/marketplace/schemas';

const inquiryCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = inquiryCounts.get(ip);
  if (!record || record.resetAt < now) {
    inquiryCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many inquiries. Try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = InquirySubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const supabase = await createServerClient();

  // THC-004 FIX: Require authentication before touching DB.
  // Without this, anon users hit a DB RLS rejection and get a 500.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required to submit an inquiry' },
      { status: 401 }
    );
  }

  // Verify listing exists and is approved+public (queries safe view — no private fields)
  const { data: listing } = await supabase
    .from('marketplace_listings_public_view')
    .select('id')
    .eq('id', parsed.data.listing_id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found or not available' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('marketplace_inquiries')
    .insert({
      ...parsed.data,
      status: 'pending',
      created_by: user.id,
    })
    .select('id, status, created_at')
    .single();

  if (error) {
    console.error('[inquire] error:', error.message);
    return NextResponse.json({ error: 'Inquiry submission failed' }, { status: 500 });
  }

  // Return ONLY id, status, created_at — never echo buyer PII
  return NextResponse.json({ inquiry: data }, { status: 201 });
}
