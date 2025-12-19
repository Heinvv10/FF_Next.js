// =====================================================
// FibreFlow Ticketing Module - SLA Types
// =====================================================

import { TicketPriority, TicketType } from './tickets';

export interface SLAConfig {
  id: string;
  ticket_type: string;
  priority: TicketPriority;
  response_hours: number;
  resolution_hours: number;
  business_hours_only: boolean;
  business_start_hour: number;
  business_end_hour: number;
  business_days: string[];
  escalation_enabled: boolean;
  escalation_threshold: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface SLACalculationInput {
  ticket_type: TicketType;
  priority: TicketPriority;
  created_at: string;
  sla_config?: SLAConfig;
  client_contract_id?: string;
  custom_response_hours?: number;
  custom_resolution_hours?: number;
  business_hours_only?: boolean;
}

export interface SLACalculationResult {
  response_due_at: string;
  resolution_due_at: string;
  sla_config_id: string;
  business_hours_only: boolean;
  escalation_enabled: boolean;
  escalation_at: string | null; // When to escalate (e.g., 75% of SLA)
}

export interface SLAStatus {
  ticket_id: string;
  ticket_uid: string;
  due_at: string | null;
  created_at: string;
  elapsed_time: string; // ISO 8601 duration
  total_time: string; // ISO 8601 duration
  sla_percentage: number; // 0-100
  is_paused: boolean;
  paused_at: string | null;
  pause_reason: string | null;
  is_breached: boolean;
  breach_duration: string | null;
  time_remaining: string | null; // Negative if breached
  should_escalate: boolean;
  escalation_threshold: number;
}

export interface SLAPauseInput {
  ticket_id: string;
  pause_reason: string;
  paused_by: string;
}

export interface SLAResumeInput {
  ticket_id: string;
  resumed_by: string;
}

export interface CreateSLAConfigInput {
  ticket_type: string;
  priority: TicketPriority;
  response_hours: number;
  resolution_hours: number;
  business_hours_only?: boolean;
  business_start_hour?: number;
  business_end_hour?: number;
  business_days?: string[];
  escalation_enabled?: boolean;
  escalation_threshold?: number;
}

export interface UpdateSLAConfigInput {
  response_hours?: number;
  resolution_hours?: number;
  business_hours_only?: boolean;
  business_start_hour?: number;
  business_end_hour?: number;
  business_days?: string[];
  escalation_enabled?: boolean;
  escalation_threshold?: number;
  is_active?: boolean;
}

export interface SLAEscalation {
  ticket_id: string;
  ticket_uid: string;
  title: string;
  priority: TicketPriority;
  assigned_to: string | null;
  sla_percentage: number;
  due_at: string;
  time_remaining: string;
  escalation_threshold: number;
  escalated_at: string;
}

export interface SLAMetrics {
  total_tickets: number;
  within_sla: number;
  breached_sla: number;
  at_risk: number; // Above escalation threshold
  avg_resolution_time: string | null;
  avg_response_time: string | null;
  sla_compliance_rate: number; // Percentage
}

export interface BusinessHoursConfig {
  start_hour: number;
  end_hour: number;
  days: string[];
}

export interface SLAWarning {
  ticket_id: string;
  ticket_uid: string;
  title: string;
  sla_percentage: number;
  due_at: string;
  time_remaining: string;
  warning_level: 'info' | 'warning' | 'critical';
}
