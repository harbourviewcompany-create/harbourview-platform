import type { MarketplaceListingTypeKey } from './marketplaceTypes'

export type MarketplaceIntakeField = {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: string[]
}

export type MarketplaceIntakeFieldset = {
  key: string
  label: string
  appliesTo: MarketplaceListingTypeKey[]
  fields: MarketplaceIntakeField[]
}

const sharedFields: MarketplaceIntakeField[] = [
  { name: 'country', label: 'Country', type: 'text', placeholder: 'e.g. Canada, United States, Germany' },
  { name: 'region', label: 'Region / State / Province', type: 'text', placeholder: 'e.g. Ontario' },
  { name: 'availability_timing', label: 'Availability / timing', type: 'text', placeholder: 'Available now, 30 days, future supply, deadline' },
  { name: 'authority_to_submit', label: 'Authority to submit', type: 'select', required: true, options: ['Owner / seller', 'Authorized broker', 'Employee / operator', 'Buyer request', 'Other / needs review'] },
  { name: 'accepts_harbourview_routing', label: 'Open to Harbourview-routed introductions', type: 'checkbox' },
]

const ALL_LISTING_TYPE_KEYS: MarketplaceListingTypeKey[] = [
  'new_product', 'used_surplus_equipment', 'cannabis_inventory', 'wanted_request', 'service',
  'business_opportunity', 'featured_network_opportunity', 'consumables', 'cultivation_equipment',
  'processing_equipment', 'distressed_inventory', 'distressed_businesses', 'genetics_program',
  'qualified_access_request', 'education_resource',
  // vision-plan
  'licensing_opportunity', 'real_estate_facility', 'technology_software',
  'investment_opportunity', 'research_asset',
]

export const MARKETPLACE_INTAKE_FIELDSETS: MarketplaceIntakeFieldset[] = [
  {
    key: 'shared',
    label: 'Routing details',
    appliesTo: ALL_LISTING_TYPE_KEYS,
    fields: sharedFields,
  },
  {
    key: 'consumables',
    label: 'Consumables details',
    appliesTo: ['consumables', 'new_product'],
    fields: [
      { name: 'subcategory', label: 'Consumables subcategory', type: 'text', placeholder: 'Packaging, lab consumables, sanitation, cultivation supplies' },
      { name: 'product_form', label: 'Product format', type: 'text', placeholder: 'Jar, pouch, label, glove, wipe, medium, input' },
      { name: 'material', label: 'Material / composition', type: 'text' },
      { name: 'pack_size', label: 'Pack size', type: 'text' },
      { name: 'minimum_order_quantity', label: 'Minimum order quantity', type: 'text' },
      { name: 'recurring_supply_available', label: 'Recurring supply available', type: 'checkbox' },
      { name: 'bulk_available', label: 'Bulk available', type: 'checkbox' },
      { name: 'lead_time', label: 'Lead time', type: 'text' },
      { name: 'region_available', label: 'Regions served', type: 'text' },
      { name: 'certifications', label: 'Certifications / documentation', type: 'textarea' },
      { name: 'catalog_url', label: 'Catalog URL', type: 'text' },
    ],
  },
  {
    key: 'equipment',
    label: 'Equipment details',
    appliesTo: ['used_surplus_equipment', 'cultivation_equipment', 'processing_equipment'],
    fields: [
      { name: 'equipment_category', label: 'Equipment category', type: 'text' },
      { name: 'manufacturer', label: 'Manufacturer', type: 'text' },
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'year', label: 'Year', type: 'text' },
      { name: 'condition', label: 'Condition', type: 'select', options: ['New', 'Like new', 'Good', 'Fair', 'Parts / salvage', 'Unknown'] },
      { name: 'hours_used', label: 'Hours used', type: 'text' },
      { name: 'capacity', label: 'Capacity', type: 'text' },
      { name: 'voltage', label: 'Voltage / power', type: 'text' },
      { name: 'dimensions', label: 'Dimensions', type: 'text' },
      { name: 'asset_location', label: 'Asset location', type: 'text' },
      { name: 'service_records_available', label: 'Service records available', type: 'checkbox' },
      { name: 'inspection_available', label: 'Inspection available', type: 'checkbox' },
      { name: 'deinstallation_required', label: 'Deinstallation required', type: 'checkbox' },
      { name: 'rigging_required', label: 'Rigging required', type: 'checkbox' },
      { name: 'shipping_available', label: 'Shipping available', type: 'checkbox' },
      { name: 'ownership_or_authority', label: 'Ownership / sale authority', type: 'textarea' },
    ],
  },
  {
    key: 'distressed',
    label: 'Distressed / surplus details',
    appliesTo: ['distressed_inventory', 'distressed_businesses', 'business_opportunity'],
    fields: [
      { name: 'distress_type', label: 'Distress type', type: 'select', options: ['Facility closure', 'Auction', 'Liquidation', 'Surplus', 'Relocation', 'Insolvency / receiver', 'Overstock', 'Other'] },
      { name: 'urgency', label: 'Urgency', type: 'text' },
      { name: 'asset_package_scope', label: 'Asset package scope', type: 'textarea' },
      { name: 'seller_authority', label: 'Seller authority', type: 'textarea' },
      { name: 'asking_price', label: 'Asking price', type: 'text' },
      { name: 'accepts_offers', label: 'Accepts offers', type: 'checkbox' },
      { name: 'deadline', label: 'Deadline', type: 'text' },
      { name: 'confidentiality_required', label: 'Confidentiality / NDA required', type: 'checkbox' },
      { name: 'documents_available', label: 'Documents available', type: 'checkbox' },
      { name: 'removal_deadline', label: 'Removal deadline', type: 'text' },
      { name: 'lien_or_encumbrance_unknown', label: 'Liens or encumbrances unknown', type: 'checkbox' },
    ],
  },
  {
    key: 'service_provider',
    label: 'Service provider details',
    appliesTo: ['service', 'education_resource'],
    fields: [
      { name: 'service_category', label: 'Service category', type: 'text' },
      { name: 'jurisdictions_served', label: 'Jurisdictions served', type: 'textarea' },
      { name: 'credentials', label: 'Credentials', type: 'textarea' },
      { name: 'regulated_market_experience', label: 'Regulated market experience', type: 'textarea' },
      { name: 'capacity', label: 'Capacity', type: 'text' },
      { name: 'fee_model', label: 'Fee model', type: 'text' },
      { name: 'response_time', label: 'Response time', type: 'text' },
      { name: 'proof_links', label: 'Proof links', type: 'textarea' },
      { name: 'referral_terms_accepted', label: 'Referral terms accepted', type: 'checkbox' },
    ],
  },
  {
    key: 'wanted_request',
    label: 'Wanted request details',
    appliesTo: ['wanted_request', 'qualified_access_request'],
    fields: [
      { name: 'wanted_category', label: 'Wanted category', type: 'text' },
      { name: 'required_specs', label: 'Required specs', type: 'textarea' },
      { name: 'target_quantity', label: 'Target quantity', type: 'text' },
      { name: 'budget_range', label: 'Budget range', type: 'text' },
      { name: 'delivery_region', label: 'Delivery region', type: 'text' },
      { name: 'deadline', label: 'Deadline', type: 'text' },
      { name: 'buyer_type', label: 'Buyer type', type: 'text' },
      { name: 'documentation_required', label: 'Documentation required', type: 'textarea' },
      { name: 'licence_or_qualification_status', label: 'Licence / qualification status', type: 'textarea' },
      { name: 'sourcing_fee_open', label: 'Open to sourcing fee', type: 'checkbox' },
    ],
  },

  // ── Vision-plan fieldsets ──────────────────────────────────────────────────

  {
    key: 'licensing_opportunity',
    label: 'Licensing opportunity details',
    appliesTo: ['licensing_opportunity'],
    fields: [
      { name: 'license_type', label: 'Licence type', type: 'text', placeholder: 'Cultivation, processing, retail, export, import…' },
      { name: 'license_jurisdiction', label: 'Licence jurisdiction', type: 'text', placeholder: 'e.g. Germany, California, Ontario' },
      { name: 'license_status', label: 'Licence status', type: 'select', options: ['Active / in good standing', 'Dormant', 'Pending renewal', 'Under review', 'For transfer / sale', 'Other'] },
      { name: 'transfer_complexity', label: 'Transfer complexity', type: 'select', options: ['Straightforward', 'Moderate', 'Complex', 'Unknown'] },
      { name: 'asking_price', label: 'Asking price / fee expectation', type: 'text' },
      { name: 'timeline', label: 'Timeline', type: 'text', placeholder: 'Immediate, 30 days, flexible…' },
      { name: 'regulatory_body', label: 'Regulatory body', type: 'text' },
      { name: 'existing_facility_attached', label: 'Existing facility attached', type: 'checkbox' },
      { name: 'nda_required', label: 'NDA required before details', type: 'checkbox' },
      { name: 'background_available', label: 'Background / history available on request', type: 'checkbox' },
    ],
  },
  {
    key: 'real_estate_facility',
    label: 'Facility / real estate details',
    appliesTo: ['real_estate_facility'],
    fields: [
      { name: 'property_type', label: 'Property type', type: 'select', options: ['Greenhouse', 'Indoor grow', 'Processing facility', 'Extraction lab', 'Distribution centre', 'Retail dispensary', 'Mixed-use facility', 'Land / development site', 'Other'] },
      { name: 'square_footage', label: 'Square footage / size', type: 'text' },
      { name: 'property_location', label: 'Property location', type: 'text', placeholder: 'City, province/state, country' },
      { name: 'zoning_status', label: 'Zoning status', type: 'text', placeholder: 'Already zoned, pending, agricultural, industrial…' },
      { name: 'licence_attached', label: 'Cannabis licence attached to property', type: 'checkbox' },
      { name: 'lease_or_sale', label: 'Transaction type', type: 'select', options: ['For sale', 'For lease', 'Lease-to-own', 'Joint venture', 'Other'] },
      { name: 'asking_price_or_rent', label: 'Asking price or monthly rent', type: 'text' },
      { name: 'build_out_status', label: 'Build-out status', type: 'select', options: ['Turnkey / operational', 'Partially built out', 'Shell only', 'Greenfield', 'Other'] },
      { name: 'environmental_controls', label: 'Environmental controls in place', type: 'checkbox' },
      { name: 'photos_available', label: 'Photos / floor plans available', type: 'checkbox' },
      { name: 'confidentiality_required', label: 'Confidentiality required', type: 'checkbox' },
    ],
  },
  {
    key: 'technology_software',
    label: 'Technology & software details',
    appliesTo: ['technology_software'],
    fields: [
      { name: 'product_name', label: 'Product / platform name', type: 'text' },
      { name: 'tech_category', label: 'Category', type: 'select', options: ['Seed-to-sale / track-and-trace', 'ERP / inventory management', 'Compliance software', 'POS', 'CRM', 'Lab information management (LIMS)', 'Cultivation management', 'Data / analytics', 'Marketplace / e-commerce', 'Other'] },
      { name: 'platform', label: 'Platform', type: 'select', options: ['SaaS / cloud', 'On-premise', 'Mobile app', 'API / SDK', 'Hardware + software', 'Other'] },
      { name: 'pricing_model', label: 'Pricing model', type: 'text', placeholder: 'Monthly SaaS, per-seat, one-time licence, usage-based…' },
      { name: 'jurisdictions_supported', label: 'Jurisdictions supported', type: 'textarea' },
      { name: 'regulatory_integrations', label: 'Regulatory integrations', type: 'text', placeholder: 'Metrc, BioTrackTHC, Ample Organics, Health Canada…' },
      { name: 'demo_available', label: 'Demo available', type: 'checkbox' },
      { name: 'existing_customers', label: 'Existing customers / references', type: 'checkbox' },
      { name: 'integration_capabilities', label: 'Integration capabilities', type: 'textarea' },
      { name: 'website_or_product_url', label: 'Website / product URL', type: 'text' },
    ],
  },
  {
    key: 'investment_opportunity',
    label: 'Investment opportunity details',
    appliesTo: ['investment_opportunity'],
    fields: [
      { name: 'investment_type', label: 'Investment type', type: 'select', options: ['Equity raise', 'Convertible note', 'Debt / loan', 'Revenue share', 'Strategic partnership', 'Acquisition target', 'Joint venture', 'Other'] },
      { name: 'raise_amount', label: 'Raise amount / target', type: 'text', placeholder: 'e.g. $2M, €500K, flexible' },
      { name: 'company_stage', label: 'Company stage', type: 'select', options: ['Pre-revenue', 'Early revenue', 'Growth stage', 'Profitable', 'Distressed / restructuring', 'Other'] },
      { name: 'jurisdiction', label: 'Primary jurisdiction', type: 'text' },
      { name: 'use_of_funds', label: 'Use of funds', type: 'textarea' },
      { name: 'existing_revenue', label: 'Existing annual revenue', type: 'text' },
      { name: 'valuation', label: 'Valuation / terms', type: 'text' },
      { name: 'deck_available', label: 'Pitch deck available on request', type: 'checkbox' },
      { name: 'financials_available', label: 'Financials available under NDA', type: 'checkbox' },
      { name: 'legal_structure', label: 'Legal structure', type: 'text', placeholder: 'Inc., Ltd., GmbH, LP…' },
    ],
  },
  {
    key: 'research_asset',
    label: 'Research asset details',
    appliesTo: ['research_asset'],
    fields: [
      { name: 'asset_type', label: 'Asset type', type: 'select', options: ['Clinical trial data', 'Preclinical study', 'Patient registry data', 'Survey / market research', 'Formulation / IP', 'Cultivar / genetic data', 'Regulatory submission package', 'Published research', 'Other'] },
      { name: 'research_area', label: 'Research area / indication', type: 'text', placeholder: 'e.g. pain, epilepsy, PTSD, sleep, oncology…' },
      { name: 'data_scope', label: 'Data scope', type: 'textarea', placeholder: 'Sample size, time period, geographies, demographics' },
      { name: 'methodology', label: 'Methodology', type: 'text', placeholder: 'RCT, observational, in vitro, survey, meta-analysis…' },
      { name: 'publication_status', label: 'Publication status', type: 'select', options: ['Published / peer-reviewed', 'Preprint', 'Unpublished / proprietary', 'In progress', 'Other'] },
      { name: 'licensing_terms', label: 'Licensing / access terms', type: 'select', options: ['Open access', 'Licensed use', 'Sale / transfer', 'Joint research agreement', 'NDA required', 'Other'] },
      { name: 'institution_affiliation', label: 'Institution / affiliation', type: 'text' },
      { name: 'ethics_approval', label: 'Ethics approval obtained', type: 'checkbox' },
      { name: 'data_room_available', label: 'Data room available on request', type: 'checkbox' },
    ],
  },
]

export function getFieldsetsForListingType(type: MarketplaceListingTypeKey) {
  return MARKETPLACE_INTAKE_FIELDSETS.filter((fieldset) => fieldset.appliesTo.includes(type))
}
