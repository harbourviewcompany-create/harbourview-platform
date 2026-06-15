import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_IMAGES = 5
const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const IMAGE_BUCKET = 'marketplace-item-originals'

// Fields pulled from FormData into top-level candidate columns; everything else → private_specs
const RESERVED_KEYS = new Set([
  'title', 'message', 'category_key', 'listing_type_key', 'listing_type',
  'country', 'price_or_budget', 'listing_headline', 'target_markets',
  'hp_field', 'images',
])

export async function POST(req: NextRequest) {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Parse FormData ──────────────────────────────────────────────────────
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  // Honeypot check
  if ((form.get('hp_field') as string | null)?.trim()) {
    return NextResponse.json({ status: 'success', message: 'Submission received.' })
  }

  // ── 3. Extract required fields ─────────────────────────────────────────────
  const title = (form.get('title') as string | null)?.trim() ?? ''
  const description = (form.get('message') as string | null)?.trim() ?? ''
  const categoryKey = (form.get('category_key') as string | null)?.trim() ?? ''
  const listingTypeKey = (form.get('listing_type_key') as string | null)?.trim() ?? null
  const listingTypeLabel = (form.get('listing_type') as string | null)?.trim() ?? null
  const country = (form.get('country') as string | null)?.trim() || null
  const priceOrBudget = (form.get('price_or_budget') as string | null)?.trim() || null

  if (title.length < 3) {
    return NextResponse.json({ error: 'Title is required (min 3 characters)' }, { status: 400 })
  }
  if (!categoryKey) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 })
  }

  // ── 4. Collect extra fields into private_specs ─────────────────────────────
  const privateSpecs: Record<string, string> = {}
  for (const [key, value] of form.entries()) {
    if (
      !RESERVED_KEYS.has(key) &&
      typeof value === 'string' &&
      value.trim()
    ) {
      privateSpecs[key] = value.trim()
    }
  }
  if (description) privateSpecs.description = description
  if (priceOrBudget) privateSpecs.price_or_budget = priceOrBudget
  if (listingTypeLabel) privateSpecs.listing_type = listingTypeLabel

  // ── 5. Insert marketplace_candidates row ──────────────────────────────────
  const svc = await createSupabaseServiceClient()

  const { data: candidate, error: insertErr } = await svc
    .from('marketplace_candidates')
    .insert({
      title_public_draft: title,
      category_key: categoryKey,
      listing_type_key: listingTypeKey ?? null,
      country: country ?? null,
      submitted_by: user.id,
      submission_source: 'self_serve',
      status: 'needs_review',
      publication_status: 'not_publishable',
      verification_status: 'unverified',
      seller_authorization_status: 'unknown',
      monetization_path: 'manual_review',
      discovered_at: new Date().toISOString(),
      private_specs: privateSpecs,
      high_level_specs: {},
      public_payload: { category: categoryKey, country: country ?? null },
      required_documents: [],
      asking_price_text: priceOrBudget ?? null,
      submission_images: [],
    })
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

  // ── 6. Handle image uploads ────────────────────────────────────────────────
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

    if (!uploadErr) {
      imagePaths.push(storagePath)
    } else {
      console.error('[marketplace/submit] image upload error', uploadErr)
    }
  }

  // ── 7. Persist image paths ─────────────────────────────────────────────────
  if (imagePaths.length > 0) {
    await svc
      .from('marketplace_candidates')
      .update({ submission_images: imagePaths })
      .eq('id', candidateId)
  }

  return NextResponse.json({
    status: 'success',
    candidateId,
    imageCount: imagePaths.length,
    message: 'Submission received. Harbourview will review your listing within 2 business days.',
  })
}
