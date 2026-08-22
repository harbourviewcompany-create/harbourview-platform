/**
 * POST /api/talent/save
 * Body: { opportunityId: string }
 * DELETE /api/talent/save  (unsave)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  isTalentAuthError,
  saveTalentJob,
  TALENT_AUTH_ERROR_MESSAGE,
  unsaveTalentJob,
} from '@/lib/server/talentOperations';
import { errorMessage } from '@/lib/errorMessage'

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
  } catch (err) {
    // Our own 401 signal, and only ours: isTalentAuthError requires a real
    // Error, so a thrown string mentioning "Authentication" cannot reach here.
    if (isTalentAuthError(err)) {
      return NextResponse.json({ error: TALENT_AUTH_ERROR_MESSAGE }, { status: 401 });
    }
    // Detail stays server-side; the client gets a fixed string.
    console.error('[api/talent/save] POST error', errorMessage(err), err);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
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
  } catch (err) {
    // Our own 401 signal, and only ours: isTalentAuthError requires a real
    // Error, so a thrown string mentioning "Authentication" cannot reach here.
    if (isTalentAuthError(err)) {
      return NextResponse.json({ error: TALENT_AUTH_ERROR_MESSAGE }, { status: 401 });
    }
    // Detail stays server-side; the client gets a fixed string.
    console.error('[api/talent/save] DELETE error', errorMessage(err), err);
    return NextResponse.json({ error: 'Unsave failed' }, { status: 500 });
  }
}
