-- Asset Management Module - Core Tables
-- Migration: 001_create_asset_tables.sql
-- Description: Creates the core tables for asset management

-- =====================================================
-- ASSET CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Category Information
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    description TEXT,

    -- Settings
    requires_calibration BOOLEAN DEFAULT FALSE,
    calibration_interval_days INTEGER,
    depreciation_years INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ASSETS TABLE - Main asset records
-- =====================================================
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification
    asset_number VARCHAR(50) NOT NULL UNIQUE,
    serial_number VARCHAR(100),
    barcode VARCHAR(100) UNIQUE,
    qr_code_url TEXT,

    -- Classification
    category_id UUID NOT NULL REFERENCES asset_categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Manufacturer & Model
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    model_number VARCHAR(100),

    -- Purchase & Warranty
    purchase_date DATE,
    purchase_price DECIMAL(12, 2),
    currency VARCHAR(3) DEFAULT 'ZAR',
    supplier_id UUID,
    warranty_end_date DATE,

    -- Depreciation
    useful_life_years INTEGER,
    salvage_value DECIMAL(12, 2) DEFAULT 0,
    current_book_value DECIMAL(12, 2),
    accumulated_depreciation DECIMAL(12, 2) DEFAULT 0,

    -- Status & Condition
    status VARCHAR(50) DEFAULT 'available',
    condition VARCHAR(50) DEFAULT 'new',
    current_location VARCHAR(255),
    warehouse_location VARCHAR(100),
    bin_location VARCHAR(50),

    -- Current Assignment (denormalized)
    current_assignee_type VARCHAR(20),
    current_assignee_id UUID,
    current_assignee_name VARCHAR(255),
    assigned_since TIMESTAMP WITH TIME ZONE,

    -- Calibration
    requires_calibration BOOLEAN DEFAULT FALSE,
    last_calibration_date DATE,
    next_calibration_date DATE,
    calibration_provider VARCHAR(255),

    -- Maintenance
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_interval_days INTEGER,

    -- Disposal
    disposal_date DATE,
    disposal_method VARCHAR(100),
    disposal_value DECIMAL(12, 2),
    disposal_notes TEXT,
    disposed_by VARCHAR(255),

    -- Metadata
    specifications JSONB DEFAULT '{}',
    notes TEXT,
    tags JSONB DEFAULT '[]',
    primary_image_url TEXT,
    image_urls JSONB DEFAULT '[]',

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255),

    -- Constraints
    CONSTRAINT chk_assets_status CHECK (status IN (
        'available', 'assigned', 'in_maintenance',
        'out_for_calibration', 'retired', 'disposed', 'lost', 'damaged'
    )),
    CONSTRAINT chk_assets_condition CHECK (condition IN (
        'new', 'excellent', 'good', 'fair', 'poor', 'damaged', 'non_functional'
    )),
    CONSTRAINT chk_assets_assignee_type CHECK (current_assignee_type IS NULL OR current_assignee_type IN (
        'staff', 'project', 'vehicle', 'warehouse'
    ))
);

-- =====================================================
-- ASSET ASSIGNMENTS TABLE - Check-out/in history
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Asset Reference
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,

    -- Assignment Type
    assignment_type VARCHAR(20) NOT NULL,

    -- From (null for initial checkout)
    from_type VARCHAR(20),
    from_id UUID,
    from_name VARCHAR(255),
    from_location VARCHAR(255),

    -- To
    to_type VARCHAR(20) NOT NULL,
    to_id UUID NOT NULL,
    to_name VARCHAR(255) NOT NULL,
    to_location VARCHAR(255),

    -- Project Context
    project_id UUID,
    project_name VARCHAR(255),

    -- Timing
    checked_out_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expected_return_date DATE,
    checked_in_at TIMESTAMP WITH TIME ZONE,

    -- Condition
    condition_at_checkout VARCHAR(50),
    condition_at_checkin VARCHAR(50),

    -- Authorization
    authorized_by VARCHAR(255),
    authorization_notes TEXT,

    -- Check-in Details
    checked_in_by VARCHAR(255),
    checkin_notes TEXT,

    -- Checkout Details
    checkout_notes TEXT,
    purpose TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,

    -- Constraints
    CONSTRAINT chk_assignments_type CHECK (assignment_type IN ('checkout', 'transfer', 'return')),
    CONSTRAINT chk_assignments_to_type CHECK (to_type IN ('staff', 'project', 'vehicle', 'warehouse'))
);

-- =====================================================
-- ASSET MAINTENANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Asset Reference
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,

    -- Maintenance Type & Status
    maintenance_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',

    -- Scheduling
    scheduled_date DATE NOT NULL,
    due_date DATE,
    completed_date DATE,

    -- Provider
    provider_name VARCHAR(255),
    provider_contact VARCHAR(255),
    provider_reference VARCHAR(100),

    -- Work Details
    description TEXT,
    work_performed TEXT,
    findings TEXT,
    recommendations TEXT,

    -- Calibration Specific
    calibration_standard VARCHAR(255),
    calibration_certificate_number VARCHAR(100),
    calibration_results JSONB,
    pass_fail VARCHAR(20),
    next_calibration_date DATE,

    -- Costs
    labor_cost DECIMAL(10, 2),
    parts_cost DECIMAL(10, 2),
    total_cost DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'ZAR',
    invoice_number VARCHAR(100),

    -- Condition
    condition_before VARCHAR(50),
    condition_after VARCHAR(50),

    -- Documents
    document_ids JSONB DEFAULT '[]',

    notes TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    completed_by VARCHAR(255),

    -- Constraints
    CONSTRAINT chk_maintenance_type CHECK (maintenance_type IN (
        'calibration', 'preventive', 'corrective', 'inspection', 'certification'
    )),
    CONSTRAINT chk_maintenance_status CHECK (status IN (
        'scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'
    )),
    CONSTRAINT chk_maintenance_pass_fail CHECK (pass_fail IS NULL OR pass_fail IN ('pass', 'fail', 'conditional'))
);

-- =====================================================
-- ASSET DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    maintenance_id UUID REFERENCES asset_maintenance(id) ON DELETE SET NULL,

    -- Document Info
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_number VARCHAR(100),

    -- File Info
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),

    -- Validity
    issue_date DATE,
    expiry_date DATE,

    -- Issuer
    issuing_authority VARCHAR(255),
    issuer_contact VARCHAR(255),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,

    -- Audit
    uploaded_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_documents_type CHECK (document_type IN (
        'calibration_certificate', 'purchase_invoice', 'warranty_card',
        'manual', 'service_report', 'insurance_document',
        'disposal_certificate', 'photo', 'other'
    ))
);

-- =====================================================
-- ASSET ALERTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Asset Reference
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,

    -- Alert Info
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',

    -- Due Date
    due_date DATE,

    -- Status
    status VARCHAR(20) DEFAULT 'active',

    -- Action Tracking
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    resolution_notes TEXT,

    -- Notification
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    notify_users JSONB DEFAULT '[]',

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_alerts_type CHECK (alert_type IN (
        'calibration_due', 'calibration_overdue',
        'maintenance_due', 'maintenance_overdue',
        'warranty_expiring', 'warranty_expired',
        'document_expiring', 'document_expired',
        'return_overdue', 'disposal_pending', 'condition_change'
    )),
    CONSTRAINT chk_alerts_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT chk_alerts_status CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed'))
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_asset_categories_updated_at ON asset_categories;
CREATE TRIGGER update_asset_categories_updated_at
    BEFORE UPDATE ON asset_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_asset_maintenance_updated_at ON asset_maintenance;
CREATE TRIGGER update_asset_maintenance_updated_at
    BEFORE UPDATE ON asset_maintenance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_asset_documents_updated_at ON asset_documents;
CREATE TRIGGER update_asset_documents_updated_at
    BEFORE UPDATE ON asset_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
