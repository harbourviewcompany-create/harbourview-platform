// POST /api/marketplace/wanted — wanted request submission
// Rate-limited. Zod-validated. Defaults to pending, not public.

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { WantedRequestSubmissionSchema } from '@/lib/marketplace/schemas';

const wantedCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 60_000;

function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = wantedCounts.get(ip);
  if (!entry || entry.resetAt < now) {
    wantedCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = WantedRequestSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const supabase = await createServerClient();

  const { error } = await supabase.from('marketplace_wanted_requests').insert({
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category ?? null,
    budget_range: parsed.data.budget_range ?? null,
    status: 'pending',
    public_visibility: false,
  });

  if (error) {
    console.error('[marketplace/wanted] insert error:', error.message);
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Your request has been submitted for review.' }, { status: 201 });
}
