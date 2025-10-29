-- Create action_items table
-- Normalized action items extracted from Fireflies meeting summaries
-- Allows tracking, assignment, status management, and completion

-- Create status enum
CREATE TYPE action_item_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create priority enum
CREATE TYPE action_item_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create action_items table
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,

  -- Core fields
  description TEXT NOT NULL,
  assignee_name VARCHAR(255), -- Parsed from Fireflies text
  assignee_email VARCHAR(255), -- If available from meeting participants
  status action_item_status DEFAULT 'pending',
  priority action_item_priority DEFAULT 'medium',

  -- Timestamps
  due_date TIMESTAMP,
  completed_date TIMESTAMP,
  mentioned_at VARCHAR(10), -- Timestamp from meeting (e.g., "16:17")

  -- Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID, -- Staff member who created/extracted it
  completed_by UUID, -- Staff member who marked it complete

  -- Metadata
  tags TEXT[], -- Searchable tags
  notes TEXT -- Additional context or updates
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_action_items_meeting_id ON action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_assignee_name ON action_items(assignee_name);
CREATE INDEX IF NOT EXISTS idx_action_items_assignee_email ON action_items(assignee_email);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority);
CREATE INDEX IF NOT EXISTS idx_action_items_created_at ON action_items(created_at DESC);

-- Full text search index on description
CREATE INDEX IF NOT EXISTS idx_action_items_description_fts ON action_items USING gin(to_tsvector('english', description));

-- Comments for documentation
COMMENT ON TABLE action_items IS 'Action items extracted from meeting transcripts with tracking and assignment';
COMMENT ON COLUMN action_items.meeting_id IS 'Reference to the meeting where this action item originated';
COMMENT ON COLUMN action_items.assignee_name IS 'Person assigned to this action item (parsed from Fireflies)';
COMMENT ON COLUMN action_items.mentioned_at IS 'Timestamp in meeting recording where action item was mentioned (MM:SS format)';
COMMENT ON COLUMN action_items.tags IS 'Array of searchable tags for categorization';
