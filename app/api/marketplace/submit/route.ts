import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'
import { decideTierAAutoPublish, tierAAutoPublishSuccessMessage } from '@/lib/marketplace/tierAAutoPublish'
import { promoteTierACandidateToListing } from '@/lib/marketplace/promoteTierAListing'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_IMAGES = 5
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const IMAGE_BUCKET = 'marketplace-item-originals'

const RESERVED_KEYS = new Set([
  'title', 'message', 'category_key', 'listing_type_key', 'listing_type',
  'country', 'price_or_budget', 'listing_headline', 'target_markets',
  'hp_field', 'images',
])

export async function POST(req: NextRequest) {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── 2. Parse FormData ──────────────────────────────────────────────────────
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  // Honeypot
  if ((form.get('hp_field') as string | null)?.trim()) {
    return NextResponse.json({ status: 'success', message: 'Submission received.' })
  }

  // ── 3. Extract fields ──────────────────────────────────────────────────────
  // Real column names: marketplace_category, candidate_type, listing_type, price_raw, raw_payload
  const title        = (form.get('title')           as string | null)?.trim() ?? ''
  const description  = (form.get('message')         as string | null)?.trim() ?? ''
  const categoryKey  = (form.get('category_key')    as string | null)?.trim() ?? ''
  const typeKey      = (form.get('listing_type_key') as string | null)?.trim() ?? ''
  const typeLabel    = (form.get('listing_type')     as string | null)?.trim() ?? ''
  const country      = (form.get('country')          as string | null)?.trim() || null
  const priceRaw     = (form.get('price_or_budget')  as string | null)?.trim() || null

  if (title.length < 3) {
    return NextResponse.json({ error: 'Title is required (min 3 characters)' }, { status: 400 })
  }
  if (!categoryKey) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 })
  }

  // ── 4. Collect extra structured fields into raw_payload ────────────────────
  const rawPayload: Record<string, string> = {}
  for (const [key, value] of form.entries()) {
    if (!RESERVED_KEYS.has(key) && typeof value === 'string' && value.trim()) {
      rawPayload[key] = value.trim()
    }
  }
  if (description)  rawPayload.description   = description
  if (priceRaw)     rawPayload.price_or_budget = priceRaw

  // ── 5. Tier A auto-publish decision ────────────────────────────────────────
  const publishDecision = decideTierAAutoPublish({
    categoryKey,
    title,
    description,
    listingTypeKey: typeKey || null,
  })

  if (publishDecision.autoPublish) {
    rawPayload.auto_publish = 'true'
    rawPayload.auto_published_at = new Date().toISOString()
  } else if (publishDecision.holdReasons.length) {
    rawPayload.auto_publish_hold_reasons = publishDecision.holdReasons.join('|')
  }

  // ── 6. Insert row ──────────────────────────────────────────────────────────
  const svc = await createSupabaseServiceClient()

  const insertRow: Record<string, unknown> = {
    // Core columns (matching actual schema)
    candidate_type:       typeKey || 'unknown',
    marketplace_category: categoryKey,
    listing_type:         typeLabel || null,
    title_public_draft:   title,
    description_internal: description || null,
    country:              country,
    price_raw:            priceRaw,
    status:               publishDecision.status,
    seller_type:          'self_serve',
    // Self-serve tracking columns (added by migration)
    submitted_by:         user.id,
    submission_source:    'self_serve',
    submission_images:    [],
    // Structured extras in raw_payload
    raw_payload:          rawPayload,
    discovered_at:        new Date().toISOString(),
  }

  // Public surface fields for auto-published Tier A listings
  if (publishDecision.autoPublish) {
    insertRow.description_public_draft = description || title
    insertRow.requires_license_review = false
    insertRow.restricted_item = false
    insertRow.reviewed_at = new Date().toISOString()
  }

  const { data: candidate, error: insertErr } = await svc
    .from('marketplace_candidates')
    .insert(insertRow)
    .select('id')
    .single()

  if (insertErr || !candidate?.id) {
    console.error('[marketplace/submit] insert error', insertErr)
    return NextResponse.json(
      { error: 'Failed to create submission. Please try again.' },
      { status: 500 },
    )
  }

  const candidateId = candidate.id as string

  // ── 7. Image uploads ───────────────────────────────────────────────────────
  const imageEntries = form.getAll('images')
  const imageFiles = imageEntries
    .filter((e): e is File => e instanceof File && e.size > 0)
    .slice(0, MAX_IMAGES)

  const imagePaths: string[] = []

  for (const file of imageFiles) {
    if (!ALLOWED_MIME.has(file.type)) continue
    if (file.size > MAX_IMAGE_BYTES) continue
    const ext = file.type.split('/')[1] ?? 'jpg'
    const storagePath = `submissions/${candidateId}/original/${crypto.randomUUID()}.${ext}`
    const buffer = await file.arrayBuffer()
    const { error: uploadErr } = await svc.storage
      .from(IMAGE_BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false })
    if (!uploadErr) imagePaths.push(storagePath)
    else console.error('[marketplace/submit] image upload error', uploadErr)
  }

  if (imagePaths.length > 0) {
    await svc
      .from('marketplace_candidates')
      .update({ submission_images: imagePaths })
      .eq('id', candidateId)
  }

  let listingId: string | null = null
  let listingSlug: string | null = null
  if (publishDecision.autoPublish) {
    const promoted = await promoteTierACandidateToListing(svc, {
      candidateId,
      categoryKey,
      title,
      description: description || title,
      country,
      priceRaw,
      listingTypeLabel: typeLabel || null,
      submittedBy: user.id,
      sellerEmail: user.email ?? null,
    })
    if (promoted.ok) {
      listingId = promoted.listingId
      listingSlug = promoted.slug
      console.info('[marketplace/submit] tier_a_auto_published', {
        candidateId,
        listingId,
        slug: listingSlug,
        categoryKey,
      })
      try {
        revalidatePath('/dashboard')
        revalidatePath('/marketplace')
        revalidatePath('/marketplace/consumables')
        revalidatePath('/marketplace/listings')
      } catch {
        // ignore revalidate errors in route handlers
      }
    } else {
      console.error('[marketplace/submit] tier_a_promote_failed', {
        candidateId,
        categoryKey,
        error: promoted.error,
      })
      // Candidate remains approved_draft; ops can promote manually. Do not fail the request.
    }
  }

  // Best-effort review event for audit trail (ignore failures)
  try {
    await svc.from('marketplace_candidate_review_events').insert({
      candidate_id: candidateId,
      event_type: publishDecision.autoPublish ? 'auto_published' : 'submitted_for_review',
      from_status: null,
      to_status: publishDecision.status,
      note: publishDecision.autoPublish
        ? 'Tier A auto-publish after light safety checks'
        : (publishDecision.holdReasons.join('; ') || 'Held for Harbourview review'),
      created_by: user.id,
    })
  } catch (eventErr) {
    console.warn('[marketplace/submit] review event skipped', eventErr)
  }

  return NextResponse.json({
    status: 'success',
    candidateId,
    listingId,
    listingSlug,
    imageCount: imagePaths.length,
    autoPublished: publishDecision.autoPublish,
    message: tierAAutoPublishSuccessMessage(publishDecision.autoPublish),
  })
}
