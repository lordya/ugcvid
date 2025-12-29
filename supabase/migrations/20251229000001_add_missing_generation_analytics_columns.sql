-- Migration: Add missing quality_tier and enhanced_prompts columns to generation_analytics
-- This fixes the issue where code tries to insert these columns but they don't exist

-- Add quality_tier column
ALTER TABLE generation_analytics
ADD COLUMN quality_tier user_quality_tier;

-- Add enhanced_prompts column
ALTER TABLE generation_analytics
ADD COLUMN enhanced_prompts boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN generation_analytics.quality_tier IS 'Quality tier used for video generation (standard or premium)';
COMMENT ON COLUMN generation_analytics.enhanced_prompts IS 'Whether enhanced prompts were used for this generation';

-- Create index for quality_tier for analytics queries
CREATE INDEX IF NOT EXISTS idx_generation_analytics_quality_tier ON generation_analytics(quality_tier);
