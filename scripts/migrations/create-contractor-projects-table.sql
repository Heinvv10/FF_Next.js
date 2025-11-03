-- Contractor Project Assignments - Database Schema
-- Date: 2025-11-03
-- Description: Creates table for managing contractor assignments to projects

-- =====================================================
-- 1. CONTRACTOR PROJECTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS contractor_projects (
    id SERIAL PRIMARY KEY,
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Assignment Details
    role VARCHAR(100) NOT NULL, -- Role/specialty on project (e.g., "Fiber Splicing", "Installation Lead")
    assignment_status VARCHAR(50) DEFAULT 'assigned' CHECK (assignment_status IN ('assigned', 'active', 'completed', 'removed', 'suspended')),

    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE,
    actual_end_date DATE,

    -- Workload & Capacity
    workload_percentage INTEGER DEFAULT 100 CHECK (workload_percentage >= 0 AND workload_percentage <= 100),
    estimated_hours DECIMAL(10, 2),
    actual_hours DECIMAL(10, 2) DEFAULT 0,

    -- Performance (tracked during assignment)
    performance_rating DECIMAL(3, 2), -- 0-5 rating
    quality_score DECIMAL(5, 2),
    safety_incidents INTEGER DEFAULT 0,

    -- Financial
    contract_value DECIMAL(15, 2),
    payment_terms VARCHAR(100),

    -- Status Tracking
    is_primary_contractor BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    notes TEXT,
    removal_reason TEXT,

    -- Audit
    assigned_by VARCHAR(255),
    removed_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(contractor_id, project_id, role),
    CHECK (end_date IS NULL OR end_date >= start_date),
    CHECK (actual_end_date IS NULL OR actual_end_date >= start_date)
);

-- =====================================================
-- 2. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_contractor_projects_contractor ON contractor_projects(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_projects_project ON contractor_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_contractor_projects_status ON contractor_projects(assignment_status);
CREATE INDEX IF NOT EXISTS idx_contractor_projects_active ON contractor_projects(is_active);
CREATE INDEX IF NOT EXISTS idx_contractor_projects_dates ON contractor_projects(start_date, end_date);

-- =====================================================
-- 3. TRIGGERS
-- =====================================================

-- Trigger for updated_at timestamp
CREATE TRIGGER update_contractor_projects_updated_at
BEFORE UPDATE ON contractor_projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. HELPER VIEWS (Optional - for common queries)
-- =====================================================

-- Active contractor assignments view
CREATE OR REPLACE VIEW active_contractor_assignments AS
SELECT
    cp.*,
    c.company_name,
    c.contact_person,
    c.email,
    c.status as contractor_status,
    p.project_name,
    p.project_code,
    p.status as project_status
FROM contractor_projects cp
JOIN contractors c ON cp.contractor_id = c.id
JOIN projects p ON cp.project_id = p.id
WHERE cp.is_active = true
    AND cp.assignment_status IN ('assigned', 'active');

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Contractor projects assignment table created successfully' AS result;
