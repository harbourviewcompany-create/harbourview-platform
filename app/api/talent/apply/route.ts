/**
 * POST /api/talent/apply
 * Body: { opportunityId: string, coverNote?: string, resumeUrl?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyToTalentOpportunity } from '@/lib/server/talentOperations';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { opportunityId, coverNote, resumeUrl } = body ?? {};

    if (!opportunityId || typeof opportunityId !== 'string') {
      return NextResponse.json(
        { error: 'opportunityId is required' },
        { status: 400 }
      );
    }

    const result = await applyToTalentOpportunity({
      opportunityId,
      coverNote: coverNote ?? null,
      resumeUrl: resumeUrl ?? null,
    });

    return NextResponse.json({ ok: true, applicationId: result.id });
  } catch (err: any) {
    const message = err?.message ?? 'Application failed';
    const status =
      message.includes('Authentication') ? 401 :
      message.includes('not found') || message.includes('not open') ? 404 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
