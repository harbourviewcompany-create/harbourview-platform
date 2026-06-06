'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { getAdminDataClient } from '@/lib/supabase/adminDataClient';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_CATEGORIES = [
  'new_products','used_surplus','cannabis_inventory','wanted_requests','services',
  'business_opportunities','supplier_directory','cultivation_equipment','export_ready',
  'import_demand','consumables','distressed_inventory','distressed_businesses','genetics',
  'professional_services','labs_testing','logistics','packaging','processing_equipment',
] as const;

const VALID_SELLER_TYPES = [
  'licensed_producer','distributor','wholesaler','retailer','investor','other',
] as const;

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

function read(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

export type PromoteResult =
  | { ok: true; listingId: string; slug: string }
  | { ok: false; error: string };

export async function promoteInquiryToListing(
  inquiryId: string,
  formData: FormData,
): Promise<PromoteResult> {
  await requireAdminAuth();

  if (!UUID_RE.test(inquiryId)) return { ok: false, error: 'Invalid inquiry ID' };

  const title       = read(formData, 'title');
  const description = read(formData, 'description');
  const category    = read(formData, 'category');
  const sellerType  = read(formData, 'seller_type');
  const sellerName  = read(formData, 'seller_name');
  const region      = read(formData, 'region') || 'global';
  const priceRaw    = read(formData, 'price_amount');
  const currency    = read(formData, 'price_currency') || 'USD';
  const productType = read(formData, 'product_type');
  const country     = read(formData, 'location_country');

  if (!title || !description || !category || !sellerName) {
    return { ok: false, error: 'Title, description, category and seller name are required' };
  }

  if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    return { ok: false, error: 'Invalid category' };
  }

  const client = getAdminDataClient();
  if (!client.ok) return { ok: false, error: 'Admin client not configured' };
  const { url, serviceRoleKey } = client.data;

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  // Generate unique slug
  const baseSlug = slugify(title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const listing = {
    title,
    slug,
    description,
    category,
    status: 'approved',
    public_visibility: true,
    seller_type: VALID_SELLER_TYPES.includes(sellerType as typeof VALID_SELLER_TYPES[number])
      ? sellerType : 'other',
    seller_name: sellerName,
    seller_verified: false,
    region,
    location_country: country || null,
    price_amount: priceRaw ? parseFloat(priceRaw) : null,
    price_currency: currency,
    product_type: productType || null,
    high_level_specs: {},
  };

  const insertRes = await fetch(`${url}/rest/v1/listings`, {
    method: 'POST',
    headers,
    body: JSON.stringify(listing),
    cache: 'no-store',
  });

  if (!insertRes.ok) {
    const err = await insertRes.text().catch(() => 'unknown');
    return { ok: false, error: `Listing insert failed: ${err.slice(0, 200)}` };
  }

  const rows = await insertRes.json() as { id: string }[];
  const listingId = rows[0]?.id;
  if (!listingId) return { ok: false, error: 'No listing ID returned' };

  // Link inquiry → listing and close it
  await fetch(`${url}/rest/v1/marketplace_inquiries?id=eq.${encodeURIComponent(inquiryId)}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({
      listing_id: listingId,
      review_status: 'closed',
      internal_response_notes: `Promoted to listing ${listingId} (slug: ${slug})`,
    }),
    cache: 'no-store',
  });

  revalidatePath('/admin/inquiries');
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  revalidatePath('/marketplace/consumables');
  revalidatePath('/marketplace/listings');

  return { ok: true, listingId, slug };
}
