-- Adds Google Drive as an alternate (additive, not replacing) storage
-- backend for dossier files, alongside the existing storage_bucket/
-- file_path columns for Supabase Storage. A dossier can be backed by
-- either — the app checks drive_file_id first, falling back to
-- storage_bucket/file_path if unset. See lib/google/driveClient.ts.

alter table public.dossiers
  add column if not exists drive_file_id text;

comment on column public.dossiers.drive_file_id is 'Google Drive file ID (from the file''s share URL: drive.google.com/file/d/FILE_ID/view). File must be shared with the service account configured in GOOGLE_SERVICE_ACCOUNT_JSON_B64.';
