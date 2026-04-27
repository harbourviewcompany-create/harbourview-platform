// POST /api/marketplace/submit — listing or wanted request submission
// Rate-limited. Zod-validated. review_status and public_visibility locked server-side.

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ListingSubmissionSchema, WantedRequestSubmissionSchema } from '@/lib/marketplace/schemas';

// Simple in-memory rate limiter (replace with Upstash Redis in production)
const submissionCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = submissionCounts.get(ip);
  if (!record || record.resetAt < now) {
    submissionCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

export async function POST(request: Request) {
  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many submissions. Try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;

  // Determine type: 'listing' (default) or 'wanted'
  const submissionType = raw.type === 'wanted' ? 'wanted' : 'listing';

  if (submissionType === 'wanted') {
    const parsed = WantedRequestSubmissionSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('marketplace_wanted_requests')
      .insert({
        ...parsed.data,
        status: 'pending',         // locked
        public_visibility: false,  // locked
        created_by: user?.id ?? null,
      })
      .select('id, status, public_visibility, created_at')
      .single();

    if (error) {
      console.error('[submit/wanted] error:', error.message);
      return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
    }

    return NextResponse.json({ submission: data }, { status: 201 });
  }

  // Listing submission
  const parsed = ListingSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Generate slug from title
  const slugBase = parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const slug = `${slugBase}-${Date.now()}`;

  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert({
      ...parsed.data,
      slug,
      review_status: 'pending',   // locked — cannot be overridden
      public_visibility: false,   // locked — cannot be overridden
      created_by: user?.id ?? null,
    })
    .select('id, review_status, public_visibility, created_at')
    .single();

  if (error) {
    console.error('[submit/listing] error:', error.message);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }

  return NextResponse.json({ submission: data }, { status: 201 });
}
