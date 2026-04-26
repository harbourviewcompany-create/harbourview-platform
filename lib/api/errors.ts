import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export function apiError(code: ApiErrorCode, message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function normalizeApiError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  if (message.includes('Not authenticated')) return apiError('UNAUTHORIZED', 'Authentication required', 401);
  if (message.includes('Insufficient permissions')) return apiError('FORBIDDEN', 'Insufficient permissions', 403);
  if (message.includes('invalid')) return apiError('BAD_REQUEST', message, 400);
  return apiError('INTERNAL_ERROR', message, 500);
}
