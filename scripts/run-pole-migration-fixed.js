const { Pool } = require('pg');

// Create a pool instance for database connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const sqlQuery = `
-- Pole Reviews & Notifications System Database Schema
-- Created: 2025-09-23
-- Module: pole-reviews
-- Uses UUID to match existing database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create contractors table
CREATE TABLE IF NOT EXISTS contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create poles table
CREATE TABLE IF NOT EXISTS poles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pole_number VARCHAR(50) UNIQUE NOT NULL,
    location TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'needs-redo')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pole_id UUID NOT NULL REFERENCES poles(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'needs-redo')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
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
DROP TRIGGER IF EXISTS update_contractors_updated_at ON contractors;
CREATE TRIGGER update_contractors_updated_at BEFORE UPDATE ON contractors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_poles_updated_at ON poles;
CREATE TRIGGER update_poles_updated_at BEFORE UPDATE ON poles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON submissions;
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO contractors (name, whatsapp_number) VALUES
('Test Contractor 1', '+1234567890'),
('Test Contractor 2', '+0987654321')
ON CONFLICT (whatsapp_number) DO NOTHING;

-- Insert poles
INSERT INTO poles (pole_number, location, status) VALUES
('P001', 'Main Street & 1st Avenue', 'pending'),
('P002', 'Oak Street & 2nd Avenue', 'pending'),
('P003', 'Elm Street & 3rd Avenue', 'approved')
ON CONFLICT (pole_number) DO NOTHING;

-- Insert sample submissions with proper UUID references
DO $$
DECLARE
    contractor1_id UUID;
    contractor2_id UUID;
    pole1_id UUID;
    pole2_id UUID;
BEGIN
    -- Get contractor IDs
    SELECT id INTO contractor1_id FROM contractors WHERE whatsapp_number = '+1234567890' LIMIT 1;
    SELECT id INTO contractor2_id FROM contractors WHERE whatsapp_number = '+0987654321' LIMIT 1;

    -- Get pole IDs
    SELECT id INTO pole1_id FROM poles WHERE pole_number = 'P001' LIMIT 1;
    SELECT id INTO pole2_id FROM poles WHERE pole_number = 'P002' LIMIT 1;

    -- Insert submissions
    IF contractor1_id IS NOT NULL AND pole1_id IS NOT NULL THEN
        INSERT INTO submissions (pole_id, contractor_id, status, notes)
        VALUES (pole1_id, contractor1_id, 'pending', 'Initial submission for review');
    END IF;

    IF contractor2_id IS NOT NULL AND pole2_id IS NOT NULL THEN
        INSERT INTO submissions (pole_id, contractor_id, status, notes)
        VALUES (pole2_id, contractor2_id, 'pending', 'Submitted for quality check');
    END IF;
END $$;

-- Insert sample reviews
DO $$
DECLARE
    submission1_id UUID;
BEGIN
    -- Get submission ID for P001
    SELECT s.id INTO submission1_id
    FROM submissions s
    JOIN poles p ON s.pole_id = p.id
    WHERE p.pole_number = 'P001'
    LIMIT 1;

    IF submission1_id IS NOT NULL THEN
        INSERT INTO reviews (submission_id, reviewed_by, status, feedback)
        VALUES (submission1_id, 'user_123', 'needs-redo', 'Photos are blurry, please resubmit with clearer images of all pole sides.');
    END IF;
END $$;

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
`;

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('Running Pole Reviews database migration...');

    // Execute the migration
    const result = await client.query(sqlQuery);

    console.log('✅ Migration completed successfully!');

    // Show some results
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('contractors', 'poles', 'submissions', 'reviews')
      ORDER BY table_name;
    `);

    console.log('📊 Tables created:', tablesResult.rows.map(row => row.table_name).join(', '));

    // Show sample data
    const polesResult = await client.query('SELECT COUNT(*) as count FROM poles;');
    console.log('📌 Sample poles created:', polesResult.rows[0].count);

    const contractorsResult = await client.query('SELECT COUNT(*) as count FROM contractors;');
    console.log('👥 Sample contractors created:', contractorsResult.rows[0].count);

    const submissionsResult = await client.query('SELECT COUNT(*) as count FROM submissions;');
    console.log('📋 Sample submissions created:', submissionsResult.rows[0].count);

    const reviewsResult = await client.query('SELECT COUNT(*) as count FROM reviews;');
    console.log('📝 Sample reviews created:', reviewsResult.rows[0].count);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

runMigration()
  .then(() => {
    console.log('🎉 Pole Reviews system database setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });