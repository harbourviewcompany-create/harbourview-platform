import { NextRequest } from 'next/server';
import { ingestSignal } from '@/lib/services/signals';
import { apiOk, normalizeApiError } from '@/lib/api/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await ingestSignal(body);
    return apiOk(data, 201);
  } catch (e) {
    return normalizeApiError(e);
  }
}
