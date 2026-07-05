// app/api/admin/intelligence/dossiers/[id]/download/route.ts
//
// Admin-only signed-URL redirect for a dossier's source file. The file
// lives in a private Storage bucket (project-vault) by design — dossiers
// are "CONFIDENTIAL — qualified counterparties" deliverables, not public
// downloads (see the "Request the Full Dossier" CTA on the public country
// page, which intentionally does not link here). Direct download access is
// admin-only, matching the same signed-URL pattern used for genetics
// evidence (lib/genetics/storage.ts).

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { streamDriveFile } from '@/lib/google/driveClient'
import { Readable } from 'node:stream'

const SIGNED_URL_TTL_SECONDS = 120

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminAuth()
  const { id } = await params

  const supabase = await createSupabaseServiceClient()
  const { data: dossier, error: fetchErr } = await supabase
    .from('dossiers')
    .select('storage_bucket, file_path, drive_file_id, title')
    .eq('id', id)
    .single()

  if (fetchErr || !dossier || (!dossier.drive_file_id && !(dossier.storage_bucket && dossier.file_path))) {
    return NextResponse.json({ error: 'Dossier file not found' }, { status: 404 })
  }

  const safeName = dossier.title.replace(/[^\w\s—-]/g, '')

  // Prefer Google Drive if a file ID is set.
  if (dossier.drive_file_id) {
    try {
      const { stream, mimeType } = await streamDriveFile(dossier.drive_file_id)
      const webStream = Readable.toWeb(stream as Readable) as ReadableStream
      return new NextResponse(webStream, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${safeName}.docx"`,
        },
      })
    } catch (err) {
      console.error('Drive download failed:', err instanceof Error ? err.message : err)
      return NextResponse.json({ error: 'Drive download failed — check GOOGLE_SERVICE_ACCOUNT_JSON_B64 is set and the file is shared with the service account' }, { status: 502 })
    }
  }

  // Fall back to Supabase Storage signed URL.
  const { data, error } = await supabase.storage
    .from(dossier.storage_bucket!)
    .createSignedUrl(dossier.file_path!, SIGNED_URL_TTL_SECONDS, { download: `${safeName}.docx` })

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate signed URL' }, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}
