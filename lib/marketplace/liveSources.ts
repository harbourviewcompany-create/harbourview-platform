import 'server-only';
import crypto from 'node:crypto';
import { getAdminDataClient, type AdminDataError } from '@/lib/supabase/adminDataClient';
import {
  CONSUMABLES_CATEGORY,
  isConsumablesListingType,
  isConsumablesSubcategory,
} from './consumables';
import type { MarketplaceCandidate, SourceRegistryRow, SourceSnapshotRow, CandidateReviewEvent } from './candidates';

const MAX_TEXT_LENGTH = 8000;

type AdminResult<T> = import('@/lib/supabase/adminDataClient').AdminDataResult<T>;

function requestFailed(message: string): AdminDataError {
  return { code: 'request_failed', message };
}

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function readBoolean(formData: FormData, key: string) {
  return readField(formData, key) === 'on';
}

function validateManualUrl(value: string) {
  if (!value) return { ok: false as const, error: 'Source URL is required.' };

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false as const, error: 'Source URL must be a valid URL.' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false as const, error: 'Source URL must use http or https.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  const blockedHosts = new Set(['localhost', '0.0.0.0', '127.0.0.1', '::1']);
  const privateIpv4Patterns = [
    /^10\./,
    /^127\./,
    /^169\.254\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  ];

  if (blockedHosts.has(hostname) || privateIpv4Patterns.some((pattern) => pattern.test(hostname))) {
    return { ok: false as const, error: 'Private or internal network URLs are not accepted.' };
  }

  return { ok: true as const, url: parsed.toString() };
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

export async function createManualSourceIntake(formData: FormData, userId: string): Promise<AdminResult<{ source: SourceRegistryRow; snapshot: SourceSnapshotRow; candidate: MarketplaceCandidate }>> {
  const sourceUrl = validateManualUrl(readField(formData, 'source_url'));
  if (!sourceUrl.ok) return { ok: false, error: requestFailed(sourceUrl.error) };

  const sourceType = readField(formData, 'source_type') || 'manual_submission';
  const subcategory = readField(formData, 'subcategory');
  const listingType = readField(formData, 'listing_type');
  const capturedTitle = readField(formData, 'captured_title');
  const capturedText = readField(formData, 'captured_text').slice(0, MAX_TEXT_LENGTH);
  const publicTitle = readField(formData, 'title_public_draft') || capturedTitle || readField(formData, 'source_name') || new URL(sourceUrl.url).hostname;
  const publicDescription = readField(formData, 'description_public_draft') || capturedText.slice(0, 700);

  if (subcategory && !isConsumablesSubcategory(subcategory)) {
    return { ok: false, error: requestFailed('Invalid consumables subcategory.') };
  }

  if (listingType && !isConsumablesListingType(listingType)) {
    return { ok: false, error: requestFailed('Invalid consumables listing type.') };
  }

  const sourceResult = await adminRequest<SourceRegistryRow[]>(
    '/rest/v1/marketplace_source_registry?select=*',
    {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        source_name: readField(formData, 'source_name') || null,
        source_type: sourceType,
        source_url: sourceUrl.url,
        jurisdiction: readField(formData, 'jurisdiction') || null,
        category_focus: CONSUMABLES_CATEGORY,
        fetch_method: 'manual_url',
        allowed_use: readField(formData, 'allowed_use') || 'Manual review only',
        terms_risk: readField(formData, 'terms_risk') || null,
        review_frequency: readField(formData, 'review_frequency') || null,
        created_by: userId,
      }),
    },
  );
  if (!sourceResult.ok) return sourceResult as any;
  const source = sourceResult.data[0];

  const snapshotResult = await adminRequest<SourceSnapshotRow[]>(
    '/rest/v1/marketplace_source_snapshots?select=*',
    {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        source_id: source.id,
        captured_url: source.source_url,
        captured_title: capturedTitle || null,
        captured_text: capturedText || null,
        raw_html_hash: capturedText ? crypto.createHash('sha256').update(capturedText).digest('hex') : null,
        fetch_status: 'skipped',
        error_message: 'Automatic fetch deferred in V0; manual title/text capture only.',
        created_by: userId,
      }),
    },
  );
  if (!snapshotResult.ok) return snapshotResult as any;
  const snapshot = snapshotResult.data[0];

  const candidateResult = await adminRequest<MarketplaceCandidate[]>(
    '/rest/v1/marketplace_candidates?select=*',
    {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        snapshot_id: snapshot.id,
        candidate_type: readField(formData, 'candidate_type') || 'consumables_supply',
        marketplace_category: CONSUMABLES_CATEGORY,
        subcategory: subcategory || null,
        listing_type: listingType || 'Supply Listing',
        title_internal: readField(formData, 'title_internal') || publicTitle,
        title_public_draft: publicTitle,
        description_internal: readField(formData, 'description_internal') || capturedText || publicDescription,
        description_public_draft: publicDescription || null,
        jurisdiction: readField(formData, 'jurisdiction') || null,
        country: readField(formData, 'country') || null,
        region: readField(formData, 'region') || null,
        source_type: sourceType,
        supply_type: readField(formData, 'supply_type') || null,
        condition: readField(formData, 'condition') || null,
        bulk_available: readBoolean(formData, 'bulk_available'),
        recurring_supply_available: readBoolean(formData, 'recurring_supply_available'),
        region_available: readField(formData, 'region_available') || null,
        lead_time_text: readField(formData, 'lead_time_text') || null,
        public_restriction_note: readField(formData, 'public_restriction_note') || 'Inquiry Required',
        restricted_item: readBoolean(formData, 'restricted_item'),
        requires_license_review: readBoolean(formData, 'requires_license_review'),
        status: 'needs_review',
        created_by: userId,
      }),
    },
  );
  if (!candidateResult.ok) return candidateResult as any;
  const candidate = candidateResult.data[0];

  const eventResult = await adminRequest<CandidateReviewEvent[]>(
    '/rest/v1/marketplace_candidate_review_events?select=*',
    {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        candidate_id: candidate.id,
        event_type: 'created',
        to_status: candidate.status,
        note: 'Manual source intake V0 candidate created. Automatic fetch skipped.',
        created_by: userId,
      }),
    },
  );
  if (!eventResult.ok) return eventResult as any;

  return { ok: true, data: { source, snapshot, candidate }, source: 'db' as const };
}
