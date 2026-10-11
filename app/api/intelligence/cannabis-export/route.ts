import { NextRequest, NextResponse } from 'next/server'

import { getAdminAuthCheck } from '@/lib/admin-auth'
import {
  CannabisExportSchemaUnavailableError,
  loadCannabisExportWorkspace,
  updateCannabisExportRecord,
  type CannabisExportMutableResource,
} from '@/lib/intelligence/cannabisExportWorkspace'

export const dynamic = 'force-dynamic'

function authFailure(reason: 'missing_access_token' | 'invalid_access_token' | 'missing_admin_role') {
  if (reason === 'missing_admin_role') {
    return NextResponse.json({ error: 'Admin or operator access required.' }, { status: 403 })
  }
  return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
}

function schemaUnavailable(error: CannabisExportSchemaUnavailableError) {
  return NextResponse.json(
    {
      error: error.message,
      code: 'CANNABIS_EXPORT_SCHEMA_UNAVAILABLE',
      retryable: true,
    },
    { status: 503 },
  )
}

export async function GET(request: NextRequest) {
  const auth = await getAdminAuthCheck(request)
  if (!auth.ok) return authFailure(auth.reason)

  try {
    const data = await loadCannabisExportWorkspace()
    return NextResponse.json({
      data,
      meta: {
        private: true,
        userId: auth.auth.user.id,
        roles: auth.auth.roles,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof CannabisExportSchemaUnavailableError) return schemaUnavailable(error)
    console.error('cannabis_export_workspace_read_failed', error)
    return NextResponse.json({ error: 'Unable to load cannabis export workspace.' }, { status: 500 })
  }
}

const RESOURCES = new Set<CannabisExportMutableResource>([
  'account',
  'contact',
  'match',
  'rfq',
  'deal',
  'task',
])

export async function PATCH(request: NextRequest) {
  const auth = await getAdminAuthCheck(request)
  if (!auth.ok) return authFailure(auth.reason)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const raw = body as Record<string, unknown>
  const resource = raw.resource
  const id = raw.id
  const patch = raw.patch

  if (typeof resource !== 'string' || !RESOURCES.has(resource as CannabisExportMutableResource)) {
    return NextResponse.json({ error: 'Unsupported resource.' }, { status: 400 })
  }
  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'Missing record id.' }, { status: 400 })
  }
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return NextResponse.json({ error: 'Patch must be an object.' }, { status: 400 })
  }

  try {
    const data = await updateCannabisExportRecord({
      resource: resource as CannabisExportMutableResource,
      id,
      patch: patch as Record<string, unknown>,
    })
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof CannabisExportSchemaUnavailableError) return schemaUnavailable(error)
    const message = error instanceof Error ? error.message : 'Update failed.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
