-- SharePoint Sync State Table
-- Tracks the last row written to each SharePoint worksheet
-- Eliminates need to query Excel file (which times out on large files)

CREATE TABLE IF NOT EXISTS sharepoint_sync_state (
  sheet_name VARCHAR(50) PRIMARY KEY,
  last_row_written INTEGER NOT NULL,
  last_sync_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialize for NeonDbase sheet
-- Starting at row 20 to leave room for headers and any existing data
INSERT INTO sharepoint_sync_state (sheet_name, last_row_written)
VALUES ('NeonDbase', 20)
ON CONFLICT (sheet_name) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sharepoint_sync_state_sheet
ON sharepoint_sync_state(sheet_name);

COMMENT ON TABLE sharepoint_sync_state IS 'Tracks last row written to SharePoint worksheets to avoid slow Excel queries';
COMMENT ON COLUMN sharepoint_sync_state.sheet_name IS 'Name of the worksheet (e.g., NeonDbase)';
COMMENT ON COLUMN sharepoint_sync_state.last_row_written IS 'Last row number written to the sheet';
COMMENT ON COLUMN sharepoint_sync_state.last_sync_date IS 'Date of last successful sync';
