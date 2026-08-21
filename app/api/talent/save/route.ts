/**
 * POST /api/talent/save
 * Body: { opportunityId: string }
 * DELETE /api/talent/save  (unsave)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  saveTalentJob,
  unsaveTalentJob,
} from '@/lib/server/talentOperations';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { opportunityId } = body ?? {};
    if (!opportunityId) {
      return NextResponse.json(
        { error: 'opportunityId is required' },
        { status: 400 }
      );
    }
    await saveTalentJob(opportunityId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err?.message?.includes('Authentication') ? 401 : 500;
    return NextResponse.json(
      { error: err?.message ?? 'Save failed' },
      { status }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { opportunityId } = body ?? {};
    if (!opportunityId) {
      return NextResponse.json(
        { error: 'opportunityId is required' },
        { status: 400 }
      );
    }
    await unsaveTalentJob(opportunityId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err?.message?.includes('Authentication') ? 401 : 500;
    return NextResponse.json(
      { error: err?.message ?? 'Unsave failed' },
      { status }
    );
  }
}
