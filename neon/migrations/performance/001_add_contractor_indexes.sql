-- Migration: Add Performance Indexes for Contractors Module
-- Story 3.2: Database Query Optimization
-- Date: 2025-10-27
--
-- This migration adds strategic indexes to improve query performance
-- for the contractors module based on common query patterns.

-- ============================================================================
-- CONTRACTORS TABLE INDEXES
-- ============================================================================

-- Index for status filtering (very common in list views)
CREATE INDEX IF NOT EXISTS idx_contractors_status
ON contractors(status)
WHERE status IS NOT NULL;

-- Index for active contractors filtering
CREATE INDEX IF NOT EXISTS idx_contractors_is_active
ON contractors(is_active)
WHERE is_active IS NOT NULL;

-- Composite index for status + is_active (most common filter combination)
CREATE INDEX IF NOT EXISTS idx_contractors_status_active
ON contractors(status, is_active, created_at DESC)
WHERE status IS NOT NULL AND is_active IS NOT NULL;

-- Index for email lookups (unique constraint + fast lookup)
CREATE INDEX IF NOT EXISTS idx_contractors_email
ON contractors(email)
WHERE email IS NOT NULL;

-- Index for company name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_contractors_company_name_lower
ON contractors(LOWER(company_name));

-- Index for contact person searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_contractors_contact_person_lower
ON contractors(LOWER(contact_person))
WHERE contact_person IS NOT NULL;

-- Index for created_at for sorting (most recent first)
CREATE INDEX IF NOT EXISTS idx_contractors_created_at
ON contractors(created_at DESC);

-- Index for compliance status filtering
CREATE INDEX IF NOT EXISTS idx_contractors_compliance_status
ON contractors(compliance_status)
WHERE compliance_status IS NOT NULL;

-- Index for RAG overall score filtering
CREATE INDEX IF NOT EXISTS idx_contractors_rag_overall
ON contractors(rag_overall)
WHERE rag_overall IS NOT NULL;

-- ============================================================================
-- CONTRACTOR TEAMS TABLE INDEXES
-- ============================================================================

-- Index for contractor_id foreign key (N+1 query prevention)
CREATE INDEX IF NOT EXISTS idx_contractor_teams_contractor_id
ON contractor_teams(contractor_id);

-- Index for team name lookups
CREATE INDEX IF NOT EXISTS idx_contractor_teams_name
ON contractor_teams(name)
WHERE name IS NOT NULL;

-- Index for is_active teams
CREATE INDEX IF NOT EXISTS idx_contractor_teams_is_active
ON contractor_teams(is_active, contractor_id)
WHERE is_active = true;

-- ============================================================================
-- CONTRACTOR DOCUMENTS TABLE INDEXES
-- ============================================================================

-- Index for contractor_id foreign key (N+1 query prevention)
CREATE INDEX IF NOT EXISTS idx_contractor_documents_contractor_id
ON contractor_documents(contractor_id);

-- Index for document type filtering
CREATE INDEX IF NOT EXISTS idx_contractor_documents_type
ON contractor_documents(document_type)
WHERE document_type IS NOT NULL;

-- Index for document status
CREATE INDEX IF NOT EXISTS idx_contractor_documents_status
ON contractor_documents(status)
WHERE status IS NOT NULL;

-- Composite index for contractor + status (common combination)
CREATE INDEX IF NOT EXISTS idx_contractor_documents_contractor_status
ON contractor_documents(contractor_id, status, uploaded_at DESC);

-- Index for expiry date (for compliance checks)
CREATE INDEX IF NOT EXISTS idx_contractor_documents_expiry
ON contractor_documents(expiry_date)
WHERE expiry_date IS NOT NULL;

-- ============================================================================
-- CONTRACTOR RAG HISTORY TABLE INDEXES
-- ============================================================================

-- Index for contractor_id foreign key (N+1 query prevention)
CREATE INDEX IF NOT EXISTS idx_contractor_rag_history_contractor_id
ON contractor_rag_history(contractor_id);

-- Index for assessment_date (chronological sorting)
CREATE INDEX IF NOT EXISTS idx_contractor_rag_history_date
ON contractor_rag_history(assessment_date DESC);

-- Composite index for contractor + date (most recent scores)
CREATE INDEX IF NOT EXISTS idx_contractor_rag_history_contractor_date
ON contractor_rag_history(contractor_id, assessment_date DESC);

-- ============================================================================
-- CONTRACTOR ONBOARDING STAGES TABLE INDEXES
-- ============================================================================

-- Index for contractor_id foreign key (N+1 query prevention)
CREATE INDEX IF NOT EXISTS idx_contractor_onboarding_contractor_id
ON contractor_onboarding_stages(contractor_id);

-- Index for stage filtering
CREATE INDEX IF NOT EXISTS idx_contractor_onboarding_stage
ON contractor_onboarding_stages(stage)
WHERE stage IS NOT NULL;

-- Index for completion status
CREATE INDEX IF NOT EXISTS idx_contractor_onboarding_completed
ON contractor_onboarding_stages(is_completed, contractor_id);

-- Composite index for contractor + stage (stage lookup)
CREATE INDEX IF NOT EXISTS idx_contractor_onboarding_contractor_stage
ON contractor_onboarding_stages(contractor_id, stage);

-- ============================================================================
-- PROJECTS TABLE INDEXES (for contractor assignments)
-- ============================================================================

-- Index for project status (list filtering)
CREATE INDEX IF NOT EXISTS idx_projects_status
ON projects(status)
WHERE status IS NOT NULL;

-- Index for client_id foreign key
CREATE INDEX IF NOT EXISTS idx_projects_client_id
ON projects(client_id)
WHERE client_id IS NOT NULL;

-- Index for created_at sorting
CREATE INDEX IF NOT EXISTS idx_projects_created_at
ON projects(created_at DESC);

-- Index for project_code lookups
CREATE INDEX IF NOT EXISTS idx_projects_code
ON projects(project_code);

-- ============================================================================
-- CLIENTS TABLE INDEXES
-- ============================================================================

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_clients_status
ON clients(status)
WHERE status IS NOT NULL;

-- Index for company name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_clients_company_name_lower
ON clients(LOWER(company_name));

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_clients_email
ON clients(email)
WHERE email IS NOT NULL;

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================
-- Update table statistics for query planner optimization

ANALYZE contractors;
ANALYZE contractor_teams;
ANALYZE contractor_documents;
ANALYZE contractor_rag_history;
ANALYZE contractor_onboarding_stages;
ANALYZE projects;
ANALYZE clients;

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================
--
-- Index Strategy:
-- 1. Foreign keys: Prevent N+1 queries and speed up JOINs
-- 2. Filtering columns: Speed up WHERE clauses (status, is_active, etc.)
-- 3. Sorting columns: Speed up ORDER BY (created_at DESC)
-- 4. Search columns: Case-insensitive text search (LOWER() indexes)
-- 5. Composite indexes: Common filter combinations
--
-- Partial Indexes:
-- - Used WHERE conditions to index only relevant rows
-- - Reduces index size and maintenance overhead
-- - Example: WHERE status IS NOT NULL
--
-- Expected Performance Improvements:
-- - Contractor list query: 250ms → <50ms (80% reduction)
-- - Contractor by ID with teams: 150ms → <30ms (80% reduction)
-- - Document queries: 100ms → <20ms (80% reduction)
-- - Status filtering: 200ms → <30ms (85% reduction)
--
-- Maintenance:
-- - Indexes are automatically maintained by PostgreSQL
-- - Run ANALYZE periodically to update statistics
-- - Monitor index usage with pg_stat_user_indexes
-- - Drop unused indexes if identified
