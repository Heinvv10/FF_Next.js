/**
 * Maintenance Types
 *
 * Types for maintenance scheduling, calibration, and service records.
 */

import type { AssetConditionType } from '../constants/conditions';
import type { MaintenanceTypeValue, MaintenanceStatusValue } from '../constants/maintenanceTypes';
import type { Asset } from './asset';

/**
 * Asset Maintenance Record
 */
export interface AssetMaintenance {
  id: string;
  assetId: string;
  asset?: Asset;

  maintenanceType: MaintenanceTypeValue;
  status: MaintenanceStatusValue;

  // Scheduling
  scheduledDate: Date;
  dueDate?: Date;
  completedDate?: Date;

  // Provider
  providerName?: string;
  providerContact?: string;
  providerReference?: string;

  // Work details
  description?: string;
  workPerformed?: string;
  findings?: string;
  recommendations?: string;

  // Calibration specific
  calibrationStandard?: string;
  calibrationCertificateNumber?: string;
  calibrationResults?: Record<string, unknown>;
  passFail?: 'pass' | 'fail' | 'conditional';
  nextCalibrationDate?: Date;

  // Costs
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  currency: string;
  invoiceNumber?: string;

  // Condition tracking
  conditionBefore?: AssetConditionType;
  conditionAfter?: AssetConditionType;

  // Related documents
  documentIds?: string[];

  notes?: string;

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  completedBy?: string;
}

/**
 * Maintenance list item (lighter version)
 */
export interface MaintenanceListItem {
  id: string;
  assetId: string;
  assetNumber?: string;
  assetName?: string;
  maintenanceType: MaintenanceTypeValue;
  status: MaintenanceStatusValue;
  scheduledDate: Date;
  completedDate?: Date;
  providerName?: string;
  isOverdue?: boolean;
}

/**
 * Schedule maintenance payload
 */
export interface ScheduleMaintenancePayload {
  assetId: string;
  maintenanceType: MaintenanceTypeValue;
  scheduledDate: string | Date;
  dueDate?: string | Date;
  providerName?: string;
  providerContact?: string;
  description?: string;
  notes?: string;
}

/**
 * Complete maintenance payload
 */
export interface CompleteMaintenancePayload {
  maintenanceId: string;
  completedDate: string | Date;
  workPerformed: string;
  findings?: string;
  recommendations?: string;

  // Calibration specific
  calibrationCertificateNumber?: string;
  calibrationResults?: Record<string, unknown>;
  passFail?: 'pass' | 'fail' | 'conditional';
  nextCalibrationDate?: string | Date;

  // Costs
  laborCost?: number;
  partsCost?: number;
  invoiceNumber?: string;

  conditionAfter: AssetConditionType;
  notes?: string;
}

/**
 * Maintenance filter options
 */
export interface MaintenanceFilter {
  assetId?: string;
  maintenanceType?: MaintenanceTypeValue[];
  status?: MaintenanceStatusValue[];
  scheduledDateFrom?: string | Date;
  scheduledDateTo?: string | Date;
  isOverdue?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Upcoming maintenance item
 */
export interface UpcomingMaintenance {
  id: string;
  assetId: string;
  assetNumber: string;
  assetName: string;
  maintenanceType: MaintenanceTypeValue;
  scheduledDate: Date;
  daysUntilDue: number;
}

/**
 * Overdue maintenance item
 */
export interface OverdueMaintenance {
  id: string;
  assetId: string;
  assetNumber: string;
  assetName: string;
  maintenanceType: MaintenanceTypeValue;
  dueDate: Date;
  daysOverdue: number;
}

/**
 * Calibration status for test equipment
 */
export interface CalibrationStatus {
  assetId: string;
  assetNumber: string;
  assetName: string;
  lastCalibrationDate?: Date;
  nextCalibrationDate?: Date;
  calibrationProvider?: string;
  isOverdue: boolean;
  daysUntilDue?: number;
  daysOverdue?: number;
  lastCertificateNumber?: string;
}
