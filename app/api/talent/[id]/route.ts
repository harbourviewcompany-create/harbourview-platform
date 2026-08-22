/**
 * GET /api/talent/[id]
 * Single published opportunity.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTalentOpportunity,
  incrementTalentViewCount,
} from '@/lib/server/talentQuery';
import { errorMessage } from '@/lib/errorMessage'

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const opportunity = await getTalentOpportunity(id);

    if (!opportunity) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Fire-and-forget view increment
    incrementTalentViewCount(id).catch(() => {});

    return NextResponse.json(opportunity);
  } catch (err) {
    // Detail stays server-side. The client gets a fixed string: a thrown
    // value can carry internals, and this is an HTTP response body.
    console.error('[api/talent/[id]] GET error', errorMessage(err), err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
