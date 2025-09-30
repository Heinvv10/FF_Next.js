// Pole Reviews Module Types
// Module: pole-reviews
// Created: 2025-09-23

export interface Contractor {
  id: number;
  name: string;
  whatsapp_number: string;
  created_at: string;
  updated_at: string;
}

export interface Pole {
  id: number;
  pole_number: string;
  location?: string;
  status: 'pending' | 'approved' | 'needs-redo';
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: number;
  pole_id: number;
  contractor_id: number;
  submitted_at: string;
  status: 'pending' | 'approved' | 'needs-redo';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  submission_id: number;
  reviewed_by: string; // Clerk user ID
  status: 'approved' | 'needs-redo';
  feedback: string;
  reviewed_at: string;
  created_at: string;
}

// Dashboard view combining all related data
export interface PoleDashboardItem {
  id: number;
  pole_number: string;
  location?: string;
  pole_status: 'pending' | 'approved' | 'needs-redo';
  pole_created_at: string;
  contractor_id?: number;
  contractor_name?: string;
  whatsapp_number?: string;
  submission_id?: number;
  submission_status?: 'pending' | 'approved' | 'needs-redo';
  submitted_at?: string;
  submission_notes?: string;
  review_id?: number;
  review_status?: 'approved' | 'needs-redo';
  feedback?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

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

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Filter and search types
export interface PoleFilters {
  status?: 'pending' | 'approved' | 'needs-redo';
  pole_number?: string;
  contractor_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface ReviewFilters {
  status?: 'approved' | 'needs-redo';
  reviewed_by?: string;
  date_from?: string;
  date_to?: string;
}

// Notification types
export interface NotificationPayload {
  type: 'whatsapp' | 'browser';
  recipient_id: number;
  message: string;
  pole_id: number;
  pole_number: string;
  feedback: string;
}

export interface WhatsAppNotification {
  to: string;
  body: string;
  from?: string;
}

export interface BrowserNotification {
  channel: string;
  event: string;
  data: {
    type: string;
    message: string;
    pole_id: number;
    pole_number: string;
    feedback: string;
    timestamp: string;
  };
}

// Preset feedback options
export const FEEDBACK_PRESETS = [
  "Missing photos for sides X, Y",
  "Photos are blurry or unclear",
  "Incorrect pole location marked",
  "Missing surrounding area photos",
  "Pole number not visible in photos",
  "Insufficient photo coverage",
  "Poor lighting conditions",
  "Obstructions in photos"
] as const;

export type FeedbackPreset = typeof FEEDBACK_PRESETS[number];

// Status options for UI
export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Review', color: 'yellow' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'needs-redo', label: 'Needs Redo', color: 'red' }
] as const;

export type PoleStatus = typeof STATUS_OPTIONS[number]['value'];
export type ReviewStatus = 'approved' | 'needs-redo';

// Sort options
export interface SortOptions {
  field: 'pole_number' | 'created_at' | 'status' | 'contractor_name';
  direction: 'asc' | 'desc';
}

// Export all types for easy importing
export type * from './common';
export type * from './api';
export type * from './forms';