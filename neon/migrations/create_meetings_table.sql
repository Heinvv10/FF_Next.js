-- Create meetings table for Fireflies integration
-- Stores meeting transcripts synced from Fireflies.ai

CREATE TABLE IF NOT EXISTS meetings (
  id SERIAL PRIMARY KEY,
  fireflies_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  meeting_date TIMESTAMP NOT NULL,
  duration INTEGER, -- in minutes
  transcript_url TEXT,
  summary JSONB, -- {keywords: [], action_items: [], outline: []}
  participants JSONB, -- [{name: string, email: string}]
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_fireflies_id ON meetings(fireflies_id);

-- Comments for documentation
COMMENT ON TABLE meetings IS 'Meeting transcripts synced from Fireflies.ai';
COMMENT ON COLUMN meetings.fireflies_id IS 'Unique ID from Fireflies API';
COMMENT ON COLUMN meetings.summary IS 'JSON object with keywords, action_items, and outline arrays';
COMMENT ON COLUMN meetings.participants IS 'JSON array of participant objects with name and email';
