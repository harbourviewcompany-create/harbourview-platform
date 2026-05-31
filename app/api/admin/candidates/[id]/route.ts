// app/api/admin/candidates/[id]/route.ts
// Admin API for approving or rejecting scraped candidates.
// PATCH { action: 'approve' | 'reject' | 'edit', fields?: Partial<listing> }

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '@/lib/auth/adminGuard'

export const dynamic = 'force-dynamic'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)
    + '-' + Math.random().toString(36).slice(2, 8)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminAuth()
  const { id } = await params
  const body = await request.json()
  const { action, fields } = body as { action: 'approve' | 'reject'; fields?: Record<string, unknown> }
  const supabase = getServiceClient()

  if (action === 'reject') {
    const { error } = await supabase
      .from('marketplace_candidates')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, action: 'rejected' })
  }

  if (action === 'approve') {
    // Fetch the candidate
    const { data: candidate, error: fetchErr } = await supabase
      .from('marketplace_candidates')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    const title = (fields?.title as string) || candidate.title_public_draft || candidate.title_internal
    const description = (fields?.description as string) || candidate.description_public_draft || candidate.description_internal

    // Insert into public listings table
    const { data: listing, error: insertErr } = await supabase
      .from('listings')
      .insert({
        title,
        slug: slugify(title),
        description,
        category: candidate.marketplace_category,
        marketplace_section: (() => {
          const cat = candidate.marketplace_category as string
          if (['used_surplus','processing_equipment','cultivation_equipment'].includes(cat)) return 'equipment'
          if (['packaging','consumables'].includes(cat)) return 'consumables'
          if (['labs_testing','logistics','professional_services','services'].includes(cat)) return 'services'
          if (['cannabis_inventory','export_ready','import_demand'].includes(cat)) return 'consumables'
          if (['business_opportunities','distressed_businesses'].includes(cat)) return 'business_opportunities'
          return 'equipment'
        })(),
        product_type: candidate.product_type || null,
        region: candidate.region || 'north_america',
        location_country: candidate.country || null,
        price_amount: candidate.price_amount || null,
        price_currency: candidate.price_currency || null,
        condition: candidate.condition || null,
        seller_type: candidate.seller_type || 'other',
        status: 'approved',
        public_visibility: true,
        is_featured: false,
        high_level_specs: {
          cta_label: 'Request Harbourview review',
          source_id: candidate.source_id,
        },
      })
      .select('id')
      .single()

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    // Mark candidate as approved + link to listing
    await supabase
      .from('marketplace_candidates')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        promoted_listing_id: listing.id,
      })
      .eq('id', id)

    return NextResponse.json({ ok: true, action: 'approved', listingId: listing.id })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
