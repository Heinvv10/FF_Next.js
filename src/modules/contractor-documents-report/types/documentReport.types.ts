/**
 * Contractor Documents Report - Type Definitions
 *
 * Defines all TypeScript interfaces for the document status reporting system
 */

// Document verification status
export type DocumentVerificationStatus =
  | 'verified'    // ✅ Uploaded and verified
  | 'pending'     // ⏳ Uploaded, awaiting verification
  | 'rejected'    // 🔄 Rejected, needs resubmission
  | 'missing';    // ⬜ Never uploaded

// Document urgency based on expiry
export type DocumentUrgencyLevel =
  | 'ok'          // ✅ Verified, not expiring soon (or no expiry)
  | 'expiring'    // ⚠️ Expires within 30 days
  | 'expired';    // 🔴 Past expiry date

// Combined status for display
export type DocumentDisplayStatus =
  | 'verified'
  | 'pending'
  | 'rejected'
  | 'missing'
  | 'expiring'
  | 'expired';

// Company document types (6 types)
export type CompanyDocumentType =
  | 'CIDB Certificate'
  | 'B-BBEE Certificate'
  | 'Company Registration'
  | 'Tax Clearance'
  | 'Bank Confirmation Letter'
  | 'Proof of Address';

// Team member document types (1 type)
export type TeamMemberDocumentType = 'ID Document';

// All document types
export type DocumentType = CompanyDocumentType | TeamMemberDocumentType;

// Document category
export type DocumentCategory = 'company' | 'team_member';

// Document expiry configuration
export interface DocumentExpiryConfig {
  type: DocumentType;
  hasExpiry: boolean;
  expiryWarningDays: number; // Days before expiry to show warning
}

// Individual document info
export interface DocumentInfo {
  id: string;
  type: DocumentType;
  category: DocumentCategory;
  verificationStatus: DocumentVerificationStatus;
  fileName?: string;
  fileUrl?: string;
  expiryDate?: string; // ISO date string
  daysUntilExpiry?: number; // Calculated
  urgencyLevel: DocumentUrgencyLevel;
  displayStatus: DocumentDisplayStatus;
  uploadedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

// Team member with their documents
export interface TeamMemberDocuments {
  teamMemberId: string;
  memberName: string;
  role: string;
  idDocument?: DocumentInfo;
  displayStatus: DocumentDisplayStatus; // Overall status for this member
}

// Contractor summary statistics
export interface ContractorDocumentSummary {
  totalDocuments: number;        // Total expected documents
  verified: number;              // Count of verified docs
  pending: number;               // Count of pending verification
  missing: number;               // Count of missing docs
  expired: number;               // Count of expired docs
  rejected: number;              // Count of rejected docs
  expiring: number;              // Count of docs expiring within 30 days
  completionPercentage: number;  // Percentage complete (0-100)
}

// Alert for user attention
export interface DocumentAlert {
  type: 'expiring' | 'expired' | 'missing' | 'pending' | 'rejected';
  message: string;
  severity: 'info' | 'warning' | 'error';
  documentId?: string;
  documentType?: string;
}

// Contractor basic info
export interface ContractorBasicInfo {
  id: string;
  name: string;
  status: string;
}

// Full contractor document report
export interface ContractorDocumentReport {
  contractor: ContractorBasicInfo;
  summary: ContractorDocumentSummary;
  companyDocuments: DocumentInfo[];
  teamDocuments: TeamMemberDocuments[];
  alerts: DocumentAlert[];
  lastUpdated: string;
}

// All contractors summary (for summary page)
export interface ContractorSummaryItem {
  id: string;
  name: string;
  completionPercentage: number;
  totalDocuments: number;
  verified: number;
  missing: number;
  expired: number;
  pending: number;
  expiring: number;
  hasAlerts: boolean;
  alertCount: number;
}

// Overall statistics across all contractors
export interface OverallStatistics {
  totalContractors: number;
  fullyCompliant: number;      // 100% complete
  partiallyCompliant: number;  // 50-99% complete
  nonCompliant: number;        // < 50% complete
}

// All contractors summary response
export interface AllContractorsSummary {
  contractors: ContractorSummaryItem[];
  overallStats: OverallStatistics;
}

// Export request payload
export interface DocumentExportRequest {
  contractorId: string;
  format: 'csv' | 'pdf';
  includeTeamMembers: boolean;
}

// Notification for dashboard
export interface DocumentNotification {
  id: string;
  contractorId: string;
  contractorName: string;
  type: 'missing_docs' | 'expired_docs' | 'expiring_soon' | 'pending_verification';
  message: string;
  severity: 'info' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

// Expiry notification tracking (for cron job)
export interface ExpiryNotificationRecord {
  id: string;
  contractorId: string;
  documentId: string;
  documentType: string;
  expiryDate: string;
  notificationSentAt?: string;
  reminder30Days: boolean;
  reminder14Days: boolean;
  reminder7Days: boolean;
}
