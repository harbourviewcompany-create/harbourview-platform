export type HvJurisdictionPublicDto = {
  id: string;
  country_name: string;
  iso_code: string | null;
  region: string | null;
  cannabis_market_status: string | null;
  priority_tier: string | null;
  updated_at: string;
};

export type HvSourcePublicDto = {
  id: string;
  source_name: string;
  source_url: string | null;
  normalized_url: string | null;
  country_text: string | null;
  source_type_text: string | null;
  organization_text: string | null;
  jurisdiction_level: string | null;
  verification_status: 'verified';
  last_checked: string | null;
  updated_at: string;
};

export type HvMarketSignalPublicDto = {
  id: string;
  jurisdiction_id: string | null;
  title: string;
  summary_public: string | null;
  signal_type: string | null;
  source_id: string | null;
  updated_at: string;
};

export type HvMarketplaceListingPublicDto = {
  id: string;
  company_id: string | null;
  title: string;
  description_public: string | null;
  category: string | null;
  price_public: string | null;
  country_code: string | null;
  updated_at: string;
};

export type HvOfferPublicDto = {
  id: string;
  offer_id: string | null;
  company_id: string | null;
  title: string;
  description_public: string | null;
  category: string | null;
  updated_at: string;
};

export type HvClaimEvidencePublicDto = {
  id: string;
  source_id: string | null;
  claim_table: string | null;
  claim_record_id: string | null;
  evidence_type: string | null;
  evidence_url: string | null;
  evidence_title: string | null;
  public_summary: string | null;
  updated_at: string;
};


export type HvEducationResourcePublicDto = {
  id: string;
  title: string;
  summary_public: string | null;
  content_public: string | null;
  source_id: string | null;
  evidence_id: string | null;
  updated_at: string;
};

export type HvDigestDeltaStatus = 'new_event' | 'material_advancement' | 'unchanged_duplicate'
export type HvDigestPriorityDomain =
  | 'global_medical'
  | 'import_export_eu_gmp'
  | 'm_and_a'
  | 'licensing_regulatory'
  | 'commercial_distribution'
  | 'genetics'
  | 'formulations'
  | 'pharmaceutical_cannabinoid_technology'
  | 'other'

// A single card in the daily_digest.headlines jsonb array. No raw ia_signals
// row (source_id, source_name, internal notes, confidence, etc.) is exposed
// -- only what the editor function (run_daily_digest) itself already wrote
// for public consumption.
export type HvDigestHeadlineDto = {
  headline: string;
  why_it_matters: string;
  market: string;
  whats_next: string | null;
  signal_id: string | null;
  event_key: string | null;
  prior_event_key: string | null;
  delta_status: HvDigestDeltaStatus | null;
  advancement_reason: string | null;
  jurisdiction: string;
  entities: string[];
  priority_domain: HvDigestPriorityDomain;
  verified_facts: string[];
  inferences: string[];
  competitive_position_change: boolean;
  competitive_position_detail: string | null;
};

// A single card in the daily_digest.editorial_headlines jsonb array —
// mainstream-media editorial content (run_editorial_digest), distinct from
// the trade-signal headlines above. No raw editorial_items row (internal
// stage, snapshot_id, etc.) is exposed, only public-safe fields.
export type HvEditorialHeadlineDto = {
  headline: string;
  why_it_matters: string;
  market: string;
  item_id: string | null;
  published_at: string | null;
  source_url: string | null;
  outlet_name: string | null;
};

export type HvDailyDigestPublicDto = {
  digest_date: string;
  generated_at: string;
  markets: string[];
  headlines: HvDigestHeadlineDto[];
  editorial_headlines: HvEditorialHeadlineDto[];
};

// ── Serializers ────────────────────────────────────────────────────────────
// Each function picks only the public fields from an internal record, preventing
// accidental exposure of private or passport-level data.

type AnyRecord = Record<string, unknown>

function pick<T extends AnyRecord>(src: AnyRecord, keys: readonly string[]): T {
  return Object.fromEntries(keys.filter((k) => k in src).map((k) => [k, src[k]])) as T
}

function publicStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function publicDeltaStatus(value: unknown): HvDigestDeltaStatus | null {
  return value === 'new_event' || value === 'material_advancement' || value === 'unchanged_duplicate'
    ? value
    : null
}

function publicPriorityDomain(value: unknown): HvDigestPriorityDomain {
  switch (value) {
    case 'global_medical':
    case 'import_export_eu_gmp':
    case 'm_and_a':
    case 'licensing_regulatory':
    case 'commercial_distribution':
    case 'genetics':
    case 'formulations':
    case 'pharmaceutical_cannabinoid_technology':
      return value
    default:
      return 'other'
  }
}

export function toHvJurisdictionPublicDto(src: AnyRecord): HvJurisdictionPublicDto {
  return pick(src, ['id', 'country_name', 'iso_code', 'region', 'cannabis_market_status', 'priority_tier', 'updated_at'])
}

export function toHvSourcePublicDto(src: AnyRecord): HvSourcePublicDto {
  return pick(src, ['id', 'source_name', 'source_url', 'normalized_url', 'country_text', 'source_type_text', 'organization_text', 'jurisdiction_level', 'verification_status', 'last_checked', 'updated_at'])
}

export function toHvMarketSignalPublicDto(src: AnyRecord): HvMarketSignalPublicDto {
  return pick(src, ['id', 'jurisdiction_id', 'title', 'summary_public', 'signal_type', 'source_id', 'updated_at'])
}

export function toHvMarketplaceListingPublicDto(src: AnyRecord): HvMarketplaceListingPublicDto {
  return pick(src, ['id', 'company_id', 'title', 'description_public', 'category', 'price_public', 'country_code', 'updated_at'])
}

export function toHvOfferPublicDto(src: AnyRecord): HvOfferPublicDto {
  return pick(src, ['id', 'offer_id', 'company_id', 'title', 'offer_type', 'price_public', 'country_code', 'category', 'updated_at'])
}

export function toHvClaimEvidencePublicDto(src: AnyRecord): HvClaimEvidencePublicDto {
  return pick(src, ['id', 'public_summary', 'updated_at', 'source_id', 'claim_table', 'claim_record_id', 'evidence_type', 'evidence_url', 'evidence_title'])
}

export function toHvEducationResourcePublicDto(src: AnyRecord): HvEducationResourcePublicDto {
  return pick(src, ['id', 'title', 'resource_type', 'jurisdiction_id', 'country_code', 'summary_public', 'url', 'updated_at'])
}

export function toHvDigestHeadlineDto(src: AnyRecord): HvDigestHeadlineDto {
  const market = typeof src.market === 'string' && src.market.trim() ? src.market : 'Global'
  return {
    headline: typeof src.headline === 'string' ? src.headline : '',
    why_it_matters: typeof src.why_it_matters === 'string' ? src.why_it_matters : '',
    market,
    whats_next: typeof src.whats_next === 'string' && src.whats_next.trim() ? src.whats_next : null,
    signal_id: typeof src.signal_id === 'string' ? src.signal_id : null,
    event_key: typeof src.event_key === 'string' && src.event_key.trim() ? src.event_key : null,
    prior_event_key: typeof src.prior_event_key === 'string' && src.prior_event_key.trim() ? src.prior_event_key : null,
    delta_status: publicDeltaStatus(src.delta_status),
    advancement_reason: typeof src.advancement_reason === 'string' && src.advancement_reason.trim() ? src.advancement_reason : null,
    jurisdiction: typeof src.jurisdiction === 'string' && src.jurisdiction.trim() ? src.jurisdiction : market,
    entities: publicStringList(src.entities),
    priority_domain: publicPriorityDomain(src.priority_domain),
    verified_facts: publicStringList(src.verified_facts),
    inferences: publicStringList(src.inferences),
    competitive_position_change: src.competitive_position_change === true,
    competitive_position_detail: typeof src.competitive_position_detail === 'string' && src.competitive_position_detail.trim()
      ? src.competitive_position_detail
      : null,
  }
}

export function toHvEditorialHeadlineDto(src: AnyRecord): HvEditorialHeadlineDto {
  return {
    headline: typeof src.headline === 'string' ? src.headline : '',
    why_it_matters: typeof src.why_it_matters === 'string' ? src.why_it_matters : '',
    market: typeof src.market === 'string' && src.market.trim() ? src.market : 'Global',
    item_id: typeof src.item_id === 'string' ? src.item_id : null,
    published_at: typeof src.published_at === 'string' ? src.published_at : null,
    source_url: typeof src.source_url === 'string' ? src.source_url : null,
    outlet_name: typeof src.outlet_name === 'string' ? src.outlet_name : null,
  }
}

export function toHvDailyDigestPublicDto(src: AnyRecord): HvDailyDigestPublicDto {
  const rawHeadlines = Array.isArray(src.headlines) ? (src.headlines as AnyRecord[]) : []
  const rawEditorial = Array.isArray(src.editorial_headlines) ? (src.editorial_headlines as AnyRecord[]) : []
  return {
    digest_date: typeof src.digest_date === 'string' ? src.digest_date : '',
    generated_at: typeof src.generated_at === 'string' ? src.generated_at : '',
    markets: Array.isArray(src.markets) ? (src.markets as string[]) : [],
    headlines: rawHeadlines
      .map(toHvDigestHeadlineDto)
      .filter((h) => h.headline.length > 0),
    editorial_headlines: rawEditorial
      .map(toHvEditorialHeadlineDto)
      .filter((h) => h.headline.length > 0),
  }
}
