-- Migration: Add Storage RLS Policies for Videos Bucket
-- Story 2.4: Video Generation Trigger (Kie.ai Integration)
-- 
-- This migration creates RLS policies for the 'videos' storage bucket.
-- Run this AFTER creating the 'videos' bucket in Supabase Dashboard.
--
-- To create the bucket:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: videos
-- 4. Set to Private (videos should not be publicly accessible)
-- 5. File size limit: 500MB (recommended)
-- 6. Allowed MIME types: video/mp4, video/webm, video/quicktime (optional)
-- 7. Click "Create bucket"
--
-- Then run this migration to add the RLS policies.

-- ============================================
-- 2. CREATE RLS POLICIES FOR VIDEOS BUCKET
-- ============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can upload their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;

-- INSERT Policy: Allow authenticated users to upload to their own folder
-- File path structure: videos/{user_id}/{video_id}.mp4
-- Note: This is typically used by the system when downloading from Kie.ai
CREATE POLICY "Users can upload their own videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- SELECT Policy: Allow users to only view their own videos
-- Unlike avatars, videos are private to each user
CREATE POLICY "Users can view their own videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE Policy: Allow users to only modify their own files
CREATE POLICY "Users can update their own videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE Policy: Allow users to only delete their own files
CREATE POLICY "Users can delete their own videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 3. COMMENTS (Documentation)
-- ============================================

COMMENT ON POLICY "Users can upload their own videos" ON storage.objects IS 
'Allows authenticated users to upload video files to their own folder (videos/{user_id}/*)';

COMMENT ON POLICY "Users can view their own videos" ON storage.objects IS 
'Allows authenticated users to view only their own video files in the videos bucket';

COMMENT ON POLICY "Users can update their own videos" ON storage.objects IS 
'Allows authenticated users to update only their own video files';

COMMENT ON POLICY "Users can delete their own videos" ON storage.objects IS 
'Allows authenticated users to delete only their own video files';

