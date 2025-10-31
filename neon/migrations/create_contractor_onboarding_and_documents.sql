-- Migration: Create contractor onboarding and documents tables
-- Date: 2025-10-31
-- Description: Creates tables for contractor onboarding workflow and document management

-- =====================================================
-- 1. CONTRACTOR DOCUMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS contractor_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL,

    -- Document Information
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_number VARCHAR(100),

    -- File Information
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),

    -- Validity
    issue_date DATE,
    expiry_date DATE,
    is_expired BOOLEAN DEFAULT FALSE,
    days_until_expiry INTEGER,

    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'replaced')),
    rejection_reason TEXT,

    -- Metadata
    notes TEXT,
    tags JSONB DEFAULT '[]',

    -- Audit
    uploaded_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE
);

-- Indexes for contractor_documents
CREATE INDEX IF NOT EXISTS idx_contractor_documents_contractor ON contractor_documents(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_documents_type ON contractor_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_contractor_documents_status ON contractor_documents(status);
CREATE INDEX IF NOT EXISTS idx_contractor_documents_expiry ON contractor_documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- =====================================================
-- 2. CONTRACTOR ONBOARDING STAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS contractor_onboarding_stages (
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

-- Indexes for contractor_onboarding_stages
CREATE INDEX IF NOT EXISTS idx_contractor_onboarding_contractor ON contractor_onboarding_stages(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_onboarding_status ON contractor_onboarding_stages(status);

-- =====================================================
-- 3. TRIGGERS
-- =====================================================

-- Trigger function for contractor_documents updated_at
CREATE OR REPLACE FUNCTION update_contractor_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_contractor_documents_updated_at
BEFORE UPDATE ON contractor_documents
FOR EACH ROW EXECUTE FUNCTION update_contractor_documents_updated_at();

-- Trigger function for contractor_onboarding_stages updated_at
CREATE OR REPLACE FUNCTION update_onboarding_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_contractor_onboarding_stages_updated_at
BEFORE UPDATE ON contractor_onboarding_stages
FOR EACH ROW EXECUTE FUNCTION update_onboarding_stages_updated_at();

-- =====================================================
-- 4. ADD ONBOARDING COLUMNS TO CONTRACTORS TABLE
-- =====================================================

-- Add onboarding tracking columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contractors' AND column_name = 'onboarding_progress'
    ) THEN
        ALTER TABLE contractors ADD COLUMN onboarding_progress INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contractors' AND column_name = 'onboarding_completed_at'
    ) THEN
        ALTER TABLE contractors ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Contractor onboarding and documents tables created successfully' AS result;
