// =====================================================
// FibreFlow Ticketing Module - Type Exports
// =====================================================

// Ticket types
export type {
  Ticket,
  TicketSource,
  TicketStatus,
  TicketPriority,
  TicketType,
  BillingType,
  CreateTicketInput,
  UpdateTicketInput,
  TicketFilters,
  TicketNote,
  CreateNoteInput,
  TicketAttachment,
  TicketHistory,
  TicketTag,
  TicketAssignment,
  TicketStats,
  TicketDashboardData,
} from './tickets';

// Billing types
export type {
  TicketBilling,
  BillableCalculation,
  BillableFeeSchedule,
  ClientContract,
  ProjectGuarantee,
  CreateBillingInput,
  UpdateBillingInput,
  ApproveBillingInput,
  RejectBillingInput,
  CreateFeeScheduleInput,
  UpdateFeeScheduleInput,
  CreateContractInput,
  UpdateContractInput,
  CreateGuaranteeInput,
  UpdateGuaranteeInput,
  BillingApprovalQueueItem,
  InvoiceLineItem,
  GenerateInvoiceInput,
  InvoiceResponse,
} from './billing';

// SLA types
export type {
  SLAConfig,
  SLACalculationInput,
  SLACalculationResult,
  SLAStatus,
  SLAPauseInput,
  SLAResumeInput,
  CreateSLAConfigInput,
  UpdateSLAConfigInput,
  SLAEscalation,
  SLAMetrics,
  BusinessHoursConfig,
  SLAWarning,
} from './sla';

// Notification types
export interface NotificationLog {
  id: string;
  ticket_id: string | null;
  notification_type: 'email' | 'sms' | 'whatsapp' | 'system';
  recipient: string;
  subject: string | null;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sent_at: string | null;
  delivered_at: string | null;
  error_message: string | null;
  trigger_event: string | null;
  created_at: string;
}

export interface SendNotificationInput {
  ticket_id?: string;
  notification_type: 'email' | 'sms' | 'whatsapp' | 'system';
  recipient: string;
  subject?: string;
  message: string;
  trigger_event?: string;
}

// DR Lookup types
export interface DRLookupResult {
  dr_number: string;
  project_id: string;
  project_name: string;
  client_name: string | null;
  address: string | null;
  gps_coordinates: string | null;
  install_date: string | null;
  guarantee_expires_at: string | null;
  is_in_guarantee: boolean;
}

// External integration types
export interface QContactTicket {
  id: string;
  fault_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  client_name: string;
  client_contact: string;
  address: string;
  created_at: string;
}

export interface QContactStatusUpdate {
  fault_number: string;
  status: string;
  notes?: string;
}

export interface WhatsAppMessage {
  chat_id: string;
  message_id: string;
  from: string;
  message_body: string;
  timestamp: string;
  media_url?: string;
  media_type?: string;
}

export interface WhatsAppSendMessage {
  chat_id: string;
  message: string;
  reply_to?: string;
}

export interface EmailTicket {
  from: string;
  subject: string;
  body: string;
  received_at: string;
  attachments: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content_type: string;
  size: number;
  data: Buffer | string;
}

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface TicketListResponse extends PaginatedResponse<Ticket> {
  filters_applied: TicketFilters;
}
