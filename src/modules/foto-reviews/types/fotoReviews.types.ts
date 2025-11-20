// TypeScript types for Foto Reviews module

export type ApprovalStatus = 'pending_review' | 'approved' | 'rejected' | 'sent';
export type ApprovalAction = 'approved' | 'rejected' | 'edited' | 'sent';

export interface AIReviewResult {
  passed: boolean;
  score: number;
  confidence: number;
  recommendation: string;
  issues: string[];
  image_path: string;
}

export interface FotoReview {
  job_id: string;
  dr_number: string;
  project: string;
  status: ApprovalStatus;
  ai_score: number;
  ai_confidence: number;
  queued_at: string;
  image_url: string;
  result?: AIReviewResult;
  original_feedback?: string;
  edited_feedback?: string;
  reviewer_id?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  whatsapp_sent_at?: string;
}

export interface PendingReviewsResponse {
  reviews: FotoReview[];
  total: number;
  page: number;
  limit: number;
}

export interface ReviewDetailResponse {
  job_id: string;
  dr_number: string;
  project: string;
  status: ApprovalStatus;
  result: AIReviewResult;
  original_feedback: string;
  edited_feedback: string | null;
  queued_at: string;
  reviewer_id?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  whatsapp_sent_at?: string;
}

export interface ApprovalHistoryEntry {
  id: number;
  job_id: string;
  action: ApprovalAction;
  user_id: string;
  user_name: string;
  notes: string;
  timestamp: string;
}

export interface ApproveReviewRequest {
  edited_feedback?: string;
}

export interface RejectReviewRequest {
  rejection_reason: string;
}

export interface EditFeedbackRequest {
  edited_feedback: string;
}

export interface SendToWhatsAppResponse {
  success: boolean;
  sent_at: string;
  message: string;
}

export interface ReviewFilters {
  status?: ApprovalStatus;
  project?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
