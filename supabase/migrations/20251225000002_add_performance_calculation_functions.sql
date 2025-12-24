-- Migration: Add Performance Calculation Functions
-- Story 10.2: The "Winner" Tagging Logic

-- ============================================
-- 1. FUNCTION TO CALCULATE PERFORMANCE SCORE FOR A VIDEO
-- ============================================

-- Calculate performance score based on social media analytics
-- For now, uses total view count across all platforms
-- Future enhancement: normalize by follower count
CREATE OR REPLACE FUNCTION calculate_video_performance_score(video_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_views integer := 0;
  performance_score integer := 0;
BEGIN
  -- Sum up view counts from all published video posts
  SELECT COALESCE(SUM(view_count), 0)
  INTO total_views
  FROM public.video_posts
  WHERE video_id = video_uuid
    AND status = 'PUBLISHED'
    AND view_count IS NOT NULL;

  -- For now, performance score is simply total views
  -- This can be enhanced later with more sophisticated scoring
  performance_score := total_views;

  RETURN performance_score;
END;
$$;

-- ============================================
-- 2. FUNCTION TO CALCULATE USER'S ROLLING AVERAGE PERFORMANCE
-- ============================================

-- Calculate rolling average performance for user's last 20 videos
CREATE OR REPLACE FUNCTION calculate_user_rolling_average(user_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_performance numeric := 0;
BEGIN
  -- Get average performance score of user's last 20 videos (ordered by creation date)
  -- Only include videos that have been processed and have performance scores calculated
  SELECT COALESCE(AVG(performance_score), 0)
  INTO avg_performance
  FROM (
    SELECT performance_score
    FROM public.videos
    WHERE user_id = user_uuid
      AND status = 'COMPLETED'
      AND performance_score IS NOT NULL
      AND performance_calculated_at IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 20
  ) recent_videos;

  RETURN avg_performance;
END;
$$;

-- ============================================
-- 3. FUNCTION TO UPDATE VIDEO PERFORMER STATUS
-- ============================================

-- Update high/low performer status for a specific video
CREATE OR REPLACE FUNCTION update_video_performer_status(video_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  video_score integer := 0;
  user_avg numeric := 0;
  user_uuid uuid;
  is_high boolean := false;
  is_low boolean := false;
BEGIN
  -- Get video's user_id and current performance score
  SELECT v.user_id, v.performance_score
  INTO user_uuid, video_score
  FROM public.videos v
  WHERE v.id = video_uuid;

  -- If video doesn't have a performance score yet, calculate it
  IF video_score IS NULL THEN
    video_score := calculate_video_performance_score(video_uuid);
  END IF;

  -- Calculate user's rolling average (excluding current video to avoid bias)
  SELECT calculate_user_rolling_average(user_uuid) INTO user_avg;

  -- Determine performer status
  -- High performer: score > 1.5x average
  -- Low performer: score < 0.5x average
  IF user_avg > 0 THEN
    IF video_score > (user_avg * 1.5) THEN
      is_high := true;
    ELSIF video_score < (user_avg * 0.5) THEN
      is_low := true;
    END IF;
  END IF;

  -- Update video with calculated values
  UPDATE public.videos
  SET
    performance_score = video_score,
    is_high_performer = is_high,
    is_low_performer = is_low,
    performance_calculated_at = now(),
    updated_at = now()
  WHERE id = video_uuid;

END;
$$;

-- ============================================
-- 4. FUNCTION TO BATCH UPDATE PERFORMER STATUS FOR ALL VIDEOS
-- ============================================

-- Batch update performer status for videos that need recalculation
CREATE OR REPLACE FUNCTION batch_update_performer_status()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  video_record record;
  updated_count integer := 0;
BEGIN
  -- Update all videos that either don't have performance calculated
  -- or have recent analytics updates (last 24 hours)
  FOR video_record IN
    SELECT v.id
    FROM public.videos v
    WHERE v.status = 'COMPLETED'
      AND (
        v.performance_calculated_at IS NULL
        OR v.performance_calculated_at < (
          SELECT MAX(vp.analytics_last_updated)
          FROM public.video_posts vp
          WHERE vp.video_id = v.id
            AND vp.status = 'PUBLISHED'
            AND vp.analytics_last_updated IS NOT NULL
        )
      )
  LOOP
    PERFORM update_video_performer_status(video_record.id);
    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count;
END;
$$;

-- ============================================
-- 5. ADD COMMENTS FOR FUNCTIONS
-- ============================================

COMMENT ON FUNCTION calculate_video_performance_score(uuid) IS 'Calculates performance score for a video based on social media analytics';
COMMENT ON FUNCTION calculate_user_rolling_average(uuid) IS 'Calculates rolling average performance score for user last 20 videos';
COMMENT ON FUNCTION update_video_performer_status(uuid) IS 'Updates high/low performer status for a specific video';
COMMENT ON FUNCTION batch_update_performer_status() IS 'Batch updates performer status for videos needing recalculation';
