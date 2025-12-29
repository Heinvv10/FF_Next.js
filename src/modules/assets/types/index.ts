/**
 * Asset Module Types
 *
 * Central export point for all type definitions.
 */

// Core Asset Types
export type {
  Asset,
  AssetWithCategory,
  AssetCategory,
  AssetListItem,
  AssetFilter,
  CreateAssetPayload,
  UpdateAssetPayload,
  PaginatedAssets,
} from './asset';

// Assignment Types
export {
  AssignmentType,
  type AssignmentTypeValue,
} from './assignment';

export type {
  AssetAssignment,
  AssignmentListItem,
  CheckoutPayload,
  CheckinPayload,
  TransferPayload,
  AssignmentFilter,
  OverdueAssignment,
} from './assignment';

// Maintenance Types
export type {
  AssetMaintenance,
  MaintenanceListItem,
  ScheduleMaintenancePayload,
  CompleteMaintenancePayload,
  MaintenanceFilter,
  UpcomingMaintenance,
  OverdueMaintenance,
  CalibrationStatus,
} from './maintenance';

// Document Types
export {
  DocumentType,
  type DocumentTypeValue,
  DOCUMENT_TYPE_CONFIG,
} from './document';

export type {
  AssetDocument,
  DocumentListItem,
  UploadDocumentPayload,
  DocumentFilter,
  ExpiringDocument,
} from './document';

// Dashboard Types
export type {
  DashboardSummary,
  AssetsByStatus,
  AssetsByCategory,
  MonthlyActivity,
  DashboardAlert,
  RecentActivity,
  TopAssignedAsset,
  MaintenanceStats,
  DashboardFilter,
  DashboardData,
} from './dashboard';

// Common API response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedAPIResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
