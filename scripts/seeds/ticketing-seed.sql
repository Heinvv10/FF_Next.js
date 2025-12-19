-- =====================================================
-- FibreFlow Ticketing Module - Seed Data
-- =====================================================
-- Created: 2025-12-18
-- Purpose: Seed SLA configs, fee schedules, and project guarantees
-- =====================================================

-- =====================================================
-- SEED: sla_configs
-- Default SLA configurations for all ticket types and priorities
-- =====================================================

-- Fault tickets (most critical)
INSERT INTO sla_configs (ticket_type, priority, response_hours, resolution_hours, business_hours_only, escalation_enabled, escalation_threshold)
VALUES
  ('fault', 'critical', 1, 4, FALSE, TRUE, 0.75),   -- Critical faults: 1h response, 4h resolution (24/7)
  ('fault', 'high', 2, 8, TRUE, TRUE, 0.75),        -- High faults: 2h response, 8h resolution (business hours)
  ('fault', 'medium', 4, 24, TRUE, TRUE, 0.75),     -- Medium faults: 4h response, 24h resolution
  ('fault', 'low', 8, 48, TRUE, TRUE, 0.80);        -- Low faults: 8h response, 48h resolution

-- Maintenance tickets
INSERT INTO sla_configs (ticket_type, priority, response_hours, resolution_hours, business_hours_only, escalation_enabled, escalation_threshold)
VALUES
  ('maintenance', 'critical', 2, 8, TRUE, TRUE, 0.75),
  ('maintenance', 'high', 4, 16, TRUE, TRUE, 0.75),
  ('maintenance', 'medium', 8, 48, TRUE, TRUE, 0.80),
  ('maintenance', 'low', 16, 96, TRUE, FALSE, 0.80);

-- Installation tickets
INSERT INTO sla_configs (ticket_type, priority, response_hours, resolution_hours, business_hours_only, escalation_enabled, escalation_threshold)
VALUES
  ('installation', 'critical', 4, 24, TRUE, TRUE, 0.75),
  ('installation', 'high', 8, 48, TRUE, TRUE, 0.75),
  ('installation', 'medium', 16, 96, TRUE, FALSE, 0.80),
  ('installation', 'low', 24, 168, TRUE, FALSE, 0.80);

-- Query tickets
INSERT INTO sla_configs (ticket_type, priority, response_hours, resolution_hours, business_hours_only, escalation_enabled, escalation_threshold)
VALUES
  ('query', 'critical', 2, 8, TRUE, TRUE, 0.75),
  ('query', 'high', 4, 16, TRUE, TRUE, 0.75),
  ('query', 'medium', 8, 48, TRUE, FALSE, 0.80),
  ('query', 'low', 16, 96, TRUE, FALSE, 0.80);

-- Complaint tickets
INSERT INTO sla_configs (ticket_type, priority, response_hours, resolution_hours, business_hours_only, escalation_enabled, escalation_threshold)
VALUES
  ('complaint', 'critical', 1, 8, TRUE, TRUE, 0.70),   -- Complaints escalate earlier (70%)
  ('complaint', 'high', 2, 16, TRUE, TRUE, 0.70),
  ('complaint', 'medium', 4, 48, TRUE, TRUE, 0.75),
  ('complaint', 'low', 8, 96, TRUE, FALSE, 0.80);

-- Other tickets (general)
INSERT INTO sla_configs (ticket_type, priority, response_hours, resolution_hours, business_hours_only, escalation_enabled, escalation_threshold)
VALUES
  ('other', 'critical', 2, 8, TRUE, TRUE, 0.75),
  ('other', 'high', 4, 24, TRUE, TRUE, 0.75),
  ('other', 'medium', 8, 48, TRUE, FALSE, 0.80),
  ('other', 'low', 16, 96, TRUE, FALSE, 0.80);

-- =====================================================
-- SEED: billable_fee_schedule
-- Default fee structure for billable tickets
-- =====================================================

-- Fault repair fees
INSERT INTO billable_fee_schedule (service_type, ticket_type, priority, base_fee, hourly_rate, travel_fee, description)
VALUES
  ('fault_repair', 'fault', 'critical', 500.00, 150.00, 100.00, 'Critical fault repair (after-hours callout)'),
  ('fault_repair', 'fault', 'high', 350.00, 120.00, 75.00, 'High priority fault repair'),
  ('fault_repair', 'fault', 'medium', 250.00, 100.00, 50.00, 'Standard fault repair'),
  ('fault_repair', 'fault', 'low', 150.00, 80.00, 50.00, 'Low priority fault repair');

-- Maintenance fees
INSERT INTO billable_fee_schedule (service_type, ticket_type, priority, base_fee, hourly_rate, travel_fee, description)
VALUES
  ('maintenance', 'maintenance', 'critical', 400.00, 130.00, 75.00, 'Emergency maintenance'),
  ('maintenance', 'maintenance', 'high', 300.00, 110.00, 50.00, 'High priority maintenance'),
  ('maintenance', 'maintenance', 'medium', 200.00, 90.00, 50.00, 'Standard maintenance'),
  ('maintenance', 'maintenance', 'low', 150.00, 75.00, 0.00, 'Routine maintenance');

-- Installation fees
INSERT INTO billable_fee_schedule (service_type, ticket_type, priority, base_fee, hourly_rate, travel_fee, description)
VALUES
  ('installation', 'installation', 'critical', 600.00, 150.00, 100.00, 'Emergency installation'),
  ('installation', 'installation', 'high', 450.00, 120.00, 75.00, 'Priority installation'),
  ('installation', 'installation', 'medium', 350.00, 100.00, 50.00, 'Standard installation'),
  ('installation', 'installation', 'low', 250.00, 80.00, 50.00, 'Scheduled installation');

-- Query handling fees (lower rates)
INSERT INTO billable_fee_schedule (service_type, ticket_type, priority, base_fee, hourly_rate, travel_fee, description)
VALUES
  ('query', 'query', 'critical', 150.00, 100.00, 50.00, 'Urgent query handling'),
  ('query', 'query', 'high', 100.00, 80.00, 0.00, 'Priority query'),
  ('query', 'query', 'medium', 75.00, 60.00, 0.00, 'Standard query'),
  ('query', 'query', 'low', 50.00, 50.00, 0.00, 'General query');

-- Complaint handling fees
INSERT INTO billable_fee_schedule (service_type, ticket_type, priority, base_fee, hourly_rate, travel_fee, description)
VALUES
  ('complaint', 'complaint', 'critical', 200.00, 120.00, 75.00, 'Urgent complaint resolution'),
  ('complaint', 'complaint', 'high', 150.00, 100.00, 50.00, 'Priority complaint'),
  ('complaint', 'complaint', 'medium', 100.00, 80.00, 0.00, 'Standard complaint'),
  ('complaint', 'complaint', 'low', 75.00, 60.00, 0.00, 'General complaint');

-- Other service fees
INSERT INTO billable_fee_schedule (service_type, ticket_type, priority, base_fee, hourly_rate, travel_fee, description)
VALUES
  ('other', 'other', 'critical', 300.00, 120.00, 75.00, 'Critical other service'),
  ('other', 'other', 'high', 200.00, 100.00, 50.00, 'High priority service'),
  ('other', 'other', 'medium', 150.00, 80.00, 50.00, 'Standard service'),
  ('other', 'other', 'low', 100.00, 60.00, 0.00, 'General service');

-- =====================================================
-- SEED: project_guarantees
-- Default guarantee periods for active projects
-- =====================================================

-- VeloFibre active projects (from WA Monitor)
INSERT INTO project_guarantees (project_id, project_name, guarantee_period_days, notes)
VALUES
  ('lawley', 'Lawley', 90, 'Standard 90-day guarantee from install date'),
  ('mohadin', 'Mohadin', 90, 'Standard 90-day guarantee from install date'),
  ('mamelodi', 'Mamelodi', 90, 'Standard 90-day guarantee from install date'),
  ('velo-test', 'Velo Test', 365, 'Extended guarantee for test project');

-- Add other projects as needed
INSERT INTO project_guarantees (project_id, project_name, guarantee_period_days, notes)
VALUES
  ('default', 'Default Project', 90, 'Default guarantee period for all projects');

-- =====================================================
-- SEED: ticket_tags
-- Common ticket tags for organization
-- =====================================================

INSERT INTO ticket_tags (name, color, description)
VALUES
  ('urgent', '#FF0000', 'Requires immediate attention'),
  ('vip-client', '#FFD700', 'VIP client ticket'),
  ('follow-up', '#FFA500', 'Requires follow-up action'),
  ('duplicate', '#808080', 'Duplicate ticket'),
  ('escalated', '#FF4500', 'Escalated to management'),
  ('billing-dispute', '#8B0000', 'Billing dispute or query'),
  ('parts-required', '#4169E1', 'Waiting for parts'),
  ('weather-delay', '#87CEEB', 'Delayed due to weather'),
  ('third-party', '#9370DB', 'Requires third-party coordination'),
  ('customer-no-show', '#A9A9A9', 'Customer not available'),
  ('resolved-remotely', '#32CD32', 'Resolved without site visit'),
  ('site-access-issue', '#DC143C', 'Site access problem'),
  ('quality-issue', '#8B4513', 'Quality concern'),
  ('documentation', '#4682B4', 'Documentation issue'),
  ('training-required', '#DAA520', 'Requires customer training');

-- =====================================================
-- SEED: Sample client_contracts (optional)
-- Example contracts for testing
-- =====================================================

-- Example: Premium SLA contract for a major client
INSERT INTO client_contracts (
  client_name,
  client_id,
  project_id,
  contract_start,
  contract_end,
  is_active,
  custom_response_hours,
  custom_resolution_hours,
  business_hours_only,
  notes
)
VALUES (
  'VeloFibre Premium Client',
  'VF-PREMIUM-001',
  'lawley',
  NOW(),
  NOW() + INTERVAL '1 year',
  TRUE,
  1.0, -- 1 hour response
  4.0, -- 4 hour resolution
  FALSE, -- 24/7 support
  'Premium SLA contract with 24/7 support'
);

-- Example: Standard SLA contract
INSERT INTO client_contracts (
  client_name,
  client_id,
  project_id,
  contract_start,
  contract_end,
  is_active,
  custom_response_hours,
  custom_resolution_hours,
  business_hours_only,
  notes
)
VALUES (
  'Standard Corporate Client',
  'VF-STD-001',
  'mohadin',
  NOW(),
  NOW() + INTERVAL '1 year',
  TRUE,
  4.0, -- 4 hour response
  24.0, -- 24 hour resolution
  TRUE, -- Business hours only
  'Standard SLA contract (business hours)'
);

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify seed data was inserted correctly
-- =====================================================

-- Verify SLA configs (should have 24 rows: 6 types × 4 priorities)
-- SELECT ticket_type, priority, response_hours, resolution_hours
-- FROM sla_configs
-- ORDER BY ticket_type,
--   CASE priority
--     WHEN 'critical' THEN 1
--     WHEN 'high' THEN 2
--     WHEN 'medium' THEN 3
--     WHEN 'low' THEN 4
--   END;

-- Verify fee schedule (should have 24 rows: 6 service types × 4 priorities)
-- SELECT service_type, ticket_type, priority, base_fee, hourly_rate
-- FROM billable_fee_schedule
-- ORDER BY service_type,
--   CASE priority
--     WHEN 'critical' THEN 1
--     WHEN 'high' THEN 2
--     WHEN 'medium' THEN 3
--     WHEN 'low' THEN 4
--   END;

-- Verify project guarantees
-- SELECT project_id, project_name, guarantee_period_days
-- FROM project_guarantees
-- ORDER BY project_id;

-- Verify tags
-- SELECT name, color, description
-- FROM ticket_tags
-- ORDER BY name;

-- Verify contracts
-- SELECT client_name, project_id, custom_response_hours, custom_resolution_hours, is_active
-- FROM client_contracts
-- WHERE is_active = TRUE;

-- =====================================================
-- END OF SEED DATA
-- =====================================================
