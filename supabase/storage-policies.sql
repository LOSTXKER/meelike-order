-- ============================================
-- Supabase Storage Policies for "attachments" bucket
-- Run this in Supabase SQL Editor after creating the bucket
-- ============================================

-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments'
);

-- Policy 2: Allow authenticated users to view/download files
CREATE POLICY "Allow authenticated download"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments'
);

-- Policy 3: Allow authenticated users to update their files
CREATE POLICY "Allow authenticated update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'attachments'
);

-- Policy 4: Allow authenticated users to delete files
CREATE POLICY "Allow authenticated delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments'
);

-- ============================================
-- Alternative: Allow public access (if needed)
-- Uncomment below if you want files to be publicly accessible
-- ============================================

-- CREATE POLICY "Allow public download"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (
--   bucket_id = 'attachments'
-- );



