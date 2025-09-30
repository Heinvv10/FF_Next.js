-- Fireflies Integration Database Schema
-- Creates tables for syncing meetings, transcripts, and notes from Fireflies.ai

-- Main meetings table for meeting history
CREATE TABLE IF NOT EXISTS fireflies_meetings (
  id TEXT PRIMARY KEY,  -- Fireflies meetingId
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  participants JSONB,  -- Array of emails/names
  duration INTEGER,    -- Seconds
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcripts table for full text transcripts
CREATE TABLE IF NOT EXISTS fireflies_transcripts (
  id TEXT PRIMARY KEY REFERENCES fireflies_meetings(id) ON DELETE CASCADE,
  full_text TEXT,
  speaker_labels JSONB,  -- e.g., { "speaker1": "email@domain.com" }
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table for summaries and action items
CREATE TABLE IF NOT EXISTS fireflies_notes (
  id TEXT PRIMARY KEY REFERENCES fireflies_meetings(id) ON DELETE CASCADE,
  summary TEXT,          -- Overview
  bullet_points JSONB,   -- Array of key points/action items
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_fireflies_meetings_created_at ON fireflies_meetings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fireflies_meetings_updated_at ON fireflies_meetings(updated_at DESC);

-- Sync tracking table
CREATE TABLE IF NOT EXISTS fireflies_sync_log (
  id SERIAL PRIMARY KEY,
  sync_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  meetings_synced INTEGER DEFAULT 0,
  last_meeting_id TEXT,
  status TEXT DEFAULT 'completed'
);