import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { getGeminiConnectorStatus } from '@/src/server/connectors/gemini/status';

export async function GET() {
  await requireAdminAuth();
  return NextResponse.json(getGeminiConnectorStatus());
}
