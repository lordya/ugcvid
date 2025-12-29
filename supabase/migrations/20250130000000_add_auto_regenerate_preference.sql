-- Add auto_regenerate_on_low_quality column to users table
-- Allows users to opt-in to automatic regeneration when video quality is low

ALTER TABLE users
ADD COLUMN auto_regenerate_on_low_quality boolean DEFAULT false NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.auto_regenerate_on_low_quality IS 'Whether to automatically regenerate videos that fail quality validation (quality_score < 0.75)';
