-- Migration: Add Incorrect Photos Tracking
-- Date: 2025-11-17
-- Description: Add columns to track which photos are incorrect and why
-- Table: qa_photo_reviews

-- Add incorrect_steps column (array of step keys that are marked as incorrect)
ALTER TABLE qa_photo_reviews
ADD COLUMN IF NOT EXISTS incorrect_steps TEXT[] DEFAULT '{}';

-- Add incorrect_comments column (JSONB object mapping step keys to comment text)
ALTER TABLE qa_photo_reviews
ADD COLUMN IF NOT EXISTS incorrect_comments JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN qa_photo_reviews.incorrect_steps IS 'Array of step keys marked as incorrect (e.g., [''step_01_house_photo'', ''step_05_wall_for_installation''])';
COMMENT ON COLUMN qa_photo_reviews.incorrect_comments IS 'JSONB object mapping step keys to comment text (e.g., {"step_01_house_photo": "Photo unclear", "step_05_wall_for_installation": "Wrong angle"})';

-- Create index for faster queries on incorrect steps
CREATE INDEX IF NOT EXISTS idx_qa_photo_reviews_incorrect_steps ON qa_photo_reviews USING GIN (incorrect_steps);

-- Verify migration
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'qa_photo_reviews'
  AND column_name IN ('incorrect_steps', 'incorrect_comments')
ORDER BY column_name;
