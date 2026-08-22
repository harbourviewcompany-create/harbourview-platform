import { NextResponse } from 'next/server';
import { requireAdminApiAuth } from '@/lib/auth/adminApiAuth';
import { getAdminDataClient } from '@/lib/supabase/adminDataClient';

type ProxyOp = 'get' | 'patch' | 'post' | 'delete' | 'rpc' | 'bulk_patch';

type ProxyPayload = {
  op: ProxyOp;
  table?: string;
  qs?: string;
  fn?: string;
  body?: Record<string, unknown>;
  /** bulk_patch: list of row ids (uuid or text) */
  ids?: string[];
  /** bulk_patch: column used for in-filter (default id) */
  idColumn?: string;
};

// Server-side proxy for the admin hub control surface (app/admin/(protected)/hub).
// Admin auth is enforced via requireAdminApiAuth(); Supabase access uses
// SUPABASE_SERVICE_ROLE_KEY from the server environment — never exposed
// to the browser.
export async function POST(req: Request) {
  const authError = await requireAdminApiAuth();
  if (authError) return authError;

  const client = getAdminDataClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.error.message }, { status: 500 });
  }
  const { url, serviceRoleKey } = client.data;

  let payload: ProxyPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 });
  }

  const { op, table, qs, fn, body, ids, idColumn } = payload || ({} as ProxyPayload);
  if (!op) return NextResponse.json({ error: 'missing op' }, { status: 400 });
  if (op !== 'rpc' && !table) return NextResponse.json({ error: 'missing table' }, { status: 400 });
  if (op === 'rpc' && !fn) return NextResponse.json({ error: 'missing fn' }, { status: 400 });

  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };

  let target: string;
  let method = 'GET';
  let fetchBody: string | undefined;

  switch (op) {
    case 'get':
      target = `${url}/rest/v1/${table}${qs ? `?${qs}` : ''}`;
      break;
    case 'patch':
      target = `${url}/rest/v1/${table}?${qs ?? ''}`;
      method = 'PATCH';
      headers.Prefer = 'return=representation';
      fetchBody = JSON.stringify(body || {});
      break;
    case 'bulk_patch': {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'bulk_patch requires non-empty ids[]' }, { status: 400 });
      }
      if (ids.length > 500) {
        return NextResponse.json({ error: 'bulk_patch max 500 ids' }, { status: 400 });
      }
      const col = idColumn || 'id';
      // PostgREST in-filter: id=in.(uuid1,uuid2)
      const list = ids.map((id) => `"${String(id).replace(/"/g, '')}"`).join(',');
      target = `${url}/rest/v1/${table}?${col}=in.(${list})`;
      method = 'PATCH';
      headers.Prefer = 'return=representation';
      fetchBody = JSON.stringify(body || {});
      break;
    }
    case 'post':
      target = `${url}/rest/v1/${table}`;
      method = 'POST';
      headers.Prefer = 'return=representation';
      fetchBody = JSON.stringify(body || {});
      break;
    case 'delete':
      target = `${url}/rest/v1/${table}?${qs ?? ''}`;
      method = 'DELETE';
      break;
    case 'rpc':
      target = `${url}/rest/v1/rpc/${fn}`;
      method = 'POST';
      fetchBody = JSON.stringify(body || {});
      break;
    default:
      return NextResponse.json({ error: `unknown op: ${op}` }, { status: 400 });
  }

  const res = await fetch(target, { method, headers, body: fetchBody, cache: 'no-store' });
  const text = await res.text();

  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in (data as Record<string, unknown>)
        ? String((data as Record<string, unknown>).message)
        : null) || text || res.statusText;
    return NextResponse.json({ error: message }, { status: res.status });
  }

  return NextResponse.json(data);
}
