// =====================================================
// FibreFlow Ticketing Module - Billing Types
// =====================================================

import { BillingType } from './tickets';

export interface TicketBilling {
  id: string;
  ticket_id: string;
  billing_type: BillingType;
  billable_hours: number | null;
  parts_cost: number;
  travel_cost: number;
  total_cost: number;
  requires_approval: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  invoice_id: string | null;
  invoice_generated_at: string | null;
  invoice_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillableCalculation {
  billing_type: BillingType;
  reason: string;
  estimated_cost: number | null;
  requires_approval: boolean;
  guarantee_expires_at: string | null;
  contract_id: string | null;
  fee_schedule_id: string | null;
}

export interface BillableFeeSchedule {
  id: string;
  service_type: string;
  ticket_type: string;
  priority: string | null;
  base_fee: number;
  hourly_rate: number | null;
  travel_fee: number;
  project_id: string | null;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ClientContract {
  id: string;
  client_name: string;
  client_id: string | null;
  project_id: string | null;
  contract_start: string;
  contract_end: string;
  is_active: boolean;
  custom_response_hours: number | null;
  custom_resolution_hours: number | null;
  business_hours_only: boolean;
  contract_document_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ProjectGuarantee {
  id: string;
  project_id: string;
  project_name: string;
  guarantee_period_days: number;
  guarantee_start_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateBillingInput {
  ticket_id: string;
  billing_type: BillingType;
  billable_hours?: number;
  parts_cost?: number;
  travel_cost?: number;
  total_cost: number;
  requires_approval?: boolean;
  notes?: string;
}

export interface UpdateBillingInput {
  billable_hours?: number;
  parts_cost?: number;
  travel_cost?: number;
  total_cost?: number;
  notes?: string;
}

export interface ApproveBillingInput {
  approved_by: string;
  notes?: string;
}

export interface RejectBillingInput {
  rejected_by: string;
  rejection_reason: string;
}

export interface CreateFeeScheduleInput {
  service_type: string;
  ticket_type: string;
  priority?: string;
  base_fee: number;
  hourly_rate?: number;
  travel_fee?: number;
  project_id?: string;
  description?: string;
  effective_from?: string;
  effective_to?: string;
  created_by: string;
}

export interface UpdateFeeScheduleInput {
  base_fee?: number;
  hourly_rate?: number;
  travel_fee?: number;
  description?: string;
  effective_to?: string;
  is_active?: boolean;
}

export interface CreateContractInput {
  client_name: string;
  client_id?: string;
  project_id?: string;
  contract_start: string;
  contract_end: string;
  custom_response_hours?: number;
  custom_resolution_hours?: number;
  business_hours_only?: boolean;
  contract_document_url?: string;
  notes?: string;
  created_by: string;
}

export interface UpdateContractInput {
  client_name?: string;
  client_id?: string;
  project_id?: string;
  contract_start?: string;
  contract_end?: string;
  custom_response_hours?: number;
  custom_resolution_hours?: number;
  business_hours_only?: boolean;
  contract_document_url?: string;
  notes?: string;
  is_active?: boolean;
}

export interface CreateGuaranteeInput {
  project_id: string;
  project_name: string;
  guarantee_period_days?: number;
  guarantee_start_date?: string;
  notes?: string;
  created_by: string;
}

export interface UpdateGuaranteeInput {
  project_name?: string;
  guarantee_period_days?: number;
  guarantee_start_date?: string;
  notes?: string;
}

export interface BillingApprovalQueueItem {
  ticket_id: string;
  ticket_uid: string;
  title: string;
  client_name: string | null;
  estimated_cost: number | null;
  created_at: string;
  created_by: string;
  billing_type: BillingType;
  approval_status: 'pending' | 'approved' | 'rejected';
}

export interface InvoiceLineItem {
  ticket_uid: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  billable_hours: number | null;
  parts_cost: number;
  travel_cost: number;
}

export interface GenerateInvoiceInput {
  ticket_id: string;
  invoice_data: InvoiceLineItem;
}

export interface InvoiceResponse {
  invoice_id: string;
  invoice_url: string;
  generated_at: string;
}
