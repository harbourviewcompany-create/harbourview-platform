/**
 * POST /api/talent/alerts
 * Create a talent alert for the current user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTalentAlert } from '@/lib/server/talentOperations';

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
  } catch (err: any) {
    const status = err?.message?.includes('Authentication') ? 401 : 500;
    return NextResponse.json(
      { error: err?.message ?? 'Alert creation failed' },
      { status }
    );
  }
}
