-- =====================================================
-- FibreFlow Ticketing Module - Database Schema
-- =====================================================
-- Created: 2025-12-18
-- Purpose: Complete ticketing system with 7 sources, billing automation, SLA management
-- Tables: 12 total (tickets, ticket_notes, ticket_attachments, ticket_history,
--         ticket_tags, sla_configs, client_contracts, project_guarantees,
--         billable_fee_schedule, ticket_billing, ticket_assignment_history, notification_log)
-- =====================================================

-- =====================================================
-- TABLE 1: tickets
-- Core ticket data with immutable UIDs
-- =====================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_uid TEXT UNIQUE NOT NULL,

  -- Source and identification
  source TEXT NOT NULL CHECK (source IN ('qcontact', 'whatsapp', 'email', 'construction', 'internal', 'whatsapp_outbound', 'adhoc')),
  external_id TEXT, -- QContact FT number, WhatsApp message ID, etc.

  -- Core ticket data
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'assigned', 'in_progress', 'blocked', 'resolved', 'closed', 'cancelled', 'pending_approval')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  type TEXT CHECK (type IN ('fault', 'maintenance', 'installation', 'query', 'complaint', 'other')),

  -- Assignment and ownership
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  project_id TEXT, -- Reference to project (e.g., 'Lawley', 'Mohadin')
  dr_number TEXT, -- Drop number (DR format) for auto-population

  -- Location and contact
  client_name TEXT,
  client_contact TEXT,
  client_email TEXT,
  address TEXT,
  gps_coordinates TEXT, -- Format: "lat,lng"

  -- Billing classification
  billing_type TEXT CHECK (billing_type IN ('guarantee', 'sla', 'billable')) DEFAULT 'billable',
  requires_billing_approval BOOLEAN DEFAULT FALSE,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  billing_approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  billing_approved_at TIMESTAMPTZ,
  billing_notes TEXT,

  -- SLA tracking
  sla_config_id UUID REFERENCES sla_configs(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  sla_paused_at TIMESTAMPTZ,
  sla_pause_reason TEXT,
  sla_breached BOOLEAN DEFAULT FALSE,
  sla_breach_duration INTERVAL, -- How long past due
  response_time INTERVAL, -- Time from created to first response
  resolution_time INTERVAL, -- Time from created to resolved

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- Metadata
  tags TEXT[], -- Array of tag names
  attachments_count INTEGER DEFAULT 0,
  notes_count INTEGER DEFAULT 0,
  related_tickets TEXT[], -- Array of related ticket UIDs

  -- Indexes for performance
  CONSTRAINT valid_email CHECK (client_email IS NULL OR client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT valid_gps CHECK (gps_coordinates IS NULL OR gps_coordinates ~* '^-?[0-9]+\.?[0-9]*,-?[0-9]+\.?[0-9]*$')
);

-- Indexes for tickets table
CREATE INDEX idx_tickets_ticket_uid ON tickets(ticket_uid);
CREATE INDEX idx_tickets_source ON tickets(source);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_billing_type ON tickets(billing_type);
CREATE INDEX idx_tickets_dr_number ON tickets(dr_number);
CREATE INDEX idx_tickets_project_id ON tickets(project_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_due_at ON tickets(due_at);
CREATE INDEX idx_tickets_external_id ON tickets(external_id);

-- =====================================================
-- TABLE 2: ticket_notes
-- Internal and external notes/comments
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

  -- Note content
  content TEXT NOT NULL,
  note_type TEXT NOT NULL CHECK (note_type IN ('internal', 'external', 'system')) DEFAULT 'internal',
  visibility TEXT NOT NULL CHECK (visibility IN ('private', 'public')) DEFAULT 'private',

  -- Author and timestamps
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  is_resolution BOOLEAN DEFAULT FALSE, -- Marks resolution note
  attachments TEXT[] -- Array of file URLs
);

CREATE INDEX idx_ticket_notes_ticket_id ON ticket_notes(ticket_id);
CREATE INDEX idx_ticket_notes_created_at ON ticket_notes(created_at DESC);
CREATE INDEX idx_ticket_notes_note_type ON ticket_notes(note_type);

-- =====================================================
-- TABLE 3: ticket_attachments
-- File uploads and attachments
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

  -- File metadata
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Firebase Storage URL
  file_type TEXT, -- MIME type
  file_size BIGINT, -- Bytes

  -- Upload info
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  description TEXT,
  is_internal BOOLEAN DEFAULT FALSE -- Internal attachments not visible to clients
);

CREATE INDEX idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX idx_ticket_attachments_uploaded_at ON ticket_attachments(uploaded_at DESC);

-- =====================================================
-- TABLE 4: ticket_history
-- Audit log for all ticket changes
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

  -- Change tracking
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'status_changed', 'assigned', 'reassigned', 'priority_changed', 'billing_approved', 'billing_rejected', 'sla_paused', 'sla_resumed', 'note_added', 'attachment_added', 'closed', 'reopened')),
  field_changed TEXT, -- Field name that changed
  old_value TEXT, -- JSON string of old value
  new_value TEXT, -- JSON string of new value

  -- Actor and timestamp
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Additional context
  change_reason TEXT,
  metadata JSONB -- Flexible metadata storage
);

CREATE INDEX idx_ticket_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX idx_ticket_history_changed_at ON ticket_history(changed_at DESC);
CREATE INDEX idx_ticket_history_action ON ticket_history(action);

-- =====================================================
-- TABLE 5: ticket_tags
-- Tagging system for organization
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tag info
  name TEXT UNIQUE NOT NULL,
  color TEXT, -- Hex color code for UI
  description TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0 -- Auto-incremented by trigger
);

CREATE INDEX idx_ticket_tags_name ON ticket_tags(name);

-- =====================================================
-- TABLE 6: sla_configs
-- SLA rules by type and priority
-- =====================================================
CREATE TABLE IF NOT EXISTS sla_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- SLA parameters
  ticket_type TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  response_hours DECIMAL(10,2) NOT NULL, -- Hours to first response
  resolution_hours DECIMAL(10,2) NOT NULL, -- Hours to resolution

  -- Business hours configuration
  business_hours_only BOOLEAN DEFAULT TRUE,
  business_start_hour INTEGER DEFAULT 8 CHECK (business_start_hour >= 0 AND business_start_hour < 24),
  business_end_hour INTEGER DEFAULT 17 CHECK (business_end_hour >= 0 AND business_end_hour < 24),
  business_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],

  -- Escalation
  escalation_enabled BOOLEAN DEFAULT TRUE,
  escalation_threshold DECIMAL(5,2) DEFAULT 0.75, -- Escalate at 75% of SLA

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,

  UNIQUE(ticket_type, priority)
);

CREATE INDEX idx_sla_configs_type_priority ON sla_configs(ticket_type, priority);

-- =====================================================
-- TABLE 7: client_contracts
-- Client SLA contracts with custom terms
-- =====================================================
CREATE TABLE IF NOT EXISTS client_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Client identification
  client_name TEXT NOT NULL,
  client_id TEXT, -- External client ID
  project_id TEXT, -- Associated project

  -- Contract terms
  contract_start TIMESTAMPTZ NOT NULL,
  contract_end TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,

  -- Custom SLA hours
  custom_response_hours DECIMAL(10,2),
  custom_resolution_hours DECIMAL(10,2),
  business_hours_only BOOLEAN DEFAULT TRUE,

  -- Metadata
  contract_document_url TEXT, -- Firebase Storage URL
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT valid_contract_dates CHECK (contract_end > contract_start)
);

CREATE INDEX idx_client_contracts_client_name ON client_contracts(client_name);
CREATE INDEX idx_client_contracts_project_id ON client_contracts(project_id);
CREATE INDEX idx_client_contracts_active ON client_contracts(is_active);

-- =====================================================
-- TABLE 8: project_guarantees
-- Guarantee periods by project
-- =====================================================
CREATE TABLE IF NOT EXISTS project_guarantees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Project identification
  project_id TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,

  -- Guarantee configuration
  guarantee_period_days INTEGER NOT NULL DEFAULT 90,
  guarantee_start_date TIMESTAMPTZ, -- Override default (install_date)

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_project_guarantees_project_id ON project_guarantees(project_id);

-- =====================================================
-- TABLE 9: billable_fee_schedule
-- Fee lookup table for billable tickets
-- =====================================================
CREATE TABLE IF NOT EXISTS billable_fee_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Fee classification
  service_type TEXT NOT NULL,
  ticket_type TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Pricing
  base_fee DECIMAL(10,2) NOT NULL,
  hourly_rate DECIMAL(10,2),
  travel_fee DECIMAL(10,2) DEFAULT 0,

  -- Applicability
  project_id TEXT, -- NULL = applies to all projects
  is_active BOOLEAN DEFAULT TRUE,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,

  -- Metadata
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT valid_effective_dates CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE INDEX idx_billable_fee_schedule_service_type ON billable_fee_schedule(service_type);
CREATE INDEX idx_billable_fee_schedule_ticket_type ON billable_fee_schedule(ticket_type);
CREATE INDEX idx_billable_fee_schedule_project_id ON billable_fee_schedule(project_id);
CREATE INDEX idx_billable_fee_schedule_active ON billable_fee_schedule(is_active);

-- =====================================================
-- TABLE 10: ticket_billing
-- Billing metadata and invoice tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID UNIQUE NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

  -- Billing details
  billing_type TEXT NOT NULL CHECK (billing_type IN ('guarantee', 'sla', 'billable')),
  billable_hours DECIMAL(10,2),
  parts_cost DECIMAL(10,2) DEFAULT 0,
  travel_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) NOT NULL,

  -- Approval workflow
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Invoice tracking
  invoice_id TEXT, -- External invoice system ID
  invoice_generated_at TIMESTAMPTZ,
  invoice_url TEXT, -- Firebase Storage URL

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_billing_ticket_id ON ticket_billing(ticket_id);
CREATE INDEX idx_ticket_billing_approval_status ON ticket_billing(approval_status);
CREATE INDEX idx_ticket_billing_billing_type ON ticket_billing(billing_type);

-- =====================================================
-- TABLE 11: ticket_assignment_history
-- Assignment audit trail
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

  -- Assignment details
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Context
  assignment_reason TEXT,
  previous_assignee UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_ticket_assignment_history_ticket_id ON ticket_assignment_history(ticket_id);
CREATE INDEX idx_ticket_assignment_history_assigned_to ON ticket_assignment_history(assigned_to);
CREATE INDEX idx_ticket_assignment_history_assigned_at ON ticket_assignment_history(assigned_at DESC);

-- =====================================================
-- TABLE 12: notification_log
-- Notification tracking (email, SMS, WhatsApp)
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,

  -- Notification details
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms', 'whatsapp', 'system')),
  recipient TEXT NOT NULL, -- Email, phone, WhatsApp chat ID
  subject TEXT,
  message TEXT NOT NULL,

  -- Delivery status
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'delivered')) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,

  -- Context
  trigger_event TEXT, -- What triggered this notification
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_log_ticket_id ON notification_log(ticket_id);
CREATE INDEX idx_notification_log_status ON notification_log(status);
CREATE INDEX idx_notification_log_created_at ON notification_log(created_at DESC);

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Trigger 1: Auto-generate ticket_uid in TKT-YYYY-NNNNN format
CREATE OR REPLACE FUNCTION generate_ticket_uid()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT;
  next_sequence INTEGER;
  new_uid TEXT;
BEGIN
  -- Only generate if UID is NULL (for non-TKT sources)
  IF NEW.ticket_uid IS NULL THEN
    current_year := TO_CHAR(NOW(), 'YYYY');

    -- Get next sequence number for this year
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(ticket_uid FROM 'TKT-' || current_year || '-([0-9]+)$') AS INTEGER)
    ), 0) + 1
    INTO next_sequence
    FROM tickets
    WHERE ticket_uid LIKE 'TKT-' || current_year || '-%';

    -- Generate UID in TKT-YYYY-NNNNN format
    new_uid := 'TKT-' || current_year || '-' || LPAD(next_sequence::TEXT, 5, '0');
    NEW.ticket_uid := new_uid;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ticket_uid
BEFORE INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_uid();

-- Trigger 2: Update tickets.updated_at on every update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tickets_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger 3: Update ticket_notes.updated_at
CREATE TRIGGER trigger_ticket_notes_updated_at
BEFORE UPDATE ON ticket_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger 4: Auto-increment attachment count
CREATE OR REPLACE FUNCTION increment_attachments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tickets SET attachments_count = attachments_count + 1 WHERE id = NEW.ticket_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tickets SET attachments_count = GREATEST(attachments_count - 1, 0) WHERE id = OLD.ticket_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_attachments_count
AFTER INSERT OR DELETE ON ticket_attachments
FOR EACH ROW
EXECUTE FUNCTION increment_attachments_count();

-- Trigger 5: Auto-increment notes count
CREATE OR REPLACE FUNCTION increment_notes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tickets SET notes_count = notes_count + 1 WHERE id = NEW.ticket_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tickets SET notes_count = GREATEST(notes_count - 1, 0) WHERE id = OLD.ticket_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_notes_count
AFTER INSERT OR DELETE ON ticket_notes
FOR EACH ROW
EXECUTE FUNCTION increment_notes_count();

-- Trigger 6: Auto-create ticket history on status change
CREATE OR REPLACE FUNCTION create_ticket_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO ticket_history (ticket_id, action, new_value, changed_by, changed_at)
    VALUES (NEW.id, 'created', jsonb_build_object('status', NEW.status, 'priority', NEW.priority)::TEXT, NEW.created_by, NEW.created_at);

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO ticket_history (ticket_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.id, 'status_changed', 'status', OLD.status, NEW.status, NEW.created_by);
    END IF;

    IF OLD.priority != NEW.priority THEN
      INSERT INTO ticket_history (ticket_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.id, 'priority_changed', 'priority', OLD.priority, NEW.priority, NEW.created_by);
    END IF;

    IF (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
      INSERT INTO ticket_history (ticket_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.id, 'assigned', 'assigned_to', OLD.assigned_to::TEXT, NEW.assigned_to::TEXT, NEW.created_by);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_ticket_history
AFTER INSERT OR UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION create_ticket_history();

-- Trigger 7: Calculate resolution_time when status changes to resolved
CREATE OR REPLACE FUNCTION calculate_resolution_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at := NOW();
    NEW.resolution_time := NOW() - NEW.created_at;
  ELSIF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_resolution_time
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION calculate_resolution_time();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE tickets IS 'Core ticketing system with 7 independent sources and billing automation';
COMMENT ON TABLE ticket_notes IS 'Internal and external notes with visibility control';
COMMENT ON TABLE ticket_attachments IS 'File uploads stored in Firebase Storage';
COMMENT ON TABLE ticket_history IS 'Complete audit trail of all ticket changes';
COMMENT ON TABLE ticket_tags IS 'Tagging system for ticket organization';
COMMENT ON TABLE sla_configs IS 'SLA rules by ticket type and priority';
COMMENT ON TABLE client_contracts IS 'Client SLA contracts with custom terms';
COMMENT ON TABLE project_guarantees IS 'Project-specific guarantee periods';
COMMENT ON TABLE billable_fee_schedule IS 'Fee structure for billable tickets';
COMMENT ON TABLE ticket_billing IS 'Billing metadata and invoice tracking';
COMMENT ON TABLE ticket_assignment_history IS 'Assignment audit trail';
COMMENT ON TABLE notification_log IS 'Notification delivery tracking';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
