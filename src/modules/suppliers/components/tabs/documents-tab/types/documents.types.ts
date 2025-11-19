// ============= Document Types =============
// Type definitions for supplier documents

export type DocumentType = 'contract' | 'certificate' | 'compliance' | 'insurance' | 'financial' | 'quality' | 'safety';

export type DocumentStatus = 'current' | 'expiring_soon' | 'expired' | 'pending_review' | 'rejected';

export interface SupplierDocument {
  id: string;
  name: string;
  type: DocumentType;
  supplierId: string;
  supplierName: string;
  status: DocumentStatus;
  uploadDate: string;
  expiryDate?: string;
  fileSize: number;
  fileType: string;
  version: number;
  description: string;
  isRequired: boolean;
  reviewedBy?: string;
  reviewDate?: string;
  tags: string[];
}

export interface DocumentSummaryStats {
  total: number;
  current: number;
  expiringSoon: number;
  expired: number;
  pendingReview: number;
  required: number;
}
