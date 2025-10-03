/**
 * Types for contractor applications workflow
 */

export interface ContractorApplication {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  registrationNumber: string;
  businessType: string;
  industryCategory: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  complianceStatus: 'pending' | 'approved' | 'rejected' | 'in_review';
  ragOverall: 'green' | 'amber' | 'red';
  ragFinancial: 'green' | 'amber' | 'red';
  ragCompliance: 'green' | 'amber' | 'red';
  ragPerformance: 'green' | 'amber' | 'red';
  ragSafety: 'green' | 'amber' | 'red';
  onboardingProgress: number;
  documentsExpiring: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface ApplicationFilter {
  status: string;
  dateRange: {
    start: string;
    end: string;
  };
  search: string;
}

export interface ApplicationAction {
  type: 'approve' | 'reject' | 'request_more_info' | 'schedule_review';
  contractorId: string;
  notes?: string;
  nextReviewDate?: string;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  inReview: number;
}