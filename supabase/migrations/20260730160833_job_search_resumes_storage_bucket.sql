INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  5242880,
  ARRAY[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'resumes_service_all'
  ) THEN
    CREATE POLICY resumes_service_all
      ON storage.objects
      FOR ALL
      TO service_role
      USING (bucket_id = 'resumes')
      WITH CHECK (bucket_id = 'resumes');
  END IF;
END $$;