import 'server-only';
import type { ListingImage, NewProductListing } from '@/lib/fixtures/types';
import { fetchAdminSupabaseJson } from '@/lib/supabase/adminDataClient';
import { NEW_PRODUCTS_CATEGORY } from './equipment';

export type ApprovedEquipmentCandidate = {
  id: string;
  title_public_draft: string | null;
  description_public_draft: string | null;
  region_available: string | null;
  subcategory: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_status: string | null;
  image_reviewed_at: string | null;
  image_attribution: string | null;
  image_allowed_use: string | null;
  status: string;
  marketplace_category: string;
  created_at: string;
};

function buildImage(candidate: ApprovedEquipmentCandidate): ListingImage | undefined {
  if (!candidate.image_url || !candidate.image_alt || !candidate.image_status || !candidate.image_reviewed_at || !candidate.image_attribution || !candidate.image_allowed_use) {
    return undefined;
  }

  return {
    src: candidate.image_url,
    alt: candidate.image_alt,
    status: candidate.image_status === 'verified' ? 'verified' : 'supplier-provided',
    caption: 'Reviewed equipment image',
    assetSource: 'supplier_provided'
  };
}

export function projectApprovedEquipmentCandidate(candidate: ApprovedEquipmentCandidate): NewProductListing {
  return {
    id: `approved-equipment-${candidate.id}`,
    category: 'new-products',
    title: candidate.title_public_draft || 'Reviewed Equipment Listing',
    description: candidate.description_public_draft || 'Reviewed commercial equipment listing.',
    price: 'Price on request',
    vendor: 'Available on inquiry',
    condition: 'new',
    location: candidate.region_available || 'Region available on request',
    tags: [candidate.subcategory || 'Equipment', 'Inquiry Required'],
    postedDate: candidate.created_at.slice(0, 10),
    image: buildImage(candidate)
  };
}

export async function getApprovedEquipmentListings(): Promise<NewProductListing[]> {
  const result = await fetchAdminSupabaseJson<ApprovedEquipmentCandidate[]>("/rest/v1/marketplace_candidates?select=id,title_public_draft,description_public_draft,region_available,subcategory,image_url,image_alt,image_status,image_reviewed_at,image_attribution,image_allowed_use,status,marketplace_category,created_at&marketplace_category=eq.New%20Products&status=eq.approved_draft&order=created_at.desc");

  if (!result.ok) {
    return [];
  }

  return result.data
    .filter((candidate) => candidate.marketplace_category === NEW_PRODUCTS_CATEGORY)
    .map(projectApprovedEquipmentCandidate);
}
