-- Migration: Add whatsapp_message_date column to qa_photo_reviews
-- Date: 2025-11-06
-- Purpose: Track actual WhatsApp message timestamp separately from database insert time
--          This allows accurate daily submission counts on the dashboard

-- Add the column (nullable initially for existing rows)
ALTER TABLE qa_photo_reviews
ADD COLUMN IF NOT EXISTS whatsapp_message_date TIMESTAMP WITH TIME ZONE;

-- Create an index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_qa_photo_reviews_whatsapp_message_date
ON qa_photo_reviews(whatsapp_message_date);

-- For existing rows, set whatsapp_message_date = created_at as a fallback
-- This is a one-time backfill
UPDATE qa_photo_reviews
SET whatsapp_message_date = created_at
WHERE whatsapp_message_date IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN qa_photo_reviews.whatsapp_message_date IS
'Timestamp of the original WhatsApp message. Used for accurate daily submission counts. Different from created_at which is when the database entry was created.';

-- Verify the migration
SELECT
    COUNT(*) as total_rows,
    COUNT(whatsapp_message_date) as rows_with_message_date,
    COUNT(*) - COUNT(whatsapp_message_date) as rows_missing_message_date
FROM qa_photo_reviews;
