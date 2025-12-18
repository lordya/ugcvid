-- Migration: Add Storage RLS Policies for Avatars Bucket
-- Story 5.3: User Settings & Account Management
-- 
-- This migration creates RLS policies for the 'avatars' storage bucket.
-- Run this AFTER creating the 'avatars' bucket in Supabase Dashboard.
--
-- To create the bucket:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: avatars
-- 4. Set to Public (or Private with these RLS policies)
-- 5. Click "Create bucket"
--
-- Then run this migration to add the RLS policies.

-- ============================================
-- 1. ENABLE RLS ON STORAGE OBJECTS
-- ============================================

-- RLS is enabled by default on storage.objects, but we ensure it's enabled
-- (This is usually already enabled, but included for completeness)

-- ============================================
-- 2. CREATE RLS POLICIES FOR AVATARS BUCKET
-- ============================================

-- INSERT Policy: Allow authenticated users to upload to their own folder
-- File path structure: avatars/{user_id}/{filename}
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- SELECT Policy: Allow authenticated users to read all avatars
-- This allows users to see other users' avatars (for profile displays)
-- If you want to restrict to own avatar only, change to:
-- USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
CREATE POLICY "Users can view all avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- UPDATE Policy: Allow users to only modify their own files
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE Policy: Allow users to only delete their own files
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 3. COMMENTS (Documentation)
-- ============================================

COMMENT ON POLICY "Users can upload their own avatars" ON storage.objects IS 
'Allows authenticated users to upload avatar images to their own folder (avatars/{user_id}/*)';

COMMENT ON POLICY "Users can view all avatars" ON storage.objects IS 
'Allows authenticated users to view all avatar images in the avatars bucket';

COMMENT ON POLICY "Users can update their own avatars" ON storage.objects IS 
'Allows authenticated users to update only their own avatar images';

COMMENT ON POLICY "Users can delete their own avatars" ON storage.objects IS 
'Allows authenticated users to delete only their own avatar images';

