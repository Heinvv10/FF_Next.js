/**
 * Assignment Types
 *
 * Types for check-out, check-in, and assignment history.
 */

import type { AssetConditionType } from '../constants/conditions';
import type { AssignmentTargetTypeValue } from '../constants/maintenanceTypes';
import type { Asset } from './asset';

/**
 * Assignment type - checkout, transfer, or return
 */
export const AssignmentType = {
  CHECKOUT: 'checkout',
  TRANSFER: 'transfer',
  RETURN: 'return',
} as const;

export type AssignmentTypeValue = (typeof AssignmentType)[keyof typeof AssignmentType];

/**
 * Asset Assignment Record - tracks check-out/in history
 */
export interface AssetAssignment {
  id: string;
  assetId: string;
  asset?: Asset;

  assignmentType: AssignmentTypeValue;

  // From (null for initial checkout)
  fromType?: AssignmentTargetTypeValue;
  fromId?: string;
  fromName?: string;
  fromLocation?: string;

  // To
  toType: AssignmentTargetTypeValue;
  toId: string;
  toName: string;
  toLocation?: string;

  // Project context (optional)
  projectId?: string;
  projectName?: string;

  // Timing
  checkedOutAt: Date;
  expectedReturnDate?: Date;
  checkedInAt?: Date;

  // Condition tracking
  conditionAtCheckout?: AssetConditionType;
  conditionAtCheckin?: AssetConditionType;

  // Authorization
  authorizedBy?: string;
  authorizationNotes?: string;

  // Check-in details
  checkedInBy?: string;
  checkinNotes?: string;

  // Checkout details
  checkoutNotes?: string;
  purpose?: string;

  // Status
  isActive: boolean;

  // Audit
  createdAt: Date;
  createdBy: string;
}

/**
 * Assignment list item (lighter version)
 */
export interface AssignmentListItem {
  id: string;
  assetId: string;
  assetNumber?: string;
  assetName?: string;
  assignmentType: AssignmentTypeValue;
  toType: AssignmentTargetTypeValue;
  toName: string;
  checkedOutAt: Date;
  expectedReturnDate?: Date;
  checkedInAt?: Date;
  isActive: boolean;
  isOverdue?: boolean;
}

/**
 * Checkout form payload
 */
export interface CheckoutPayload {
  assetId: string;
  toType: AssignmentTargetTypeValue;
  toId: string;
  toName: string;
  toLocation?: string;
  projectId?: string;
  projectName?: string;
  expectedReturnDate?: string | Date;
  conditionAtCheckout: AssetConditionType;
  purpose?: string;
  checkoutNotes?: string;
  authorizedBy?: string;
}

/**
 * Checkin form payload
 */
export interface CheckinPayload {
  assignmentId: string;
  conditionAtCheckin: AssetConditionType;
  checkinNotes?: string;
  newLocation?: string;
  maintenanceRequired?: boolean;
}

/**
 * Transfer payload (change assignee without full checkin)
 */
export interface TransferPayload {
  assetId: string;
  toType: AssignmentTargetTypeValue;
  toId: string;
  toName: string;
  toLocation?: string;
  transferNotes?: string;
}

/**
 * Assignment filter options
 */
export interface AssignmentFilter {
  assetId?: string;
  assignmentType?: AssignmentTypeValue[];
  toType?: AssignmentTargetTypeValue[];
  toId?: string;
  projectId?: string;
  isActive?: boolean;
  isOverdue?: boolean;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  page?: number;
  limit?: number;
}

/**
 * Overdue assignment summary
 */
export interface OverdueAssignment {
  id: string;
  assetId: string;
  assetNumber: string;
  assetName: string;
  toName: string;
  toType: AssignmentTargetTypeValue;
  expectedReturnDate: Date;
  daysOverdue: number;
}
