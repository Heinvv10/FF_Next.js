// =====================================================
// FibreFlow Ticketing Module - Ticket Types
// =====================================================

export type TicketSource =
  | 'qcontact'
  | 'whatsapp'
  | 'email'
  | 'construction'
  | 'internal'
  | 'whatsapp_outbound'
  | 'adhoc';

export type TicketStatus =
  | 'new'
  | 'triaged'
  | 'assigned'
  | 'in_progress'
  | 'blocked'
  | 'resolved'
  | 'closed'
  | 'cancelled'
  | 'pending_approval';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export type TicketType =
  | 'fault'
  | 'maintenance'
  | 'installation'
  | 'query'
  | 'complaint'
  | 'other';

export type BillingType = 'guarantee' | 'sla' | 'billable';

export interface Ticket {
  id: string;
  ticket_uid: string;

  // Source and identification
  source: TicketSource;
  external_id: string | null;

  // Core ticket data
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType | null;

  // Assignment and ownership
  assigned_to: string | null;
  created_by: string;
  project_id: string | null;
  dr_number: string | null;

  // Location and contact
  client_name: string | null;
  client_contact: string | null;
  client_email: string | null;
  address: string | null;
  gps_coordinates: string | null; // Format: "lat,lng"

  // Billing classification
  billing_type: BillingType;
  requires_billing_approval: boolean;
  estimated_cost: number | null;
  actual_cost: number | null;
  billing_approved_by: string | null;
  billing_approved_at: string | null;
  billing_notes: string | null;

  // SLA tracking
  sla_config_id: string | null;
  due_at: string | null;
  sla_paused_at: string | null;
  sla_pause_reason: string | null;
  sla_breached: boolean;
  sla_breach_duration: string | null;
  response_time: string | null;
  resolution_time: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;

  // Metadata
  tags: string[];
  attachments_count: number;
  notes_count: number;
  related_tickets: string[];
}

export interface CreateTicketInput {
  // Required fields
  source: TicketSource;
  title: string;
  created_by: string;

  // Optional fields
  ticket_uid?: string; // Pre-generated UID (e.g., from WhatsApp DR number)
  external_id?: string;
  description?: string;
  priority?: TicketPriority;
  type?: TicketType;
  assigned_to?: string;
  project_id?: string;
  dr_number?: string;
  client_name?: string;
  client_contact?: string;
  client_email?: string;
  address?: string;
  gps_coordinates?: string;
  tags?: string[];
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  type?: TicketType;
  assigned_to?: string | null;
  project_id?: string;
  dr_number?: string;
  client_name?: string;
  client_contact?: string;
  client_email?: string;
  address?: string;
  gps_coordinates?: string;
  billing_notes?: string;
  tags?: string[];
}

export interface TicketFilters {
  source?: TicketSource | TicketSource[];
  status?: TicketStatus | TicketStatus[];
  priority?: TicketPriority | TicketPriority[];
  type?: TicketType | TicketType[];
  assigned_to?: string;
  created_by?: string;
  project_id?: string;
  billing_type?: BillingType;
  sla_breached?: boolean;
  created_after?: string;
  created_before?: string;
  due_before?: string;
  tags?: string[];
  search?: string; // Full-text search across title, description, ticket_uid
}

export interface TicketNote {
  id: string;
  ticket_id: string;
  content: string;
  note_type: 'internal' | 'external' | 'system';
  visibility: 'private' | 'public';
  created_by: string;
  created_at: string;
  updated_at: string;
  is_resolution: boolean;
  attachments: string[];
}

export interface CreateNoteInput {
  ticket_id: string;
  content: string;
  note_type?: 'internal' | 'external' | 'system';
  visibility?: 'private' | 'public';
  created_by: string;
  is_resolution?: boolean;
  attachments?: string[];
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  filename: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string;
  uploaded_at: string;
  description: string | null;
  is_internal: boolean;
}

export interface TicketHistory {
  id: string;
  ticket_id: string;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string;
  change_reason: string | null;
  metadata: Record<string, unknown> | null;
}

export interface TicketTag {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  created_at: string;
  created_by: string | null;
  usage_count: number;
}

export interface TicketAssignment {
  ticket_id: string;
  assigned_to: string;
  assigned_by: string;
  assignment_reason?: string;
}

export interface TicketStats {
  total_tickets: number;
  new_tickets: number;
  assigned_tickets: number;
  in_progress_tickets: number;
  blocked_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  pending_approval_tickets: number;
  sla_breached_tickets: number;
  avg_resolution_time: string | null;
  avg_response_time: string | null;
}

export interface TicketDashboardData {
  stats: TicketStats;
  recent_tickets: Ticket[];
  sla_at_risk_tickets: Ticket[];
  pending_approval_tickets: Ticket[];
  my_tickets: Ticket[];
}
