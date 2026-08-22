/**
 * GET /api/talent
 * List published talent opportunities with filters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { listTalentOpportunities } from '@/lib/server/talentQuery';
import type { RoleFamily, LocationType, Seniority, EmploymentType } from '@/types/talent';
import { errorMessage } from '@/lib/errorMessage'

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const params = {
      jurisdiction: sp.get('jurisdiction'),
      roleFamily: (sp.get('roleFamily') as RoleFamily) || null,
      locationType: (sp.get('locationType') as LocationType) || null,
      seniority: (sp.get('seniority') as Seniority) || null,
      employmentType: (sp.get('employmentType') as EmploymentType) || null,
      minSalary: sp.get('minSalary') ? Number(sp.get('minSalary')) : null,
      query: sp.get('query'),
      featuredOnly: sp.get('featuredOnly') === 'true',
      limit: sp.get('limit') ? Number(sp.get('limit')) : 20,
      offset: sp.get('offset') ? Number(sp.get('offset')) : 0,
    };

    const result = await listTalentOpportunities(params);
    return NextResponse.json(result);
  } catch (err) {
    // Detail stays server-side. The client gets a fixed string: a thrown
    // value can carry internals, and this is an HTTP response body.
    console.error('[api/talent] GET error', errorMessage(err), err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
