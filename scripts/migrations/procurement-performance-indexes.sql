-- Procurement Performance Optimization
-- Add indexes to improve API query performance
-- Date: 2025-09-23

-- ============================================
-- BOQ Table Indexes
-- ============================================

-- Primary indexes for BOQ queries
CREATE INDEX IF NOT EXISTS idx_boqs_project_id ON boqs(project_id);
CREATE INDEX IF NOT EXISTS idx_boqs_created_at ON boqs(created_at DESC);

-- BOQ Items indexes for the most common query patterns
CREATE INDEX IF NOT EXISTS idx_boq_items_project_id ON boq_items(project_id);
CREATE INDEX IF NOT EXISTS idx_boq_items_boq_id ON boq_items(boq_id);
CREATE INDEX IF NOT EXISTS idx_boq_items_line_number ON boq_items(line_number);
CREATE INDEX IF NOT EXISTS idx_boq_items_procurement_status ON boq_items(procurement_status);
CREATE INDEX IF NOT EXISTS idx_boq_items_category ON boq_items(category);

-- Composite indexes for common query combinations
CREATE INDEX IF NOT EXISTS idx_boq_items_project_line ON boq_items(project_id, line_number);
CREATE INDEX IF NOT EXISTS idx_boq_items_project_status ON boq_items(project_id, procurement_status);
CREATE INDEX IF NOT EXISTS idx_boq_items_boq_line ON boq_items(boq_id, line_number);

-- ============================================
-- RFQ Table Indexes
-- ============================================

-- RFQ main table indexes
CREATE INDEX IF NOT EXISTS idx_rfqs_project_id ON rfqs(project_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_created_at ON rfqs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rfqs_deadline ON rfqs(response_deadline);

-- RFQ Items indexes
CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq_id ON rfq_items(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_items_line_number ON rfq_items(line_number);
CREATE INDEX IF NOT EXISTS idx_rfq_items_category ON rfq_items(category);
CREATE INDEX IF NOT EXISTS idx_rfq_items_priority ON rfq_items(priority);

-- RFQ Responses indexes
CREATE INDEX IF NOT EXISTS idx_rfq_responses_rfq_id ON rfq_responses(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_supplier_id ON rfq_responses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_submission_date ON rfq_responses(submission_date DESC);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_status ON rfq_responses(status);

-- ============================================
-- Stock Table Indexes
-- ============================================

-- Stock main table indexes
CREATE INDEX IF NOT EXISTS idx_stock_project_id ON stock(project_id);
CREATE INDEX IF NOT EXISTS idx_stock_category ON stock(category);
CREATE INDEX IF NOT EXISTS idx_stock_status ON stock(status);
CREATE INDEX IF NOT EXISTS idx_stock_quantity_current ON stock(quantity_current);
CREATE INDEX IF NOT EXISTS idx_stock_reorder_level ON stock(reorder_level);

-- Stock Movement indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_stock_id ON stock_movements(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_project_id ON stock_movements(project_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_date ON stock_movements(movement_date DESC);

-- ============================================
-- Performance Optimization
-- ============================================

-- Update table statistics for better query planning
ANALYZE boqs;
ANALYZE boq_items;
ANALYZE rfqs;
ANALYZE rfq_items;
ANALYZE rfq_responses;
ANALYZE stock;
ANALYZE stock_movements;

-- ============================================
-- Index Usage Verification
-- ============================================

-- Query to check index usage (for monitoring)
-- This query can be run periodically to verify indexes are being used
/*
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('boqs', 'boq_items', 'rfqs', 'rfq_items', 'rfq_responses', 'stock', 'stock_movements')
ORDER BY idx_scan DESC;
*/