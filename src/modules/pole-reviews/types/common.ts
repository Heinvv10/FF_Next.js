// Common types used across the pole reviews module

// Base entity interface
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

// Timestamp interface
export interface Timestamps {
  created_at: string;
  updated_at: string;
}

// User context for authentication
export interface UserContext {
  id: string;
  role?: 'contractor' | 'agent' | 'admin';
  name?: string;
}

// Error handling
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Search and filter options
export interface SearchOptions {
  query?: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

// WebSocket event types
export interface WebSocketEvent {
  type: string;
  payload: any;
  timestamp: string;
}

// File upload (if needed in future)
export interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploaded_at: string;
}