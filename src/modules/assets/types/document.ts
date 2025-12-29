/**
 * Document Types
 *
 * Types for asset documents and attachments.
 */

/**
 * Document type classification
 */
export const DocumentType = {
  CALIBRATION_CERTIFICATE: 'calibration_certificate',
  PURCHASE_INVOICE: 'purchase_invoice',
  WARRANTY_CARD: 'warranty_card',
  MANUAL: 'manual',
  SERVICE_REPORT: 'service_report',
  INSURANCE_DOCUMENT: 'insurance_document',
  DISPOSAL_CERTIFICATE: 'disposal_certificate',
  PHOTO: 'photo',
  OTHER: 'other',
} as const;

export type DocumentTypeValue = (typeof DocumentType)[keyof typeof DocumentType];

export const DOCUMENT_TYPE_CONFIG: Record<DocumentTypeValue, { label: string; icon: string }> = {
  [DocumentType.CALIBRATION_CERTIFICATE]: {
    label: 'Calibration Certificate',
    icon: 'award',
  },
  [DocumentType.PURCHASE_INVOICE]: {
    label: 'Purchase Invoice',
    icon: 'receipt',
  },
  [DocumentType.WARRANTY_CARD]: {
    label: 'Warranty Card',
    icon: 'shield',
  },
  [DocumentType.MANUAL]: {
    label: 'Manual',
    icon: 'book',
  },
  [DocumentType.SERVICE_REPORT]: {
    label: 'Service Report',
    icon: 'file-text',
  },
  [DocumentType.INSURANCE_DOCUMENT]: {
    label: 'Insurance Document',
    icon: 'shield-check',
  },
  [DocumentType.DISPOSAL_CERTIFICATE]: {
    label: 'Disposal Certificate',
    icon: 'file-minus',
  },
  [DocumentType.PHOTO]: {
    label: 'Photo',
    icon: 'camera',
  },
  [DocumentType.OTHER]: {
    label: 'Other',
    icon: 'file',
  },
};

/**
 * Asset Document Record
 */
export interface AssetDocument {
  id: string;
  assetId: string;
  maintenanceId?: string;

  documentType: DocumentTypeValue;
  documentName: string;
  documentNumber?: string;

  // File info
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;

  // Validity
  issueDate?: Date;
  expiryDate?: Date;
  isExpired?: boolean;

  // Issuer
  issuingAuthority?: string;
  issuerContact?: string;

  isActive: boolean;
  notes?: string;

  // Audit
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Document list item
 */
export interface DocumentListItem {
  id: string;
  assetId: string;
  documentType: DocumentTypeValue;
  documentName: string;
  fileName: string;
  fileUrl: string;
  expiryDate?: Date;
  isExpired?: boolean;
  createdAt: Date;
}

/**
 * Upload document payload
 */
export interface UploadDocumentPayload {
  assetId: string;
  maintenanceId?: string;
  documentType: DocumentTypeValue;
  documentName: string;
  documentNumber?: string;
  issueDate?: string | Date;
  expiryDate?: string | Date;
  issuingAuthority?: string;
  issuerContact?: string;
  notes?: string;
  // File will be handled separately via multipart form
}

/**
 * Document filter options
 */
export interface DocumentFilter {
  assetId?: string;
  maintenanceId?: string;
  documentType?: DocumentTypeValue[];
  isExpired?: boolean;
  expiringWithinDays?: number;
  page?: number;
  limit?: number;
}

/**
 * Expiring document alert
 */
export interface ExpiringDocument {
  id: string;
  assetId: string;
  assetNumber: string;
  assetName: string;
  documentType: DocumentTypeValue;
  documentName: string;
  expiryDate: Date;
  daysUntilExpiry: number;
}
