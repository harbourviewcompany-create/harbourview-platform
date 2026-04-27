import { NextRequest } from 'next/server';
import { transitionDeal } from '@/lib/services/deals';
import { apiOk, normalizeApiError } from '@/lib/api/errors';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const data = await transitionDeal(params.id, body);
    return apiOk(data);
  } catch (e) {
    return normalizeApiError(e);
  }
}
