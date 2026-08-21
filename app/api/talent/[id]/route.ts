/**
 * GET /api/talent/[id]
 * Single published opportunity.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTalentOpportunity,
  incrementTalentViewCount,
} from '@/lib/server/talentQuery';

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
  } catch (err: any) {
    console.error('[api/talent/[id]] GET error', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal error' },
      { status: 500 }
    );
  }
}
