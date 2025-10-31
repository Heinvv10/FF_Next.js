-- Fix contractor_onboarding_stages table to use UUID

-- Drop existing table if it has wrong type
DROP TABLE IF EXISTS contractor_onboarding_stages CASCADE;

-- Create with UUID to match contractors table
CREATE TABLE contractor_onboarding_stages (
    id SERIAL PRIMARY KEY,
    contractor_id UUID NOT NULL,

    -- Stage Information
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,

    -- Progress
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    completion_percentage INTEGER DEFAULT 0,

    -- Requirements
    required_documents JSONB DEFAULT '[]',
    completed_documents JSONB DEFAULT '[]',

    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date DATE,

    -- Metadata
    notes TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(contractor_id, stage_name),
    FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_contractor_onboarding_contractor ON contractor_onboarding_stages(contractor_id);
CREATE INDEX idx_contractor_onboarding_status ON contractor_onboarding_stages(status);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_onboarding_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contractor_onboarding_stages_updated_at
BEFORE UPDATE ON contractor_onboarding_stages
FOR EACH ROW EXECUTE FUNCTION update_onboarding_stages_updated_at();

SELECT 'contractor_onboarding_stages table created with UUID support' AS result;
