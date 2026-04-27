import { NextRequest } from 'next/server';
import { createDeal } from '@/lib/services/deals';
import { apiOk, normalizeApiError } from '@/lib/api/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await createDeal(body);
    return apiOk(data, 201);
  } catch (e) {
    return normalizeApiError(e);
  }
}
