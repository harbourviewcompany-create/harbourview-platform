import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient, createSupabaseServiceClient, getAuthenticatedUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'document'
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })

  const sessionClient = await createClient()
  const { data: personId, error: personError } = await sessionClient.rpc('talent_ensure_my_person')
  if (personError || typeof personId !== 'string') return NextResponse.json({ error: 'PASSPORT_REQUIRED' }, { status: 400 })

  let form: FormData
  try { form = await request.formData() } catch { return NextResponse.json({ error: 'INVALID_MULTIPART' }, { status: 400 }) }
  const file = form.get('file')
  if (!(file instanceof File) || file.size <= 0 || file.size > MAX_BYTES || !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'INVALID_DOCUMENT' }, { status: 400 })
  }
  const documentType = typeof form.get('documentType') === 'string' ? String(form.get('documentType')) : 'resume'
  const applicationIdRaw = typeof form.get('applicationId') === 'string' ? String(form.get('applicationId')).trim() : ''
  const applicationId = applicationIdRaw && /^[0-9a-f-]{36}$/i.test(applicationIdRaw) ? applicationIdRaw : null
  if (applicationIdRaw && !applicationId) return NextResponse.json({ error: 'INVALID_APPLICATION' }, { status: 400 })

  const bytes = Buffer.from(await file.arrayBuffer())
  const hash = createHash('sha256').update(bytes).digest('hex')
  const objectPath = `${personId}/${crypto.randomUUID()}-${safeName(file.name)}`
  const service = await createSupabaseServiceClient()
  const { error: uploadError } = await service.storage.from('talent-private').upload(objectPath, bytes, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) return NextResponse.json({ error: 'DOCUMENT_UPLOAD_FAILED' }, { status: 502 })

  const { data: documentId, error: registerError } = await service.rpc('talent_register_document', {
    p_user_id: user.id,
    p_application_id: applicationId,
    p_document_type: documentType,
    p_storage_path: objectPath,
    p_file_name: safeName(file.name),
    p_content_type: file.type,
    p_size_bytes: file.size,
    p_content_hash: hash,
  })
  if (registerError) {
    await service.storage.from('talent-private').remove([objectPath]).catch(() => undefined)
    return NextResponse.json({ error: 'DOCUMENT_REGISTER_FAILED' }, { status: registerError.code === '42501' ? 403 : 400 })
  }

  return NextResponse.json({ data: { id: documentId, fileName: safeName(file.name), documentType } }, { status: 201, headers: { 'Cache-Control': 'no-store, private' } })
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
  const documentId = new URL(request.url).searchParams.get('id')?.trim() ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(documentId)) return NextResponse.json({ error: 'INVALID_DOCUMENT' }, { status: 400 })

  const service = await createSupabaseServiceClient()
  const { data, error } = await service.rpc('talent_document_access_context', { p_document_id: documentId, p_user_id: user.id })
  const row = Array.isArray(data) ? data[0] : null
  if (error || !row) {
    await service.rpc('talent_record_document_access', { p_document_id: documentId, p_user_id: user.id, p_action: 'denied', p_request_id: request.headers.get('x-request-id') }).catch(() => undefined)
    return NextResponse.json({ error: 'DOCUMENT_NOT_FOUND' }, { status: 404 })
  }

  const { data: signed, error: signError } = await service.storage.from(row.storage_bucket).createSignedUrl(row.storage_path, 60)
  if (signError || !signed?.signedUrl) return NextResponse.json({ error: 'DOCUMENT_ACCESS_FAILED' }, { status: 502 })
  await service.rpc('talent_record_document_access', { p_document_id: documentId, p_user_id: user.id, p_action: 'view', p_request_id: request.headers.get('x-request-id') }).catch(() => undefined)
  return NextResponse.json({ data: { url: signed.signedUrl, expiresIn: 60, fileName: row.file_name, contentType: row.content_type } }, { headers: { 'Cache-Control': 'no-store, private' } })
}
