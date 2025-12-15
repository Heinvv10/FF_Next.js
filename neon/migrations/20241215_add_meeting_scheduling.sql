-- Add fields for meeting scheduling
-- Run this migration to add attendees and status columns

ALTER TABLE livekit_meetings 
ADD COLUMN IF NOT EXISTS attendees JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS meeting_url TEXT;

-- Index for scheduled meetings queries
CREATE INDEX IF NOT EXISTS idx_livekit_meetings_scheduled_at ON livekit_meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_livekit_meetings_status ON livekit_meetings(status);

-- Comments
COMMENT ON COLUMN livekit_meetings.attendees IS 'JSON array of attendee objects [{email, name, status}]';
COMMENT ON COLUMN livekit_meetings.status IS 'scheduled, in_progress, completed, cancelled';
COMMENT ON COLUMN livekit_meetings.duration_minutes IS 'Expected meeting duration in minutes';
COMMENT ON COLUMN livekit_meetings.meeting_url IS 'Full URL for joining the meeting';
