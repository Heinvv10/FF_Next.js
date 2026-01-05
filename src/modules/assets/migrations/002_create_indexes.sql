-- Asset Management Module - Indexes
-- Migration: 002_create_indexes.sql
-- Description: Creates performance indexes for asset tables

-- =====================================================
-- ASSET CATEGORIES INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_asset_categories_type ON asset_categories(type);
CREATE INDEX IF NOT EXISTS idx_asset_categories_active ON asset_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_asset_categories_code ON asset_categories(code);

-- =====================================================
-- ASSETS INDEXES
-- =====================================================

-- Primary lookups
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_condition ON assets(condition);

-- Identification lookups
CREATE INDEX IF NOT EXISTS idx_assets_asset_number ON assets(asset_number);
CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON assets(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_barcode ON assets(barcode) WHERE barcode IS NOT NULL;

-- Assignment lookups
CREATE INDEX IF NOT EXISTS idx_assets_current_assignee ON assets(current_assignee_type, current_assignee_id)
    WHERE current_assignee_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_assigned_status ON assets(status)
    WHERE status = 'assigned';

-- Calibration tracking
CREATE INDEX IF NOT EXISTS idx_assets_calibration_due ON assets(next_calibration_date)
    WHERE requires_calibration = TRUE AND next_calibration_date IS NOT NULL;
-- Note: Cannot use CURRENT_DATE in index predicate (not immutable)
-- Overdue calibrations are checked at query time instead
CREATE INDEX IF NOT EXISTS idx_assets_calibration_required ON assets(requires_calibration, next_calibration_date)
    WHERE requires_calibration = TRUE;

-- Maintenance tracking
CREATE INDEX IF NOT EXISTS idx_assets_maintenance_due ON assets(next_maintenance_date)
    WHERE next_maintenance_date IS NOT NULL;

-- Warranty tracking
CREATE INDEX IF NOT EXISTS idx_assets_warranty ON assets(warranty_end_date)
    WHERE warranty_end_date IS NOT NULL;

-- Location lookups
CREATE INDEX IF NOT EXISTS idx_assets_warehouse ON assets(warehouse_location)
    WHERE warehouse_location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(current_location)
    WHERE current_location IS NOT NULL;

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_assets_search ON assets USING gin(
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(manufacturer, '') || ' ' || COALESCE(model, '') || ' ' || COALESCE(serial_number, ''))
);

-- Date-based queries
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at);
CREATE INDEX IF NOT EXISTS idx_assets_purchase_date ON assets(purchase_date) WHERE purchase_date IS NOT NULL;

-- =====================================================
-- ASSET ASSIGNMENTS INDEXES
-- =====================================================

-- Asset lookups
CREATE INDEX IF NOT EXISTS idx_asset_assignments_asset ON asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_active ON asset_assignments(asset_id, is_active)
    WHERE is_active = TRUE;

-- Assignee lookups
CREATE INDEX IF NOT EXISTS idx_asset_assignments_to ON asset_assignments(to_type, to_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_from ON asset_assignments(from_type, from_id)
    WHERE from_type IS NOT NULL;

-- Project lookups
CREATE INDEX IF NOT EXISTS idx_asset_assignments_project ON asset_assignments(project_id)
    WHERE project_id IS NOT NULL;

-- Date-based queries
CREATE INDEX IF NOT EXISTS idx_asset_assignments_dates ON asset_assignments(checked_out_at, checked_in_at);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_overdue ON asset_assignments(expected_return_date)
    WHERE is_active = TRUE AND expected_return_date IS NOT NULL;

-- =====================================================
-- ASSET MAINTENANCE INDEXES
-- =====================================================

-- Asset lookups
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_asset ON asset_maintenance(asset_id);

-- Type and status lookups
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_type ON asset_maintenance(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_status ON asset_maintenance(status);

-- Scheduling lookups
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_scheduled ON asset_maintenance(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_due ON asset_maintenance(due_date)
    WHERE status IN ('scheduled', 'overdue');
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_overdue ON asset_maintenance(due_date)
    WHERE status = 'overdue';

-- Calibration lookups
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_calibration ON asset_maintenance(asset_id, maintenance_type)
    WHERE maintenance_type = 'calibration';

-- =====================================================
-- ASSET DOCUMENTS INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_asset_documents_asset ON asset_documents(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_documents_type ON asset_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_asset_documents_maintenance ON asset_documents(maintenance_id)
    WHERE maintenance_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_asset_documents_expiry ON asset_documents(expiry_date)
    WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_asset_documents_active ON asset_documents(is_active);

-- =====================================================
-- ASSET ALERTS INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_asset_alerts_asset ON asset_alerts(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_alerts_type ON asset_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_asset_alerts_status ON asset_alerts(status);
CREATE INDEX IF NOT EXISTS idx_asset_alerts_due ON asset_alerts(due_date);
CREATE INDEX IF NOT EXISTS idx_asset_alerts_active ON asset_alerts(status)
    WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_asset_alerts_severity ON asset_alerts(severity)
    WHERE status = 'active';
