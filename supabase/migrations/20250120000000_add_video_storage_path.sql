-- Migration: Add storage_path column to videos table
-- 
-- Problem: Videos are only stored as Kie.ai URLs which may expire, creating dependency on external CDN.
--
-- Solution: Add storage_path column to track Supabase Storage location for permanent video storage.

-- ============================================
-- 1. ADD storage_path COLUMN
-- ============================================

ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- ============================================
-- 2. ADD INDEX FOR EFFICIENT QUERYING
-- ============================================

CREATE INDEX IF NOT EXISTS idx_videos_storage_path 
ON public.videos(storage_path) 
WHERE storage_path IS NOT NULL;

-- ============================================
-- 3. ADD COMMENT
-- ============================================

COMMENT ON COLUMN public.videos.storage_path IS 'Path to video file in Supabase Storage bucket (e.g., videos/{user_id}/{video_id}.mp4). Null if video is only stored at Kie.ai URL.';

