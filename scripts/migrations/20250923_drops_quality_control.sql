-- DROPS Quality Control System Database Schema
-- Created: 2025-09-23
-- Module: drops-quality-control
-- Supports Velocity Fibre 14-Step Home Install Capture Checklist
-- Uses UUID to match existing database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create drops_contractors table (specific to drops installation contractors)
CREATE TABLE IF NOT EXISTS drops_contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns to existing drops table for quality control
ALTER TABLE drops
ADD COLUMN IF NOT EXISTS qc_status VARCHAR(20) DEFAULT 'pending' CHECK (qc_status IN ('pending', 'approved', 'needs-rectification')),
ADD COLUMN IF NOT EXISTS qc_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_drops_qc_status ON drops(qc_status);

-- Create checklist_items table for the 14-step validation
CREATE TABLE IF NOT EXISTS checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 14),
    step_name VARCHAR(100) NOT NULL,
    phase VARCHAR(50) NOT NULL CHECK (phase IN ('A', 'B', 'C', 'D', 'E')),
    is_completed BOOLEAN DEFAULT FALSE,
    photo_url TEXT,
    notes TEXT,
    barcode_scan TEXT, -- For ONT barcode and Mini-UPS serial
    powermeter_reading DECIMAL(10, 2), -- For powermeter readings
    customer_signature JSONB, -- For customer signature data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(drop_id, step_number)
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS drop_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES drops_contractors(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'needs-rectification')),
    completion_score INTEGER DEFAULT 0 CHECK (completion_score BETWEEN 0 AND 100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS drop_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES drop_submissions(id) ON DELETE CASCADE,
    reviewed_by VARCHAR(255), -- Clerk user ID (string format)
    status VARCHAR(20) NOT NULL CHECK (status IN ('approved', 'needs-rectification')),
    feedback TEXT NOT NULL,
    missing_steps TEXT[], -- Array of step numbers that need correction
    completion_score INTEGER DEFAULT 0 CHECK (completion_score BETWEEN 0 AND 100),
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quality_metrics table for tracking performance
CREATE TABLE IF NOT EXISTS quality_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES drops_contractors(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES drop_submissions(id) ON DELETE CASCADE,
    total_steps INTEGER DEFAULT 14,
    completed_steps INTEGER DEFAULT 0,
    completion_rate DECIMAL(5, 2) DEFAULT 0.00,
    common_missing_items TEXT[],
    time_to_rectification INTEGER, -- Hours
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_drops_drop_number ON drops(drop_number);
CREATE INDEX IF NOT EXISTS idx_drops_pole_number ON drops(pole_number);
CREATE INDEX IF NOT EXISTS idx_drops_status ON drops(status);
CREATE INDEX IF NOT EXISTS idx_checklist_items_drop_id ON checklist_items(drop_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_step_number ON checklist_items(step_number);
CREATE INDEX IF NOT EXISTS idx_checklist_items_phase ON checklist_items(phase);
CREATE INDEX IF NOT EXISTS idx_checklist_items_completed ON checklist_items(is_completed);
CREATE INDEX IF NOT EXISTS idx_drop_submissions_drop_id ON drop_submissions(drop_id);
CREATE INDEX IF NOT EXISTS idx_drop_submissions_contractor_id ON drop_submissions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_drops_contractors_whatsapp ON drops_contractors(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_drop_submissions_status ON drop_submissions(status);
CREATE INDEX IF NOT EXISTS idx_drop_reviews_submission_id ON drop_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_drop_reviews_status ON drop_reviews(status);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_drop_id ON quality_metrics(drop_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_contractor_id ON quality_metrics(contractor_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_drops_contractors_updated_at ON drops_contractors;
CREATE TRIGGER update_drops_contractors_updated_at BEFORE UPDATE ON drops_contractors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drops_updated_at ON drops;
CREATE TRIGGER update_drops_updated_at BEFORE UPDATE ON drops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_checklist_items_updated_at ON checklist_items;
CREATE TRIGGER update_checklist_items_updated_at BEFORE UPDATE ON checklist_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drop_submissions_updated_at ON drop_submissions;
CREATE TRIGGER update_drop_submissions_updated_at BEFORE UPDATE ON drop_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample contractors (if not exists)
INSERT INTO drops_contractors (name, whatsapp_number) VALUES
('Test Contractor 1', '+1234567890'),
('Test Contractor 2', '+0987654321')
ON CONFLICT (whatsapp_number) DO NOTHING;

-- Update existing drops with sample quality control data
UPDATE drops SET qc_status = 'pending' WHERE drop_number IN ('D001', 'D002');
UPDATE drops SET qc_status = 'approved' WHERE drop_number = 'D003';

-- Insert sample checklist items for testing
WITH drop1 AS (
  SELECT id FROM drops WHERE drop_number = 'D001' LIMIT 1
)
INSERT INTO checklist_items (drop_id, step_number, step_name, phase, is_completed, notes)
SELECT
  drop1.id,
  step.step_number,
  step.step_name,
  step.phase,
  step.is_completed,
  step.notes
FROM (
  VALUES
    (1, 'Property Frontage', 'A', false, 'Wide shot of house, street number visible'),
    (2, 'Location on Wall (Before Install)', 'A', false, 'Show intended ONT spot + power outlet'),
    (3, 'Outside Cable Span', 'A', false, 'Wide shot showing full span'),
    (4, 'Home Entry Point - Outside', 'A', false, 'Close-up of pigtail screw/duct entry'),
    (5, 'Home Entry Point - Inside', 'A', false, 'Inside view of same entry penetration'),
    (6, 'Fibre Entry to ONT (After Install)', 'B', false, 'Show slack loop + clips/conduit'),
    (7, 'Patched & Labelled Drop', 'B', false, 'Label with Drop Number visible'),
    (8, 'Overall Work Area After Completion', 'B', false, 'ONT, fibre routing & electrical outlet'),
    (9, 'ONT Barcode', 'C', false, 'Scan barcode + photo of label'),
    (10, 'Mini-UPS Serial Number', 'C', false, 'Scan/enter serial + photo of label'),
    (11, 'Powermeter Reading (Drop/Feeder)', 'D', false, 'Enter dBm + photo of meter screen'),
    (12, 'Powermeter at ONT (Before Activation)', 'D', false, 'Enter dBm + photo of meter screen'),
    (13, 'Active Broadband Light', 'D', false, 'ONT light ON + Fibertime sticker'),
    (14, 'Customer Signature', 'E', false, 'Digital signature + customer name')
) AS step(step_number, step_name, phase, is_completed, notes)
WHERE EXISTS (SELECT 1 FROM drop1);

-- Insert sample submissions
WITH contractor1 AS (
  SELECT id FROM drops_contractors WHERE whatsapp_number = '+1234567890' LIMIT 1
),
drop1 AS (
  SELECT id FROM drops WHERE drop_number = 'D001' LIMIT 1
)
INSERT INTO drop_submissions (drop_id, contractor_id, status, notes, completion_score)
SELECT
  drop1.id,
  contractor1.id,
  'pending',
  'Initial submission for quality control review',
  0
WHERE EXISTS (SELECT 1 FROM contractor1) AND EXISTS (SELECT 1 FROM drop1);

-- Create view for dashboard
CREATE OR REPLACE VIEW drop_dashboard_view AS
SELECT
    d.id,
    d.drop_number,
    d.pole_number,
    d.address as customer_address,
    d.status,
    d.qc_status,
    d.created_at as drop_created_at,
    c.id as contractor_id,
    c.name as contractor_name,
    c.whatsapp_number,
    ds.id as submission_id,
    ds.status as submission_status,
    ds.submitted_at,
    ds.completion_score as submission_score,
    ds.notes as submission_notes,
    dr.id as review_id,
    dr.status as review_status,
    dr.feedback,
    dr.reviewed_at,
    dr.reviewed_by,
    dr.missing_steps,
    COALESCE(
        (SELECT COUNT(*)
         FROM checklist_items ci
         WHERE ci.drop_id = d.id AND ci.is_completed = true), 0
    ) as completed_steps,
    COALESCE(
        (SELECT COUNT(*)
         FROM checklist_items ci
         WHERE ci.drop_id = d.id), 14
    ) as total_steps
FROM drops d
LEFT JOIN drop_submissions ds ON d.id = ds.drop_id
LEFT JOIN drops_contractors c ON ds.contractor_id = c.id
LEFT JOIN drop_reviews dr ON ds.id = dr.submission_id
ORDER BY d.created_at DESC;

-- Add comments for documentation
COMMENT ON TABLE drops_contractors IS 'Stores drops installation contractor information including WhatsApp contact details';
COMMENT ON TABLE drops IS 'Stores fiber installation drops (pole to home) with status tracking';
COMMENT ON TABLE checklist_items IS 'Stores 14-step Velocity Fibre Home Install Capture Checklist items';
COMMENT ON TABLE drop_submissions IS 'Stores drop submissions from contractors for review';
COMMENT ON TABLE drop_reviews IS 'Stores review feedback from agents with detailed checklist validation';
COMMENT ON TABLE quality_metrics IS 'Stores quality control metrics and performance tracking';
COMMENT ON VIEW drop_dashboard_view IS 'Dashboard view combining drops, submissions, and reviews with checklist completion data';

-- Migration complete notification
SELECT 'DROPS Quality Control database schema migration completed successfully!' as message;