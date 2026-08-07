import 'server-only';
import { getAdminDataClient, type AdminDataError } from '@/lib/supabase/adminDataClient';
import {
  CONSUMABLES_CATEGORY,
  getDraftApprovalBlockers,
  isConsumablesListingType,
  isConsumablesSubcategory,
} from './consumables';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const CANDIDATE_STATUSES = [
  'captured',
  'needs_review',
  'needs_verification',
  'approved_draft',
  'rejected',
  'archived',
] as const;

export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export type MarketplaceCandidate = {
  id: string;
  snapshot_id: string | null;
  candidate_type: string;
  marketplace_category: string;
  subcategory: string | null;
  listing_type: string | null;
  title_internal: string | null;
  title_public_draft: string | null;
  description_internal: string | null;
  description_public_draft: string | null;
  jurisdiction: string | null;
  country: string | null;
  region: string | null;
  source_type: string | null;
  supply_type: string | null;
  condition: string | null;
  bulk_available: boolean | null;
  recurring_supply_available: boolean | null;
  region_available: string | null;
  lead_time_text: string | null;
  public_restriction_note: string | null;
  confidence_score: number | null;
  commercial_relevance_score: number | null;
  compliance_risk_score: number | null;
  restricted_item: boolean;
  requires_license_review: boolean;
  status: CandidateStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SourceRegistryRow = {
  id: string;
  source_name: string | null;
  source_type: string;
  source_url: string;
  jurisdiction: string | null;
  category_focus: string | null;
  fetch_method: string;
  allowed_use: string | null;
  terms_risk: string | null;
  review_frequency: string | null;
  is_active: boolean;
  last_checked_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SourceSnapshotRow = {
  id: string;
  source_id: string | null;
  captured_url: string;
  captured_title: string | null;
  captured_text: string | null;
  raw_html_hash: string | null;
  captured_at: string;
  fetch_status: string;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
};

export type CandidateReviewEvent = {
  id: string;
  candidate_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type CandidateDetail = {
  candidate: MarketplaceCandidate;
  snapshot: SourceSnapshotRow | null;
  source: SourceRegistryRow | null;
  events: CandidateReviewEvent[];
};

type AdminResult<T> = import('@/lib/supabase/adminDataClient').AdminDataResult<T>;

function requestFailed(message: string): AdminDataError {
  return { code: 'request_failed', message };
}

function isCandidateStatus(value: string): value is CandidateStatus {
  return (CANDIDATE_STATUSES as readonly string[]).includes(value);
}

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<AdminResult<T>> {
  const client = getAdminDataClient();
  if (!client.ok) return client as any;

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
  if (!response.ok) {
    return { ok: false, error: requestFailed(`Supabase returned ${response.status}: ${text.slice(0, 240)}`) };
  }

  return { ok: true, data: (text ? JSON.parse(text) : null) as T, source: 'db' as const };
}

export async function listSources(): Promise<AdminResult<SourceRegistryRow[]>> {
  return adminRequest<SourceRegistryRow[]>(
    '/rest/v1/marketplace_source_registry?select=*&order=created_at.desc&limit=100',
  );
}

export async function getSourceDetail(id: string): Promise<AdminResult<{ source: SourceRegistryRow; snapshots: SourceSnapshotRow[]; candidates: MarketplaceCandidate[] }>> {
  if (!UUID_PATTERN.test(id)) return { ok: false, error: requestFailed('Invalid source id.') };

  const sourceResult = await adminRequest<SourceRegistryRow[]>(
    `/rest/v1/marketplace_source_registry?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  );
  if (!sourceResult.ok) return sourceResult as any;
  const source = sourceResult.data[0];
  if (!source) return { ok: false, error: requestFailed('Source not found.') };

  const snapshotsResult = await adminRequest<SourceSnapshotRow[]>(
    `/rest/v1/marketplace_source_snapshots?source_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`,
  );
  if (!snapshotsResult.ok) return snapshotsResult as any;

  const snapshotIds = snapshotsResult.data.map((snapshot) => snapshot.id);
  const candidates = snapshotIds.length
    ? await adminRequest<MarketplaceCandidate[]>(
        `/rest/v1/marketplace_candidates?snapshot_id=in.(${snapshotIds.map((snapshotId) => `"${snapshotId}"`).join(',')})&select=*&order=created_at.desc`,
      )
    : { ok: true as const, data: [], source: 'db' as const };
  if (!candidates.ok) return candidates as any;

  return { ok: true, data: { source, snapshots: snapshotsResult.data, candidates: candidates.data }, source: 'db' as const };
}

export async function listCandidates(): Promise<AdminResult<MarketplaceCandidate[]>> {
  return adminRequest<MarketplaceCandidate[]>(
    '/rest/v1/marketplace_candidates?select=*&order=created_at.desc&limit=100',
  );
}

export async function getCandidateDetail(id: string): Promise<AdminResult<CandidateDetail>> {
  if (!UUID_PATTERN.test(id)) return { ok: false, error: requestFailed('Invalid candidate id.') };

  const candidateResult = await adminRequest<MarketplaceCandidate[]>(
    `/rest/v1/marketplace_candidates?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  );
  if (!candidateResult.ok) return candidateResult as any;
  const candidate = candidateResult.data[0];
  if (!candidate) return { ok: false, error: requestFailed('Candidate not found.') };

  let snapshot: SourceSnapshotRow | null = null;
  let source: SourceRegistryRow | null = null;

  if (candidate.snapshot_id) {
    const snapshotResult = await adminRequest<SourceSnapshotRow[]>(
      `/rest/v1/marketplace_source_snapshots?id=eq.${encodeURIComponent(candidate.snapshot_id)}&select=*&limit=1`,
    );
    if (!snapshotResult.ok) return snapshotResult as any;
    snapshot = snapshotResult.data[0] ?? null;

    if (snapshot?.source_id) {
      const sourceResult = await adminRequest<SourceRegistryRow[]>(
        `/rest/v1/marketplace_source_registry?id=eq.${encodeURIComponent(snapshot.source_id)}&select=*&limit=1`,
      );
      if (!sourceResult.ok) return sourceResult as any;
      source = sourceResult.data[0] ?? null;
    }
  }

  const eventsResult = await adminRequest<CandidateReviewEvent[]>(
    `/rest/v1/marketplace_candidate_review_events?candidate_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`,
  );
  if (!eventsResult.ok) return eventsResult as any;

  return { ok: true, data: { candidate, snapshot, source, events: eventsResult.data }, source: 'db' as const };
}

const ALLOWED_TRANSITIONS: Record<CandidateStatus, CandidateStatus[]> = {
  captured: ['needs_review', 'archived'],
  needs_review: ['needs_verification', 'approved_draft', 'rejected', 'archived'],
  needs_verification: ['needs_review', 'approved_draft', 'rejected'],
  approved_draft: ['archived'],
  rejected: ['archived'],
  archived: [],
};

function eventTypeForStatus(status: CandidateStatus) {
  if (status === 'approved_draft') return 'approved_draft';
  if (status === 'needs_verification') return 'verification_requested';
  if (status === 'rejected') return 'rejected';
  if (status === 'archived') return 'archived';
  return 'reviewed';
}

export async function updateCandidateStatus({
  id,
  toStatus,
  note,
  userId,
}: {
  id: string;
  toStatus: string;
  note: string;
  userId: string;
}): Promise<AdminResult<MarketplaceCandidate>> {
  if (!UUID_PATTERN.test(id)) return { ok: false, error: requestFailed('Invalid candidate id.') };
  if (!isCandidateStatus(toStatus)) return { ok: false, error: requestFailed('Invalid candidate status.') };

  const detail = await getCandidateDetail(id);
  if (!detail.ok) return detail as any;
  const candidate = detail.data.candidate;
  const allowed = ALLOWED_TRANSITIONS[candidate.status] || [];

  if (!allowed.includes(toStatus)) {
    return { ok: false, error: requestFailed(`Transition ${candidate.status} -> ${toStatus} is not allowed.`) };
  }

  if (toStatus === 'rejected' && !note.trim()) {
    return { ok: false, error: requestFailed('Rejected candidates require a note.') };
  }

  if (toStatus === 'approved_draft') {
    const blockers = getDraftApprovalBlockers(candidate);
    if (blockers.length) return { ok: false, error: requestFailed(blockers.join(' ')) };
  }

  // Only validate consumables-specific fields when the candidate is actually a consumables listing
  if (candidate.marketplace_category === CONSUMABLES_CATEGORY) {
    if (candidate.subcategory && !isConsumablesSubcategory(candidate.subcategory)) {
      return { ok: false, error: requestFailed('Invalid consumables subcategory.') };
    }
    if (candidate.listing_type && !isConsumablesListingType(candidate.listing_type)) {
      return { ok: false, error: requestFailed('Invalid consumables listing type.') };
    }
  }

  const patch = {
    status: toStatus,
    rejection_reason: toStatus === 'rejected' ? note.trim() : candidate.rejection_reason,
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
  };

  const updateResult = await adminRequest<MarketplaceCandidate[]>(
    `/rest/v1/marketplace_candidates?id=eq.${encodeURIComponent(id)}&select=*`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch),
    },
  );
  if (!updateResult.ok) return updateResult as any;

  const eventResult = await adminRequest<CandidateReviewEvent[]>(
    '/rest/v1/marketplace_candidate_review_events?select=*',
    {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        candidate_id: id,
        event_type: eventTypeForStatus(toStatus),
        from_status: candidate.status,
        to_status: toStatus,
        note: note.trim() || null,
        created_by: userId,
      }),
    },
  );
  if (!eventResult.ok) return eventResult as any;

  return { ok: true, data: updateResult.data[0], source: 'db' as const };
}
