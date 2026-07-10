import { NextResponse } from 'next/server';
import { resolveLockedSupabaseUrl } from '@/lib/supabase/env';
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit';
import { scoreGeneticsAccessRequest } from '@/lib/introduction-routing/geneticsRouting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ROUTE_ID = '/api/genetics/access-request';

// NOTE: this route serves the generic "Request Access" intake form
// (app/marketplace/genetics/request-access), which is not tied to a specific
// listed cultivar/drop. It intentionally does not call
// lib/introduction-routing/geneticsExecution.ts#createGeneticsRoutingRecord,
// because that function requires a resolvable profileSlug+dropId and gates
// introduction_ready on that specific drop's holder-permission status.
// For an unspecified-profile request there is no drop to check, so
// introduction_ready is always false here — operator review is required
// in every case. drop_id/profile_slug are stored as free text
// ('general-inquiry' / the user's free-text "profile of interest") rather
// than foreign keys, matching the plain-text columns on
// genetics_routing_records.
//
// This call is best-effort and non-blocking: it always resolves so that a
// routing-capture failure never affects the existing marketplace_inquiries
// capture flow, which remains the source of truth for the form's
// user-facing success/error state.

function getSupabaseConfig() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) return null;
  return { url: resolveLockedSupabaseUrl(), serviceRoleKey };
}

function json(ok: boolean, message: string, status = 200) {
  return NextResponse.json({ ok, message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = await enforceRateLimit({ route: ROUTE_ID, ip, limit: 20, windowMs: 60_000 });
  if (!limit.allowed) {
    return json(false, 'Too many requests.', 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json(false, 'Invalid request payload.', 400);
  }

  const company = typeof body.company === 'string' ? body.company.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const country = typeof body.country === 'string' ? body.country.trim() : '';
  const targetMarket = typeof body.targetMarket === 'string' ? body.targetMarket.trim() : '';
  const licenceStatus = typeof body.licenceStatus === 'string' ? body.licenceStatus.trim() : '';
  const intent = typeof body.operatorType === 'string' ? body.operatorType.trim() : '';
  const timeline = typeof body.timeline === 'string' ? body.timeline.trim() : '';
  const quantityOrScale = typeof body.requestDetail === 'string' ? body.requestDetail.trim() : '';
  const profileOfInterest = typeof body.profileOfInterest === 'string' ? body.profileOfInterest.trim() : '';

  if (!email) {
    return json(false, 'Email is required.', 400);
  }

  const score = scoreGeneticsAccessRequest({
    intent,
    targetMarket,
    licenceStatus,
    hasClearUse: Boolean(quantityOrScale),
    hasTimeline: Boolean(timeline),
    hasScale: Boolean(quantityOrScale),
    identityVerified: Boolean(company && email),
    credibleCompany: Boolean(company),
  });

  const supabase = getSupabaseConfig();
  if (!supabase) {
    console.error('harbourview_genetics_routing_config_missing', { route: ROUTE_ID });
    return json(true, 'Routing record not captured (service role not configured).');
  }

  const recordId = globalThis.crypto.randomUUID();
  const recordPayload = {
    id: recordId,
    profile_slug: profileOfInterest || 'general-inquiry',
    drop_id: 'general-inquiry',
    requester_company: company || 'Unknown',
    requester_country: country || null,
    requester_email: email,
    intent: intent || 'unspecified',
    target_market: targetMarket || null,
    score: score.total,
    score_band: score.band,
    status: score.total < 55 ? 'needs_qualification' : 'new_request',
    buyer_permission_approved: false,
    holder_permission_approved: false,
    introduction_ready: false,
    next_action: 'Operator review required.',
  };

  try {
    const insertResponse = await fetch(`${supabase.url}/rest/v1/genetics_routing_records`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        apikey: supabase.serviceRoleKey,
        Authorization: `Bearer ${supabase.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(recordPayload),
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text().catch(() => '');
      console.error('harbourview_genetics_routing_insert_failed', {
        route: ROUTE_ID,
        status: insertResponse.status,
        body: errorText.slice(0, 300),
      });
      return json(true, 'Routing record not captured.');
    }

    await fetch(`${supabase.url}/rest/v1/genetics_routing_events`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        apikey: supabase.serviceRoleKey,
        Authorization: `Bearer ${supabase.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        routing_record_id: recordId,
        event_type: 'access_requested',
        event_summary: `Generic genetics access request scored ${score.total} (${score.band}).`,
        actor: 'system',
      }),
    }).catch((error) => {
      console.error('harbourview_genetics_routing_event_failed', {
        route: ROUTE_ID,
        errorName: error instanceof Error ? error.name : 'unknown',
      });
    });

    return json(true, 'Routing record captured.');
  } catch (error) {
    console.error('harbourview_genetics_routing_request_failed', {
      route: ROUTE_ID,
      errorName: error instanceof Error ? error.name : 'unknown',
    });
    return json(true, 'Routing record not captured.');
  }
}
