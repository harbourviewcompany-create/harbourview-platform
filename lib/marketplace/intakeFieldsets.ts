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

export const MARKETPLACE_INTAKE_FIELDSETS: MarketplaceIntakeFieldset[] = [
  {
    key: 'shared',
    label: 'Routing details',
    appliesTo: ['new_product', 'used_surplus_equipment', 'cannabis_inventory', 'wanted_request', 'service', 'business_opportunity', 'featured_network_opportunity', 'consumables', 'cultivation_equipment', 'processing_equipment', 'distressed_inventory', 'distressed_businesses', 'genetics_program', 'qualified_access_request', 'education_resource'],
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
      { name: 'photos_or_docs_available', label: 'Photos or documents available', type: 'checkbox' },
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
      { name: 'photos_available', label: 'Photos available', type: 'checkbox' },
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
]

export function getFieldsetsForListingType(type: MarketplaceListingTypeKey) {
  return MARKETPLACE_INTAKE_FIELDSETS.filter((fieldset) => fieldset.appliesTo.includes(type))
}
