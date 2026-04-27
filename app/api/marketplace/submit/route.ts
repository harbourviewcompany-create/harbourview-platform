// app/api/marketplace/submit/route.ts
// POST /api/marketplace/submit — listing submission
// Rate-limited (5/min per IP). Zod-validated.
// review_status and public_visibility locked server-side. Success only returned.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ListingSubmissionSchema } from '@/lib/marketplace/schemas';
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/marketplace/rate-limit';
import { generateSlug } from '@/lib/marketplace/slugify';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`submit:${ip}`, { maxRequests: 5, windowSeconds: 60 });

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

  const parsed = ListingSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const input = parsed.data;

  try {
    const supabase = await createServerClient();
    const slug = generateSlug(input.title);

    const { error } = await supabase.from('marketplace_listings').insert({
      slug,
      section: input.section,
      title: input.title,
      description: input.description,
      price_amount: input.price_amount ?? null,
      price_currency: input.price_currency ?? 'USD',
      location_country: input.location_country ?? null,
      review_status: 'pending',
      public_visibility: false,
    });

    if (error) {
      console.error('[marketplace/submit] Insert error:', error.message);
      return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message: 'Your listing has been submitted for review.' },
      { status: 201 }
    );
  } catch (err) {
    console.error('[marketplace/submit] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
