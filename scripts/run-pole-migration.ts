import { sql } from '@neondatabase/serverless';

const sqlQuery = `
-- Pole Reviews & Notifications System Database Schema
-- Created: 2025-09-23
-- Module: pole-reviews

-- Create contractors table
CREATE TABLE IF NOT EXISTS contractors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create poles table
CREATE TABLE IF NOT EXISTS poles (
    id SERIAL PRIMARY KEY,
    pole_number VARCHAR(50) UNIQUE NOT NULL,
    location TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'needs-redo')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    pole_id INTEGER NOT NULL REFERENCES poles(id) ON DELETE CASCADE,
    contractor_id INTEGER NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'needs-redo')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    reviewed_by VARCHAR(255), -- Clerk user ID (string format)
    status VARCHAR(20) NOT NULL CHECK (status IN ('approved', 'needs-redo')),
    feedback TEXT NOT NULL,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_poles_pole_number ON poles(pole_number);
CREATE INDEX IF NOT EXISTS idx_poles_status ON poles(status);
CREATE INDEX IF NOT EXISTS idx_submissions_pole_id ON submissions(pole_id);
CREATE INDEX IF NOT EXISTS idx_submissions_contractor_id ON submissions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_reviews_submission_id ON reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_contractors_updated_at BEFORE UPDATE ON contractors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_poles_updated_at BEFORE UPDATE ON poles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO contractors (name, whatsapp_number) VALUES
('Test Contractor 1', '+1234567890'),
('Test Contractor 2', '+0987654321')
ON CONFLICT (whatsapp_number) DO NOTHING;

INSERT INTO poles (pole_number, location, status) VALUES
('P001', 'Main Street & 1st Avenue', 'pending'),
('P002', 'Oak Street & 2nd Avenue', 'pending'),
('P003', 'Elm Street & 3rd Avenue', 'approved')
ON CONFLICT (pole_number) DO NOTHING;

-- Sample submissions
INSERT INTO submissions (pole_id, contractor_id, status, notes) VALUES
(1, 1, 'pending', 'Initial submission for review'),
(2, 2, 'pending', 'Submitted for quality check')
ON CONFLICT DO NOTHING;

-- Sample reviews
INSERT INTO reviews (submission_id, reviewed_by, status, feedback) VALUES
(1, 'user_123', 'needs-redo', 'Photos are blurry, please resubmit with clearer images of all pole sides.')
ON CONFLICT DO NOTHING;

-- Update pole status based on latest review
UPDATE poles
SET status = (
    SELECT r.status
    FROM reviews r
    JOIN submissions s ON r.submission_id = s.id
    WHERE s.pole_id = poles.id
    ORDER BY r.reviewed_at DESC
    LIMIT 1
)
WHERE id IN (
    SELECT DISTINCT s.pole_id
    FROM submissions s
    JOIN reviews r ON s.id = r.submission_id
);

-- Create view for dashboard
CREATE OR REPLACE VIEW pole_dashboard_view AS
SELECT
    p.id,
    p.pole_number,
    p.location,
    p.status as pole_status,
    p.created_at as pole_created_at,
    c.id as contractor_id,
    c.name as contractor_name,
    c.whatsapp_number,
    s.id as submission_id,
    s.status as submission_status,
    s.submitted_at,
    s.notes as submission_notes,
    r.id as review_id,
    r.status as review_status,
    r.feedback,
    r.reviewed_at,
    r.reviewed_by
FROM poles p
LEFT JOIN submissions s ON p.id = s.pole_id
LEFT JOIN contractors c ON s.contractor_id = c.id
LEFT JOIN reviews r ON s.id = r.submission_id
ORDER BY p.created_at DESC;

-- Migration complete notification
SELECT 'Pole Reviews database schema migration completed successfully!' as message;
`;

async function runMigration() {
  try {
    console.log('Running Pole Reviews database migration...');
    const result = await sql(sqlQuery);
    console.log('Migration completed successfully!');
    console.log('Result:', result[result.length - 1]?.message || 'Tables created successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runMigration();