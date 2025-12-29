-- Add quality metrics columns to videos table
-- Enables post-generation quality validation and scoring

-- Add quality_score column (0-1 scale, where 1.0 is perfect quality)
ALTER TABLE videos
ADD COLUMN quality_score float CHECK (quality_score >= 0 AND quality_score <= 1);

-- Add quality_issues column to store validation results as JSON
ALTER TABLE videos
ADD COLUMN quality_issues jsonb DEFAULT '[]'::jsonb;

-- Add quality_validated_at timestamp
ALTER TABLE videos
ADD COLUMN quality_validated_at timestamp with time zone;

-- Add comments for documentation
COMMENT ON COLUMN videos.quality_score IS 'Quality score from post-generation validation (0-1 scale, 1.0 = perfect)';
COMMENT ON COLUMN videos.quality_issues IS 'Array of quality issues found during validation';
COMMENT ON COLUMN videos.quality_validated_at IS 'Timestamp when quality validation was performed';

-- Create index on quality_score for potential queries
CREATE INDEX idx_videos_quality_score ON videos(quality_score);

-- Create index on quality_validated_at for analytics queries
CREATE INDEX idx_videos_quality_validated_at ON videos(quality_validated_at);
