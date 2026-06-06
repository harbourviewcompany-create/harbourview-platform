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
