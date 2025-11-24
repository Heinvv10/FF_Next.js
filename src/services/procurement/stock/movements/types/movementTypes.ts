/**
 * Movement Type Definitions
 * All type definitions for stock movements
 */

export interface GRNData {
  referenceNumber: string;
  poNumber: string;
  supplierName: string;
  receivedBy: string;
  receivedDate: Date;
  items: Array<{
    itemCode: string;
    itemName: string;
    plannedQuantity: number;
    receivedQuantity: number;
    unitCost: number;
    lotNumbers?: string[];
    serialNumbers?: string[];
    qualityCheckRequired?: boolean;
    qualityNotes?: string;
  }>;
}

export interface IssueData {
  referenceNumber: string;
  workOrderNumber: string;
  issuedTo: string;
  issuedBy: string;
  issueDate: Date;
  purpose: string;
  items: Array<{
    itemCode: string;
    requestedQuantity: number;
    issuedQuantity: number;
    unitCost?: number;
    lotNumbers?: string[];
    serialNumbers?: string[];
    notes?: string;
  }>;
}

export interface TransferData {
  referenceNumber: string;
  fromProjectId: string;
  toProjectId: string;
  fromLocation: string;
  toLocation: string;
  transferredBy: string;
  transferDate: Date;
  reason: string;
  items: Array<{
    itemCode: string;
    transferQuantity: number;
    unitCost?: number;
    notes?: string;
  }>;
}

export interface ReturnData {
  referenceNumber: string;
  originalIssueNumber?: string;
  returnedBy: string;
  returnedTo: string;
  returnDate: Date;
  returnReason: string;
  items: Array<{
    itemCode: string;
    returnQuantity: number;
    condition: 'good' | 'damaged' | 'expired';
    notes?: string;
  }>;
}
