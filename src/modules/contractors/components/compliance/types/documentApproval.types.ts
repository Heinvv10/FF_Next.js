/**
 * Document Approval Types - Type definitions for compliance and approval workflows
 * Extracted from original ComplianceTracker for better organization
 */

/**
 * Compliance issue severity levels
 */
export type ComplianceIssueSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Compliance issue types
 */
export type ComplianceIssueType = 
  | 'regulatory_compliance' 
  | 'quality_check_failed' 
  | 'expiry_warning' 
  | 'missing_document'
  | 'invalid_format'
  | 'approval_pending';

/**
 * Compliance issue data structure
 */
export interface ComplianceIssue {
  /**
   * Unique identifier for the issue
   */
  id: string;
  
  /**
   * Type of compliance issue
   */
  type: ComplianceIssueType;
  
  /**
   * Severity level of the issue
   */
  severity: ComplianceIssueSeverity;
  
  /**
   * Human-readable message describing the issue
   */
  message: string;
  
  /**
   * Suggested action to resolve the issue
   */
  suggestedAction: string;
  
  /**
   * Whether the issue can be automatically fixed
   */
  autoFixAvailable: boolean;
  
  /**
   * Optional document ID related to the issue
   */
  documentId?: string;
  
  /**
   * Optional contractor ID related to the issue
   */
  contractorId?: string;
  
  /**
   * When the issue was first detected
   */
  detectedAt?: Date;
  
  /**
   * When the issue was resolved (if applicable)
   */
  resolvedAt?: Date;
}

/**
 * Document approval workflow status
 */
export type DocumentApprovalStatus = 
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired';

/**
 * Document approval workflow data
 */
export interface DocumentApproval {
  /**
   * Unique identifier
   */
  id: string;
  
  /**
   * Document ID being approved
   */
  documentId: string;
  
  /**
   * Current approval status
   */
  status: DocumentApprovalStatus;
  
  /**
   * User ID who submitted for approval
   */
  submittedBy: string;
  
  /**
   * When the document was submitted
   */
  submittedAt: Date;
  
  /**
   * User ID who reviewed/approved
   */
  reviewedBy?: string;
  
  /**
   * When the review was completed
   */
  reviewedAt?: Date;
  
  /**
   * Review comments or rejection reason
   */
  comments?: string;
  
  /**
   * Compliance issues found during review
   */
  complianceIssues?: ComplianceIssue[];
}