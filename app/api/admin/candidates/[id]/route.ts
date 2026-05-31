// app/api/admin/candidates/[id]/route.ts
// Admin API for approving or rejecting scraped candidates.
// PATCH { action: 'approve' | 'reject', fields?: Partial<listing> }
// Uses raw PostgREST fetch — no @supabase/supabase-js dependency.

import 'server-only'
import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { resolveLockedSupabaseUrl } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

interface ServiceConfig { url: string; key: string }

function getServiceConfig(): ServiceConfig {
  const url = resolveLockedSupabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')
  return { url, key }
}

function serviceHeaders(key: string, extra?: Record<string, string>) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

async function pgFetch<T>(
  { url, key }: ServiceConfig,
  path: string,
  options?: RequestInit & { prefer?: string },
): Promise<{ data: T | null; error: string | null }> {
  const headers: Record<string, string> = serviceHeaders(key)
  if (options?.prefer) headers.Prefer = options.prefer
  const res = await fetch(`${url}/rest/v1/${path}`, { ...options, headers, cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text()
    return { data: null, error: `${res.status}: ${text}` }
  }
  const text = await res.text()
  return { data: text ? (JSON.parse(text) as T) : null, error: null }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80) + '-' + Math.random().toString(36).slice(2, 8)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminAuth()
  const { id } = await params
  const body = await request.json() as { action: 'approve' | 'reject'; fields?: Record<string, unknown> }
  const { action, fields } = body
  const cfg = getServiceConfig()

  if (action === 'reject') {
    const { error } = await pgFetch(cfg, `marketplace_candidates?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'rejected', reviewed_at: new Date().toISOString() }),
      prefer: 'return=minimal',
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, action: 'rejected' })
  }

  if (action === 'approve') {
    // Fetch the candidate
    const { data: rows, error: fetchErr } = await pgFetch<Record<string, unknown>[]>(
      cfg,
      `marketplace_candidates?id=eq.${id}&select=*`,
    )
    const candidate = rows?.[0]
    if (fetchErr || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    const title = (fields?.title as string) || (candidate.title_public_draft as string) || (candidate.title_internal as string)
    const description = (fields?.description as string) || (candidate.description_public_draft as string) || (candidate.description_internal as string)

    const cat = candidate.marketplace_category as string
    const marketplaceSection = (() => {
      if (['used_surplus', 'processing_equipment', 'cultivation_equipment'].includes(cat)) return 'equipment'
      if (['packaging', 'consumables'].includes(cat)) return 'consumables'
      if (['labs_testing', 'logistics', 'professional_services', 'services'].includes(cat)) return 'services'
      if (['cannabis_inventory', 'export_ready', 'import_demand'].includes(cat)) return 'consumables'
      if (['business_opportunities', 'distressed_businesses'].includes(cat)) return 'business_opportunities'
      return 'equipment'
    })()

    // Insert into public listings table
    const { data: listingRows, error: insertErr } = await pgFetch<{ id: string }[]>(
      cfg,
      'listings',
      {
        method: 'POST',
        prefer: 'return=representation',
        body: JSON.stringify({
          title,
          slug: slugify(title),
          description,
          category: cat,
          marketplace_section: marketplaceSection,
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
        }),
      },
    )
    if (insertErr || !listingRows?.[0]) {
      return NextResponse.json({ error: insertErr ?? 'Insert failed' }, { status: 500 })
    }

    // Mark candidate as approved + link to listing
    await pgFetch(cfg, `marketplace_candidates?id=eq.${id}`, {
      method: 'PATCH',
      prefer: 'return=minimal',
      body: JSON.stringify({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        promoted_listing_id: listingRows[0].id,
      }),
    })

    return NextResponse.json({ ok: true, action: 'approved', listingId: listingRows[0].id })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
