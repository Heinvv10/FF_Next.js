-- Create table for tracking auto-processor state
-- This is SAFE - only adds a new table, doesn't modify existing tables
-- Run this migration to enable auto-evaluation monitoring

-- Create state tracking table (if not exists)
CREATE TABLE IF NOT EXISTS foto_auto_processor_state (
  id INTEGER PRIMARY KEY DEFAULT 1,  -- Single row for state
  last_processed_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure only one row exists
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial row (if not exists)
INSERT INTO foto_auto_processor_state (
  id,
  last_processed_timestamp,
  processed_count,
  error_count
) VALUES (
  1,
  NOW(),
  0,
  0
) ON CONFLICT (id) DO NOTHING;

-- Create index on timestamps for monitoring queries
CREATE INDEX IF NOT EXISTS idx_auto_processor_timestamps
  ON foto_auto_processor_state (last_run_at, last_processed_timestamp);

-- Add comment for documentation
COMMENT ON TABLE foto_auto_processor_state IS 'Tracks the state of the auto-evaluation processor for monitoring and debugging';
COMMENT ON COLUMN foto_auto_processor_state.last_processed_timestamp IS 'Last timestamp up to which drops were processed';
COMMENT ON COLUMN foto_auto_processor_state.last_run_at IS 'When the auto-processor last ran';
COMMENT ON COLUMN foto_auto_processor_state.processed_count IS 'Total number of drops processed successfully';
COMMENT ON COLUMN foto_auto_processor_state.error_count IS 'Total number of errors encountered';
COMMENT ON COLUMN foto_auto_processor_state.last_error IS 'Last error message for debugging';