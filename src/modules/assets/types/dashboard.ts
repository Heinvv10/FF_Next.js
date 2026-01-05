/**
 * Dashboard Types
 *
 * Types for asset dashboard statistics and metrics.
 */

import type { AssetStatusType } from '../constants/assetStatus';
import type { AssetCategoryTypeValue } from '../constants/assetCategories';
import type { MaintenanceTypeValue } from '../constants/maintenanceTypes';

/**
 * Dashboard summary statistics
 */
export interface DashboardSummary {
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  inMaintenanceAssets: number;
  outForCalibrationAssets: number;
  retiredAssets: number;

  // Alerts
  overdueCalibrations: number;
  calibrationsDueIn7Days: number;
  overdueMaintenance: number;
  maintenanceDueIn7Days: number;
  overdueReturns: number;

  // Values
  totalAssetValue: number;
  totalDepreciation: number;
  currentBookValue: number;

  // Utilization
  utilizationRate: number; // % of assets currently assigned
}

/**
 * Assets by status breakdown
 */
export interface AssetsByStatus {
  status: AssetStatusType;
  count: number;
  percentage: number;
}

/**
 * Assets by category breakdown
 */
export interface AssetsByCategory {
  categoryType: AssetCategoryTypeValue;
  categoryName: string;
  count: number;
  totalValue: number;
  assignedCount: number;
}

/**
 * Monthly asset activity
 */
export interface MonthlyActivity {
  month: string; // YYYY-MM
  checkouts: number;
  checkins: number;
  maintenanceCompleted: number;
  calibrationsCompleted: number;
  newAssets: number;
  disposedAssets: number;
}

/**
 * Alert item for dashboard
 */
export interface DashboardAlert {
  id: string;
  type:
    | 'calibration_overdue'
    | 'calibration_due'
    | 'maintenance_overdue'
    | 'maintenance_due'
    | 'return_overdue'
    | 'document_expiring';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  assetId: string;
  assetNumber: string;
  assetName: string;
  dueDate?: Date;
  daysOverdue?: number;
  daysUntilDue?: number;
  createdAt: Date;
}

/**
 * Recent activity item
 */
export interface RecentActivity {
  id: string;
  type: 'checkout' | 'checkin' | 'maintenance' | 'calibration' | 'created' | 'updated';
  assetId: string;
  assetNumber: string;
  assetName: string;
  description: string;
  performedBy: string;
  performedAt: Date;
}

/**
 * Top assigned assets
 */
export interface TopAssignedAsset {
  assetId: string;
  assetNumber: string;
  assetName: string;
  categoryType: AssetCategoryTypeValue;
  totalAssignments: number;
  totalDaysAssigned: number;
  currentlyAssigned: boolean;
}

/**
 * Maintenance statistics
 */
export interface MaintenanceStats {
  maintenanceType: MaintenanceTypeValue;
  scheduled: number;
  completed: number;
  overdue: number;
  averageCost: number;
  totalCost: number;
}

/**
 * Dashboard filter options
 */
export interface DashboardFilter {
  dateFrom?: string | Date;
  dateTo?: string | Date;
  categoryType?: AssetCategoryTypeValue[];
  warehouseLocation?: string;
}

/**
 * Full dashboard data response
 */
export interface DashboardData {
  summary: DashboardSummary;
  byStatus: AssetsByStatus[];
  byCategory: AssetsByCategory[];
  alerts: DashboardAlert[];
  recentActivity: RecentActivity[];
  monthlyActivity: MonthlyActivity[];
}
