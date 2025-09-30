// API-related types for pole reviews module

import { PaginationMeta, SearchOptions } from './common';
import { Contractor, Pole, Submission, Review, PoleDashboardItem } from './index';

// Generic API response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
  meta?: PaginationMeta;
}

// Paginated API response
export interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
  message?: string;
}

// Contractors API
export interface CreateContractorRequest {
  name: string;
  whatsapp_number: string;
}

export interface UpdateContractorRequest {
  name?: string;
  whatsapp_number?: string;
}

export interface ContractorsResponse extends ApiResponse<Contractor[]> {}

// Poles API
export interface CreatePoleRequest {
  pole_number: string;
  location?: string;
  status?: 'pending' | 'approved' | 'needs-redo';
}

export interface UpdatePoleRequest {
  pole_number?: string;
  location?: string;
  status?: 'pending' | 'approved' | 'needs-redo';
}

export interface PolesResponse extends PaginatedApiResponse<PoleDashboardItem> {}

// Submissions API
export interface CreateSubmissionRequest {
  pole_id: number;
  contractor_id: number;
  notes?: string;
}

export interface UpdateSubmissionRequest {
  status?: 'pending' | 'approved' | 'needs-redo';
  notes?: string;
}

export interface SubmissionsResponse extends ApiResponse<Submission[]> {}

// Reviews API
export interface CreateReviewRequest {
  submission_id: number;
  status: 'approved' | 'needs-redo';
  feedback: string;
}

export interface UpdateReviewRequest {
  status?: 'approved' | 'needs-redo';
  feedback?: string;
}

export interface ReviewsResponse extends ApiResponse<Review[]> {}

// Dashboard API
export interface DashboardFilters {
  status?: 'pending' | 'approved' | 'needs-redo';
  pole_number?: string;
  contractor_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface DashboardRequest extends SearchOptions {
  filters?: DashboardFilters;
}

export interface DashboardResponse extends PaginatedApiResponse<PoleDashboardItem> {}

// Statistics API
export interface PoleStats {
  total_poles: number;
  pending_review: number;
  approved: number;
  needs_redo: number;
  reviewed_today: number;
  contractors_count: number;
}

export interface StatsResponse extends ApiResponse<PoleStats> {}

// Bulk operations
export interface BulkUpdateRequest {
  submission_ids: number[];
  status: 'approved' | 'needs-redo';
  feedback?: string;
}

export interface BulkUpdateResponse extends ApiResponse<{
  updated_count: number;
  failed_ids: number[];
  errors: string[];
}> {}

// Form types
export interface CreatePoleForm {
  pole_number: string;
  location?: string;
  contractor_id: number;
  notes?: string;
}

export interface UpdateSubmissionForm {
  status: 'approved' | 'needs-redo';
  feedback?: string;
}

export interface CreateReviewForm {
  submission_id: number;
  status: 'approved' | 'needs-redo';
  feedback: string;
}