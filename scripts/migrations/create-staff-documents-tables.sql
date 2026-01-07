-- Staff Documents and Project Assignments Migration
-- Created: January 2026
-- Purpose: Full HR Package document management with verification workflow

-- ============================================
-- Table: staff_documents
-- ============================================
-- Stores all staff HR documents with verification workflow
CREATE TABLE IF NOT EXISTS staff_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  expiry_date DATE,
  issued_date DATE,
  issuing_authority VARCHAR(255),
  document_number VARCHAR(100),
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_by UUID REFERENCES staff(id),
  verified_at TIMESTAMP,
  verification_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for staff_documents
CREATE INDEX IF NOT EXISTS idx_staff_documents_staff_id ON staff_documents(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_documents_type ON staff_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_staff_documents_expiry ON staff_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_staff_documents_verification ON staff_documents(verification_status);

-- Document type constraint
ALTER TABLE staff_documents DROP CONSTRAINT IF EXISTS chk_document_type;
ALTER TABLE staff_documents ADD CONSTRAINT chk_document_type
  CHECK (document_type IN (
    'id_document',
    'drivers_license',
    'employment_contract',
    'certification',
    'qualification',
    'medical_certificate',
    'police_clearance',
    'bank_details',
    'tax_document',
    'other'
  ));

-- Verification status constraint
ALTER TABLE staff_documents DROP CONSTRAINT IF EXISTS chk_verification_status;
ALTER TABLE staff_documents ADD CONSTRAINT chk_verification_status
  CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired'));

-- ============================================
-- Table: staff_projects
-- ============================================
-- Links staff members to projects with roles
CREATE TABLE IF NOT EXISTS staff_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role VARCHAR(100),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  assigned_by UUID REFERENCES staff(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(staff_id, project_id)
);

-- Indexes for staff_projects
CREATE INDEX IF NOT EXISTS idx_staff_projects_staff ON staff_projects(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_projects_project ON staff_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_staff_projects_active ON staff_projects(is_active);

-- ============================================
-- Table: document_expiry_alerts
-- ============================================
-- Tracks document expiry alerts (30-day, 7-day, expired)
CREATE TABLE IF NOT EXISTS document_expiry_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_document_id UUID NOT NULL REFERENCES staff_documents(id) ON DELETE CASCADE,
  alert_date DATE NOT NULL,
  alert_type VARCHAR(20) NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for document_expiry_alerts
CREATE INDEX IF NOT EXISTS idx_expiry_alerts_date ON document_expiry_alerts(alert_date);
CREATE INDEX IF NOT EXISTS idx_expiry_alerts_sent ON document_expiry_alerts(is_sent);

-- Alert type constraint
ALTER TABLE document_expiry_alerts DROP CONSTRAINT IF EXISTS chk_alert_type;
ALTER TABLE document_expiry_alerts ADD CONSTRAINT chk_alert_type
  CHECK (alert_type IN ('30_day', '7_day', 'expired'));

-- ============================================
-- Function: Create expiry alerts for document
-- ============================================
CREATE OR REPLACE FUNCTION create_document_expiry_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create alerts for documents with expiry dates
  IF NEW.expiry_date IS NOT NULL THEN
    -- Delete existing alerts for this document
    DELETE FROM document_expiry_alerts WHERE staff_document_id = NEW.id;

    -- Create 30-day alert
    INSERT INTO document_expiry_alerts (staff_document_id, alert_date, alert_type)
    VALUES (NEW.id, NEW.expiry_date - INTERVAL '30 days', '30_day');

    -- Create 7-day alert
    INSERT INTO document_expiry_alerts (staff_document_id, alert_date, alert_type)
    VALUES (NEW.id, NEW.expiry_date - INTERVAL '7 days', '7_day');

    -- Create expired alert
    INSERT INTO document_expiry_alerts (staff_document_id, alert_date, alert_type)
    VALUES (NEW.id, NEW.expiry_date, 'expired');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create expiry alerts
DROP TRIGGER IF EXISTS trigger_create_expiry_alerts ON staff_documents;
CREATE TRIGGER trigger_create_expiry_alerts
  AFTER INSERT OR UPDATE OF expiry_date ON staff_documents
  FOR EACH ROW
  EXECUTE FUNCTION create_document_expiry_alerts();

-- ============================================
-- Function: Update document status to expired
-- ============================================
CREATE OR REPLACE FUNCTION update_expired_documents()
RETURNS void AS $$
BEGIN
  UPDATE staff_documents
  SET verification_status = 'expired',
      updated_at = NOW()
  WHERE expiry_date < CURRENT_DATE
    AND verification_status != 'expired';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE staff_documents IS 'Staff HR documents with verification workflow';
COMMENT ON TABLE staff_projects IS 'Staff to project assignments';
COMMENT ON TABLE document_expiry_alerts IS 'Automated expiry alerts for staff documents';

COMMENT ON COLUMN staff_documents.document_type IS 'Type: id_document, drivers_license, employment_contract, certification, qualification, medical_certificate, police_clearance, bank_details, tax_document, other';
COMMENT ON COLUMN staff_documents.verification_status IS 'Status: pending, verified, rejected, expired';
COMMENT ON COLUMN document_expiry_alerts.alert_type IS 'Alert type: 30_day, 7_day, expired';
