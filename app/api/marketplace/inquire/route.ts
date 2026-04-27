// POST /api/marketplace/inquire — buyer inquiry submission
// Rate-limited. Validated. Does not echo private fields in response.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  // Verify listing exists and is approved+public
  const supabase = await createClient();
  const { data: listing } = await supabase
    .from('marketplace_listings_public_view')
    .select('id')
    .eq('id', parsed.data.listing_id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found or not available' }, { status: 404 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('marketplace_inquiries')
    .insert({
      ...parsed.data,
      status: 'pending',
      created_by: user?.id ?? null,
    })
    .select('id, status, created_at')
    .single();

  if (error) {
    console.error('[inquire] error:', error.message);
    return NextResponse.json({ error: 'Inquiry submission failed' }, { status: 500 });
  }

  // Return ONLY id, status, created_at — never echo buyer fields
  return NextResponse.json({ inquiry: data }, { status: 201 });
}
