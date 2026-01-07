/**
 * Staff Document Types
 * Full HR Package: ID, licenses, contracts, certifications, qualifications, medical certs
 */

export type DocumentType =
  | 'id_document'
  | 'drivers_license'
  | 'employment_contract'
  | 'certification'
  | 'qualification'
  | 'medical_certificate'
  | 'police_clearance'
  | 'bank_details'
  | 'tax_document'
  | 'other';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export interface StaffDocument {
  id: string;
  staffId: string;
  documentType: DocumentType;
  documentName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  expiryDate?: string;
  issuedDate?: string;
  issuingAuthority?: string;
  documentNumber?: string;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  verifier?: {
    id: string;
    name: string;
  };
  staff?: {
    id: string;
    name: string;
  };
}

export interface StaffDocumentUpload {
  staffId: string;
  documentType: DocumentType;
  documentName: string;
  file: File;
  expiryDate?: string;
  issuedDate?: string;
  issuingAuthority?: string;
  documentNumber?: string;
}

export interface StaffDocumentCreate {
  staffId: string;
  documentType: DocumentType;
  documentName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  expiryDate?: string;
  issuedDate?: string;
  issuingAuthority?: string;
  documentNumber?: string;
}

export interface StaffDocumentUpdate {
  documentName?: string;
  expiryDate?: string;
  issuedDate?: string;
  issuingAuthority?: string;
  documentNumber?: string;
}

export interface DocumentVerification {
  status: 'verified' | 'rejected';
  notes?: string;
}

export interface DocumentExpiryAlert {
  id: string;
  staffDocumentId: string;
  alertDate: string;
  alertType: '30_day' | '7_day' | 'expired';
  isSent: boolean;
  sentAt?: string;
  createdAt: string;
  // Joined data
  document?: StaffDocument;
}

export interface ComplianceStatus {
  staffId: string;
  totalDocuments: number;
  verifiedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  expiredDocuments: number;
  expiringIn30Days: number;
  expiringIn7Days: number;
  missingRequired: DocumentType[];
  compliancePercentage: number;
  status: 'compliant' | 'warning' | 'non_compliant';
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  id_document: 'ID Document / Passport',
  drivers_license: "Driver's License",
  employment_contract: 'Employment Contract',
  certification: 'Industry Certification',
  qualification: 'Educational Qualification',
  medical_certificate: 'Medical Certificate',
  police_clearance: 'Police Clearance',
  bank_details: 'Banking Details',
  tax_document: 'Tax Document',
  other: 'Other'
};

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  id_document: 'IdCard',
  drivers_license: 'Car',
  employment_contract: 'FileText',
  certification: 'Award',
  qualification: 'GraduationCap',
  medical_certificate: 'Stethoscope',
  police_clearance: 'Shield',
  bank_details: 'Building2',
  tax_document: 'Receipt',
  other: 'File'
};

export const DOCUMENTS_WITH_EXPIRY: DocumentType[] = [
  'drivers_license',
  'medical_certificate',
  'police_clearance',
  'certification'
];

export const REQUIRED_DOCUMENTS: DocumentType[] = [
  'id_document',
  'employment_contract'
];

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: 'Pending Review',
  verified: 'Verified',
  rejected: 'Rejected',
  expired: 'Expired'
};

export const VERIFICATION_STATUS_COLORS: Record<VerificationStatus, string> = {
  pending: 'yellow',
  verified: 'green',
  rejected: 'red',
  expired: 'gray'
};

// Document categories for grouping in UI
export const DOCUMENT_CATEGORIES = {
  identity: ['id_document', 'drivers_license', 'police_clearance'] as DocumentType[],
  employment: ['employment_contract', 'bank_details', 'tax_document'] as DocumentType[],
  qualifications: ['certification', 'qualification', 'medical_certificate'] as DocumentType[],
  other: ['other'] as DocumentType[]
};

export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  identity: 'Identity & Verification',
  employment: 'Employment & Financial',
  qualifications: 'Qualifications & Certifications',
  other: 'Other Documents'
};
