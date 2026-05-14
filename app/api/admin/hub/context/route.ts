import { NextResponse } from 'next/server';
import { getAdminAuthCheck } from '@/lib/auth/adminGuard';
import { getOpsHubSnapshot } from '@/lib/ops-hub/snapshot';

export const dynamic = 'force-dynamic';

function deniedStatus(reason: string) {
  return reason === 'missing_admin_role' ? 403 : 401;
}

export async function GET() {
  const auth = await getAdminAuthCheck();
  if (!auth.ok) {
    return NextResponse.json(
      { error: 'Unauthorized', reason: auth.reason },
      { status: deniedStatus(auth.reason) }
    );
  }

  const snapshot = await getOpsHubSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
