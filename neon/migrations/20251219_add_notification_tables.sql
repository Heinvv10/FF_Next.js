-- =====================================================
-- FibreFlow Ticketing Module - Notification Tables
-- =====================================================
-- Created: 2025-12-19
-- Purpose: Additional tables for notification service
-- =====================================================

-- =====================================================
-- TABLE: user_notifications
-- In-app notifications for users
-- =====================================================
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  
  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Read status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at DESC);

-- =====================================================
-- TABLE: notification_preferences
-- User notification preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Channel preferences
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  
  -- Quiet hours
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Event preferences (JSON object for flexibility)
  event_preferences JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- =====================================================
-- Seed default SLA configurations
-- =====================================================
INSERT INTO sla_configs (ticket_type, priority, response_hours, resolution_hours, business_hours_only)
VALUES 
  ('fault', 'critical', 1, 4, false),
  ('fault', 'high', 4, 8, true),
  ('fault', 'medium', 8, 24, true),
  ('fault', 'low', 24, 72, true),
  ('maintenance', 'critical', 2, 8, false),
  ('maintenance', 'high', 8, 24, true),
  ('maintenance', 'medium', 24, 48, true),
  ('maintenance', 'low', 48, 120, true),
  ('installation', 'critical', 4, 24, true),
  ('installation', 'high', 8, 48, true),
  ('installation', 'medium', 24, 72, true),
  ('installation', 'low', 48, 168, true),
  ('query', 'critical', 4, 8, true),
  ('query', 'high', 8, 24, true),
  ('query', 'medium', 24, 48, true),
  ('query', 'low', 48, 120, true)
ON CONFLICT (ticket_type, priority) DO NOTHING;

-- =====================================================
-- Seed default billable fee schedule
-- =====================================================
INSERT INTO billable_fee_schedule (service_type, ticket_type, priority, base_fee, hourly_rate, travel_fee, description)
VALUES 
  ('fault_repair', 'fault', 'critical', 750.00, 250.00, 150.00, 'Emergency fault repair'),
  ('fault_repair', 'fault', 'high', 500.00, 200.00, 100.00, 'High priority fault repair'),
  ('fault_repair', 'fault', 'medium', 350.00, 150.00, 75.00, 'Standard fault repair'),
  ('fault_repair', 'fault', 'low', 250.00, 100.00, 50.00, 'Low priority fault repair'),
  ('installation', 'installation', NULL, 500.00, 200.00, 100.00, 'Standard installation'),
  ('maintenance', 'maintenance', NULL, 300.00, 150.00, 75.00, 'Scheduled maintenance'),
  ('consultation', 'query', NULL, 200.00, 100.00, 50.00, 'Technical consultation')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE user_notifications IS 'In-app notifications for users';
COMMENT ON TABLE notification_preferences IS 'User notification channel preferences';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
