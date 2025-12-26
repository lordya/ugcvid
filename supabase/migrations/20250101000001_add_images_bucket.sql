-- Migration: Add Storage RLS Policies for Images Bucket
-- Feature: Language Selection for Video Generation
--
-- This migration creates RLS policies for the 'images' storage bucket.
-- Run this AFTER creating the 'images' bucket in Supabase Dashboard.
--
-- To create the bucket:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: images
-- 4. Set to Public (images need to be accessible by Kie.ai for video generation)
-- 5. File size limit: 10MB (recommended for images)
-- 6. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
-- 7. Click "Create bucket"
--
-- Then run this migration to add the RLS policies.

-- ============================================
-- 1. ENABLE RLS ON STORAGE OBJECTS
-- ============================================

-- RLS is enabled by default on storage.objects, but we ensure it's enabled
-- (This is usually already enabled, but included for completeness)

-- ============================================
-- 2. CREATE RLS POLICIES FOR IMAGES BUCKET
-- ============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view all images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- INSERT Policy: Allow authenticated users to upload to their own folder
-- File path structure: images/{user_id}/{image_id}.{extension}
CREATE POLICY "Users can upload their own images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- SELECT Policy: Allow public access to view images (needed for Kie.ai)
-- This allows external services to access the images for video generation
-- If you want to restrict access, you could use signed URLs instead
CREATE POLICY "Public can view all images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');

-- UPDATE Policy: Allow users to only modify their own files
CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE Policy: Allow users to only delete their own files
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 3. COMMENTS (Documentation)
-- ============================================

COMMENT ON POLICY "Users can upload their own images" ON storage.objects IS
'Allows authenticated users to upload image files to their own folder (images/{user_id}/*)';

COMMENT ON POLICY "Public can view all images" ON storage.objects IS
'Allows public access to view image files in the images bucket (required for Kie.ai video generation)';

COMMENT ON POLICY "Users can update their own images" ON storage.objects IS
'Allows authenticated users to update only their own image files';

COMMENT ON POLICY "Users can delete their own images" ON storage.objects IS
'Allows authenticated users to delete only their own image files';
