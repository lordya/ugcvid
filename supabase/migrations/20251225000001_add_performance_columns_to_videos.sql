-- Migration: Add Performance Columns to Videos Table
-- Story 10.2: The "Winner" Tagging Logic

-- ============================================
-- 1. ADD PERFORMANCE COLUMNS TO VIDEOS TABLE
-- ============================================

ALTER TABLE public.videos
ADD COLUMN is_high_performer boolean DEFAULT false,
ADD COLUMN is_low_performer boolean DEFAULT false,
ADD COLUMN performance_score integer DEFAULT 0,
ADD COLUMN performance_calculated_at timestamptz;

-- ============================================
-- 2. ADD INDEXES FOR PERFORMANCE QUERIES
-- ============================================

-- Index for efficient queries on high performers
CREATE INDEX idx_videos_high_performer ON public.videos(is_high_performer)
WHERE is_high_performer = true;

-- Index for efficient queries on low performers
CREATE INDEX idx_videos_low_performer ON public.videos(is_low_performer)
WHERE is_low_performer = true;

-- Index for performance score queries (for analytics/sorting)
CREATE INDEX idx_videos_performance_score ON public.videos(performance_score DESC);

-- Index for finding videos that need performance recalculation
CREATE INDEX idx_videos_performance_stale ON public.videos(performance_calculated_at)
WHERE performance_calculated_at IS NULL;

-- ============================================
-- 3. ADD COMMENTS
-- ============================================

COMMENT ON COLUMN public.videos.is_high_performer IS 'True if video performance is 1.5x above user rolling average';
COMMENT ON COLUMN public.videos.is_low_performer IS 'True if video performance is below 0.5x of user rolling average';
COMMENT ON COLUMN public.videos.performance_score IS 'Calculated performance score based on social media analytics';
COMMENT ON COLUMN public.videos.performance_calculated_at IS 'Timestamp when performance metrics were last calculated';
