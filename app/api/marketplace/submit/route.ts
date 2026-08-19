import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_IMAGES = 6
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_DOCUMENTS = 6
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_DOCUMENT_MIME = new Set(['application/pdf', 'text/csv'])
const IMAGE_BUCKET = 'marketplace-item-originals'

const RESERVED_KEYS = new Set([
  'title', 'message', 'category_key', 'listing_type_key', 'listing_type',
  'country', 'price_or_budget', 'listing_headline', 'target_markets',
  'hp_field', 'images', 'documents',
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
  if (description) rawPayload.description = description
  if (priceRaw) rawPayload.price_or_budget = priceRaw

  // ── 5. Insert private candidate row ────────────────────────────────────────
  const svc = await createSupabaseServiceClient()

  const { data: candidate, error: insertErr } = await svc
    .from('marketplace_candidates')
    .insert({
      candidate_type:       typeKey || 'unknown',
      marketplace_category: categoryKey,
      listing_type:         typeLabel || null,
      title_public_draft:   title,
      description_internal: description || null,
      country:              country,
      price_raw:            priceRaw,
      status:               'needs_review',
      seller_type:          'self_serve',
      submitted_by:         user.id,
      submission_source:    'self_serve',
      submission_images:    [],
      raw_payload:          rawPayload,
      discovered_at:        new Date().toISOString(),
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

  // ── 6. Private image uploads ────────────────────────────────────────────────
  const imageFiles = form.getAll('images')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, MAX_IMAGES)

  const imagePaths: string[] = []
  for (const file of imageFiles) {
    if (!ALLOWED_MIME.has(file.type) || file.size > MAX_IMAGE_BYTES) continue
    const ext = file.type.split('/')[1] ?? 'jpg'
    const storagePath = `submissions/${candidateId}/original/${crypto.randomUUID()}.${ext}`
    const buffer = await file.arrayBuffer()
    const { error: uploadErr } = await svc.storage
      .from(IMAGE_BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false })
    if (!uploadErr) imagePaths.push(storagePath)
    else console.error('[marketplace/submit] image upload error', uploadErr)
  }

  // ── 7. Private supporting-document uploads ─────────────────────────────────
  // These paths remain on the candidate raw payload. They are never projected to
  // public marketplace pages automatically; an operator must separately approve
  // any public document URL in the published listing contract.
  const documentFiles = form.getAll('documents')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, MAX_DOCUMENTS)

  const documentPaths: string[] = []
  for (const file of documentFiles) {
    if (!ALLOWED_DOCUMENT_MIME.has(file.type) || file.size > MAX_DOCUMENT_BYTES) continue
    const ext = file.type === 'application/pdf' ? 'pdf' : 'csv'
    const storagePath = `submissions/${candidateId}/documents/${crypto.randomUUID()}.${ext}`
    const buffer = await file.arrayBuffer()
    const { error: uploadErr } = await svc.storage
      .from(IMAGE_BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false })
    if (!uploadErr) documentPaths.push(storagePath)
    else console.error('[marketplace/submit] document upload error', uploadErr)
  }

  if (imagePaths.length > 0 || documentPaths.length > 0) {
    const nextRawPayload = {
      ...rawPayload,
      ...(documentPaths.length > 0 ? { submission_document_paths: JSON.stringify(documentPaths) } : {}),
    }
    const { error: attachmentUpdateError } = await svc
      .from('marketplace_candidates')
      .update({
        submission_images: imagePaths,
        raw_payload: nextRawPayload,
      })
      .eq('id', candidateId)
    if (attachmentUpdateError) {
      console.error('[marketplace/submit] attachment metadata update error', attachmentUpdateError)
    }
  }

  return NextResponse.json({
    status: 'success',
    candidateId,
    imageCount: imagePaths.length,
    documentCount: documentPaths.length,
    message: 'Submission received. Harbourview will review your listing within 2 business days.',
  })
}
