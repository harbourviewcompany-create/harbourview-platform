import 'server-only';
import crypto from 'node:crypto';
import { getAdminDataClient, type AdminDataError } from '@/lib/supabase/adminDataClient';

export type ServiceCandidateRow = {
  id: string;
  title_public: string | null;
  description_public: string | null;
  service_type_public: string | null;
  delivery_method_public: 'remote' | 'on-site' | 'both' | null;
  location_public: string | null;
  tags_public: string[] | null;
  image_url_public: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
};

type AdminResult<T> = { ok: true; data: T } | { ok: false; error: AdminDataError };

function requestFailed(message: string): AdminDataError {
  return { code: 'request_failed', message };
}

async function serviceRequest<T>(path: string, init: RequestInit = {}): Promise<AdminResult<T>> {
  const client = getAdminDataClient();
  if (!client.ok) return client;

  const response = await fetch(`${client.data.url}${path}`, {
    ...init,
    headers: {
      apikey: client.data.serviceRoleKey,
      Authorization: `Bearer ${client.data.serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });

  const text = await response.text();
  if (!response.ok) return { ok: false, error: requestFailed(`Supabase returned ${response.status}: ${text.slice(0, 240)}`) };
  return { ok: true, data: (text ? JSON.parse(text) : null) as T };
}

export async function listApprovedServiceCandidates(): Promise<AdminResult<ServiceCandidateRow[]>> {
  const now = encodeURIComponent(new Date().toISOString());
  const query = [
    'select=id,title_public,description_public,service_type_public,delivery_method_public,location_public,tags_public,image_url_public,status,expires_at,created_at',
    'status=eq.approved',
    `or=(expires_at.is.null,expires_at.gt.${now})`,
    'order=created_at.desc',
    'limit=50',
  ].join('&');
  return serviceRequest<ServiceCandidateRow[]>(`/rest/v1/service_candidates?${query}`);
}

export async function insertServiceSnapshot(input: { sourceId?: string; capturedUrl: string; capturedTitle?: string; capturedText?: string; expiresAt?: string }) {
  const capturedText = input.capturedText?.slice(0, 8000) || null;
  return serviceRequest('/rest/v1/service_snapshots?select=*', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      source_id: input.sourceId || null,
      captured_url: input.capturedUrl,
      captured_title: input.capturedTitle || null,
      captured_text: capturedText,
      raw_html_hash: capturedText ? crypto.createHash('sha256').update(capturedText).digest('hex') : null,
      fetch_status: 'success',
      expires_at: input.expiresAt || null,
    }),
  });
}

export async function upsertServiceCandidate(input: { snapshotId: string; title: string; description: string; serviceType: string; deliveryMethod: 'remote' | 'on-site' | 'both'; location: string; tags?: string[]; expiresAt?: string }) {
  return serviceRequest('/rest/v1/service_candidates?on_conflict=snapshot_id&select=*', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({
      snapshot_id: input.snapshotId,
      title_public: input.title,
      description_public: input.description,
      service_type_public: input.serviceType,
      delivery_method_public: input.deliveryMethod,
      location_public: input.location,
      tags_public: input.tags || [],
      status: 'needs_review',
      expires_at: input.expiresAt || null,
    }),
  });
}

export async function archiveExpiredServiceCandidates() {
  const now = new Date().toISOString();
  return serviceRequest('/rest/v1/service_candidates?status=eq.approved&expires_at=lt.' + encodeURIComponent(now), {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ status: 'archived' }),
  });
}
