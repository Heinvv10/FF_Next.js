// DROPS Quality Control System TypeScript Types

export interface DropsContractor {
  id: string;
  name: string;
  whatsapp_number: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  drop_id: string;
  step_number: number;
  step_name: string;
  phase: 'A' | 'B' | 'C' | 'D' | 'E';
  is_completed: boolean;
  photo_url?: string;
  notes?: string;
  barcode_scan?: string;
  powermeter_reading?: number;
  customer_signature?: any;
  created_at: string;
  updated_at: string;
}

export interface DropSubmission {
  id: string;
  drop_id: string;
  contractor_id: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'needs-rectification';
  completion_score: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DropReview {
  id: string;
  submission_id: string;
  reviewed_by?: string;
  status: 'approved' | 'needs-rectification';
  feedback: string;
  missing_steps: number[];
  completion_score: number;
  reviewed_at: string;
  created_at: string;
}

export interface QualityMetric {
  id: string;
  drop_id: string;
  contractor_id: string;
  submission_id: string;
  total_steps: number;
  completed_steps: number;
  completion_rate: number;
  common_missing_items: string[];
  time_to_rectification?: number;
  created_at: string;
}

export interface Drop {
  id: string;
  drop_number: string;
  pole_number: string;
  customer_address: string;
  status: string;
  qc_status: 'pending' | 'approved' | 'needs-rectification';
  qc_updated_at: string;
  created_at: string;
  updated_at: string;
}

export interface DropWithDetails extends Drop {
  contractor?: DropsContractor;
  submission?: DropSubmission;
  review?: DropReview;
  completed_steps: number;
  total_steps: number;
}

export interface ChecklistValidation {
  is_valid: boolean;
  completed_steps: number;
  missing_steps: number[];
  completion_rate: number;
  phase_completion: {
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
  };
  issues: string[];
}

export interface NotificationPayload {
  type: 'whatsapp' | 'browser';
  recipient: string;
  message: string;
  drop_id: string;
  drop_number: string;
  contractor_name: string;
  missing_steps?: number[];
  feedback?: string;
}

// 14-Step Velocity Fibre Checklist Template
export const CHECKLIST_TEMPLATE = [
  { step_number: 1, step_name: 'Property Frontage', phase: 'A' as const, description: 'Wide shot of house, street number visible' },
  { step_number: 2, step_name: 'Location on Wall (Before Install)', phase: 'A' as const, description: 'Show intended ONT spot + power outlet' },
  { step_number: 3, step_name: 'Outside Cable Span', phase: 'A' as const, description: 'Wide shot showing full span' },
  { step_number: 4, step_name: 'Home Entry Point - Outside', phase: 'A' as const, description: 'Close-up of pigtail screw/duct entry' },
  { step_number: 5, step_name: 'Home Entry Point - Inside', phase: 'A' as const, description: 'Inside view of same entry penetration' },
  { step_number: 6, step_name: 'Fibre Entry to ONT (After Install)', phase: 'B' as const, description: 'Show slack loop + clips/conduit' },
  { step_number: 7, step_name: 'Patched & Labelled Drop', phase: 'B' as const, description: 'Label with Drop Number visible' },
  { step_number: 8, step_name: 'Overall Work Area After Completion', phase: 'B' as const, description: 'ONT, fibre routing & electrical outlet' },
  { step_number: 9, step_name: 'ONT Barcode', phase: 'C' as const, description: 'Scan barcode + photo of label' },
  { step_number: 10, step_name: 'Mini-UPS Serial Number', phase: 'C' as const, description: 'Scan/enter serial + photo of label' },
  { step_number: 11, step_name: 'Powermeter Reading (Drop/Feeder)', phase: 'D' as const, description: 'Enter dBm + photo of meter screen' },
  { step_number: 12, step_name: 'Powermeter at ONT (Before Activation)', phase: 'D' as const, description: 'Enter dBm + photo of meter screen' },
  { step_number: 13, step_name: 'Active Broadband Light', phase: 'D' as const, description: 'ONT light ON + Fibertime sticker' },
  { step_number: 14, step_name: 'Customer Signature', phase: 'E' as const, description: 'Digital signature + customer name' }
];

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardResponse {
  drops: DropWithDetails[];
  total_drops: number;
  pending_drops: number;
  approved_drops: number;
  needs_rectification_drops: number;
  average_completion_rate: number;
}

export interface NotificationPayload {
  type: 'whatsapp' | 'browser' | 'both' | 'email';
  recipient: string;
  message: string;
  drop_id: string;
  drop_number: string;
  contractor_name: string;
  missing_steps?: number[];
  feedback?: string;
}