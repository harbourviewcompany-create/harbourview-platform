// lib/google/driveClient.ts
//
// Server-only Google Drive API client, authenticated via a service account
// (not user OAuth — this reads files from a Drive folder Harbourview
// controls and shares with the service account directly, no per-user
// consent flow needed).
//
// REQUIRES ONE-TIME MANUAL SETUP (cannot be done from code):
//   1. Create/reuse a Google Cloud project, enable the Google Drive API.
//   2. Create a Service Account in that project, generate a JSON key.
//   3. Base64-encode the entire JSON key file and set it as the
//      GOOGLE_SERVICE_ACCOUNT_JSON_B64 env var in Vercel (Production +
//      Preview). Base64 avoids the private_key newline-escaping issues
//      that commonly break plain-JSON env vars.
//        macOS/Linux:  base64 -i service-account.json | tr -d '\n'
//   4. In Google Drive, share the target folder (or individual dossier
//      files) with the service account's email address — it looks like
//      xxxxx@your-project.iam.gserviceaccount.com, found in the JSON key's
//      "client_email" field — Viewer access is sufficient.
//   5. Get each file's Drive file ID (from its share URL:
//      drive.google.com/file/d/FILE_ID_HERE/view) and store it in
//      dossiers.drive_file_id.
//
// Until step 3 is done, getDriveClient() throws a clear, specific error
// rather than a confusing auth failure deep in googleapis internals.

import 'server-only'
import { drive, drive_v3 } from '@googleapis/drive'
import { JWT } from 'googleapis-common'

let cachedClient: drive_v3.Drive | null = null

function loadServiceAccountCredentials(): { client_email: string; private_key: string } {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64
  if (!b64) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON_B64 is not set. See lib/google/driveClient.ts header comment for one-time setup steps.',
    )
  }
  let parsed: { client_email?: string; private_key?: string }
  try {
    parsed = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'))
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON_B64 is set but is not valid base64-encoded JSON.')
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON_B64 decoded but is missing client_email or private_key.')
  }
  return { client_email: parsed.client_email, private_key: parsed.private_key }
}

/** Returns a cached, authenticated Drive API client. Throws if credentials are missing/invalid — callers should catch and degrade gracefully (see dossierQuery.ts), never let this crash a page render. */
export function getDriveClient(): drive_v3.Drive {
  if (cachedClient) return cachedClient
  const { client_email, private_key } = loadServiceAccountCredentials()
  const auth = new JWT({
    email: client_email,
    key: private_key,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  cachedClient = drive({ version: 'v3', auth })
  return cachedClient
}

export type DriveFileMetadata = {
  id: string
  name: string
  mimeType: string
  size: number | null
  modifiedTime: string | null
}

/** Fetches basic metadata for a Drive file. Returns null on any error (missing creds, file not shared with the service account, bad ID, etc.) rather than throwing — this is enrichment, not a hard dependency for page rendering. */
export async function getDriveFileMetadata(fileId: string): Promise<DriveFileMetadata | null> {
  try {
    const drive = getDriveClient()
    const res = await drive.files.get({
      fileId,
      fields: 'id,name,mimeType,size,modifiedTime',
      supportsAllDrives: true,
    })
    return {
      id: res.data.id!,
      name: res.data.name ?? 'Untitled',
      mimeType: res.data.mimeType ?? 'application/octet-stream',
      size: res.data.size ? Number(res.data.size) : null,
      modifiedTime: res.data.modifiedTime ?? null,
    }
  } catch (err) {
    console.warn('getDriveFileMetadata failed:', err instanceof Error ? err.message : err)
    return null
  }
}

/** Streams raw file bytes for a Drive file (alt=media), for the admin download route to proxy. Throws on failure — callers are expected to handle this as a hard error for an explicit download action, unlike the metadata helper above. */
export async function streamDriveFile(fileId: string): Promise<{ stream: NodeJS.ReadableStream; mimeType: string }> {
  const drive = getDriveClient()
  const meta = await drive.files.get({ fileId, fields: 'mimeType', supportsAllDrives: true })
  const res = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'stream' },
  )
  return { stream: res.data as NodeJS.ReadableStream, mimeType: meta.data.mimeType ?? 'application/octet-stream' }
}
