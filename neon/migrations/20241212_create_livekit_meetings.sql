-- LiveKit Meetings Table
-- Stores meeting metadata for the LiveKit module

CREATE TABLE IF NOT EXISTS livekit_meetings (
  id SERIAL PRIMARY KEY,
  room_name VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255),
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  recording_path TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for room lookups
CREATE INDEX IF NOT EXISTS idx_livekit_meetings_room_name ON livekit_meetings(room_name);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_livekit_meetings_created_at ON livekit_meetings(created_at DESC);

-- Comments
COMMENT ON TABLE livekit_meetings IS 'Tracks LiveKit video meetings - separate from Fireflies integration';
COMMENT ON COLUMN livekit_meetings.room_name IS 'Unique LiveKit room identifier';
COMMENT ON COLUMN livekit_meetings.recording_path IS 'Path to recording file on VPS';
