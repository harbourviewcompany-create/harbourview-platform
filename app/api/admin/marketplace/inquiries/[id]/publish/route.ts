import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { getAdminDataClient } from '@/lib/supabase/adminDataClient'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Props = { params: Promise<{ id: string }> }

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    + '-' + Date.now().toString(36)
}

function mapRegion(r: string): string {
  const map: Record<string, string> = {
    canada: 'north_america', 'united states': 'north_america', us: 'north_america', usa: 'north_america',
    germany: 'europe', uk: 'europe', netherlands: 'europe', eu: 'europe', europe: 'europe',
  }
  return map[r.toLowerCase()] ?? 'global'
}

export async function POST(request: Request, { params }: Props) {
  await requireAdminAuth()

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const client = getAdminDataClient()
  if (!client.ok) return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 })

  // Read the inquiry
  const inquiryRes = await fetch(
    `${client.data.url}/rest/v1/marketplace_inquiries?id=eq.${encodeURIComponent(id)}&limit=1`,
    {
      headers: {
        apikey: client.data.serviceRoleKey,
        Authorization: `Bearer ${client.data.serviceRoleKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  )
  if (!inquiryRes.ok) return NextResponse.json({ error: 'Could not fetch inquiry' }, { status: 502 })
  const rows: Record<string, unknown>[] = await inquiryRes.json()
  const inquiry = rows[0]
  if (!inquiry) return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })

  // Merge admin edits from request body
  let body: Record<string, string> = {}
  try { body = await request.json() } catch { /* no body */ }

  const title = body.title || String(inquiry.contact_company || inquiry.contact_name || 'Untitled listing')
  const description = body.description || String(inquiry.message || '').split('Harbourview action requested')[0].trim()
  const productType = body.product_type || 'General supply'
  const locationCountry = body.location_country?.toUpperCase().slice(0, 2) || null
  const region = mapRegion(body.region || locationCountry || '')
  const category = (inquiry.inquiry_type === 'wanted_request_submission') ? 'consumables' : 'consumables'

  // Insert into listings
  const listing = {
    title,
    slug: slugify(title),
    category,
    description,
    product_type: productType,
    region,
    seller_type: 'other',
    status: 'approved',
    public_visibility: true,
    marketplace_section: 'consumables',
    location_country: locationCountry,
    is_featured: false,
    high_level_specs: {
      submitted_by: inquiry.contact_name,
      submitted_by_company: inquiry.contact_company,
      intake_source: 'marketplace_intake_form',
      cta_label: 'Request qualification',
    },
    price_currency: 'USD',
  }

  const insertRes = await fetch(
    `${client.data.url}/rest/v1/listings`,
    {
      method: 'POST',
      headers: {
        apikey: client.data.serviceRoleKey,
        Authorization: `Bearer ${client.data.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(listing),
      cache: 'no-store',
    }
  )

  if (!insertRes.ok) {
    const err = await insertRes.text()
    return NextResponse.json({ error: `Failed to create listing: ${err}` }, { status: 502 })
  }

  const newListing: Record<string, unknown>[] = await insertRes.json()

  // Mark inquiry as published
  await fetch(
    `${client.data.url}/rest/v1/marketplace_inquiries?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: client.data.serviceRoleKey,
        Authorization: `Bearer ${client.data.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        review_status: 'published',
        listing_id: newListing[0]?.id ?? null,
        internal_notes: `Published as listing ${newListing[0]?.id ?? 'unknown'} at ${new Date().toISOString()}`,
      }),
      cache: 'no-store',
    }
  )

  return NextResponse.json({ ok: true, listing_id: newListing[0]?.id })
}
