/**
 * POST /api/talent/alerts
 * Create a talent alert for the current user.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createTalentAlert,
  isTalentAuthError,
  TALENT_AUTH_ERROR_MESSAGE,
} from '@/lib/server/talentOperations';
import { errorMessage } from '@/lib/errorMessage'

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createTalentAlert({
      name: body?.name ?? null,
      jurisdictions: body?.jurisdictions ?? [],
      roleFamilies: body?.roleFamilies ?? [],
      locationTypes: body?.locationTypes ?? [],
      minSalary: body?.minSalary ?? null,
      frequency: body?.frequency ?? 'daily',
    });
    return NextResponse.json({ ok: true, alertId: result.id });
  } catch (err) {
    // Our own 401 signal, and only ours: isTalentAuthError requires a real
    // Error, so a thrown string mentioning "Authentication" cannot reach here.
    if (isTalentAuthError(err)) {
      return NextResponse.json({ error: TALENT_AUTH_ERROR_MESSAGE }, { status: 401 });
    }
    // Detail stays server-side; the client gets a fixed string.
    console.error('[api/talent/alerts] error', errorMessage(err), err);
    return NextResponse.json({ error: 'Alert creation failed' }, { status: 500 });
  }
}
