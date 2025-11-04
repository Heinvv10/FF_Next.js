-- Create reminders tables for daily email reminder system
-- Run with: psql $DATABASE_URL -f scripts/migrations/create-reminders-tables.sql

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User reminder preferences
CREATE TABLE IF NOT EXISTS reminder_preferences (
  user_id TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT true,
  send_time TIME DEFAULT '08:00:00',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_user_status ON reminders(user_id, status);

-- Comments
COMMENT ON TABLE reminders IS 'Stores individual reminders for users';
COMMENT ON TABLE reminder_preferences IS 'Stores user preferences for daily reminder emails';
COMMENT ON COLUMN reminders.priority IS 'Priority level: low, medium, high';
COMMENT ON COLUMN reminders.status IS 'Status: pending, completed, dismissed';
COMMENT ON COLUMN reminder_preferences.send_time IS 'Preferred time to receive daily reminder email';
COMMENT ON COLUMN reminder_preferences.timezone IS 'User timezone for send_time';
