// app/api/marketplace/inquire/route.ts
// POST /api/marketplace/inquire — inquiry submission
// Rate-limited (5/min per IP). Zod-validated.
// Verifies listing exists and is public before accepting.
// Returns success only — no inquiry data echoed to submitter.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { InquirySubmissionSchema } from '@/lib/marketplace/schemas';
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/marketplace/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`inquire:${ip}`, { maxRequests: 5, windowSeconds: 60 });

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

  const parsed = InquirySubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const input = parsed.data;

  try {
    const supabase = await createServerClient();

    // Verify listing is publicly visible before accepting inquiry
    const { data: listing, error: listingError } = await supabase
      .from('marketplace_listings')
      .select('id')
      .eq('id', input.listing_id)
      .eq('review_status', 'approved')
      .eq('public_visibility', true)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const { error } = await supabase.from('marketplace_inquiries').insert({
      listing_id: input.listing_id,
      buyer_name: input.buyer_name,
      buyer_email: input.buyer_email,
      buyer_company: input.buyer_company ?? null,
      buyer_phone: input.buyer_phone ?? null,
      message: input.message,
      status: 'pending',
    });

    if (error) {
      console.error('[marketplace/inquire] Insert error:', error.message);
      return NextResponse.json({ error: 'Inquiry submission failed. Please try again.' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message: 'Your inquiry has been submitted.' },
      { status: 201 }
    );
  } catch (err) {
    console.error('[marketplace/inquire] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
