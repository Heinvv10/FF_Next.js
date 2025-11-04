-- Add email column to reminder_preferences table
-- Run with: psql $DATABASE_URL -f scripts/migrations/add-email-to-preferences.sql

ALTER TABLE reminder_preferences ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN reminder_preferences.email IS 'User email address for sending reminders (from Clerk)';
