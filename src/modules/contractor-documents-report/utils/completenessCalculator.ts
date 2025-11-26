/**
 * Completeness Calculator
 *
 * Calculates document completion percentages and statistics
 */

import type {
  DocumentInfo,
  TeamMemberDocuments,
  ContractorDocumentSummary,
} from '../types/documentReport.types';
import { ALL_COMPANY_DOCUMENTS } from '../types/documentCategories';

/**
 * Calculate contractor document summary statistics
 */
export function calculateContractorSummary(
  companyDocuments: DocumentInfo[],
  teamDocuments: TeamMemberDocuments[]
): ContractorDocumentSummary {
  // Expected company documents
  const expectedCompanyDocs = ALL_COMPANY_DOCUMENTS.length;

  // Expected team member documents (1 ID per team member)
  const expectedTeamDocs = teamDocuments.length;

  // Total expected documents
  const totalDocuments = expectedCompanyDocs + expectedTeamDocs;

  // Count status for company documents
  let verified = 0;
  let pending = 0;
  let missing = 0;
  let expired = 0;
  let rejected = 0;
  let expiring = 0;

  // Count company document statuses
  companyDocuments.forEach((doc) => {
    switch (doc.displayStatus) {
      case 'verified':
        verified++;
        break;
      case 'pending':
        pending++;
        break;
      case 'missing':
        missing++;
        break;
      case 'expired':
        expired++;
        break;
      case 'rejected':
        rejected++;
        break;
      case 'expiring':
        expiring++;
        break;
    }
  });

  // Count team document statuses
  teamDocuments.forEach((member) => {
    switch (member.displayStatus) {
      case 'verified':
        verified++;
        break;
      case 'pending':
        pending++;
        break;
      case 'missing':
        missing++;
        break;
      case 'expired':
        expired++;
        break;
      case 'rejected':
        rejected++;
        break;
      case 'expiring':
        expiring++;
        break;
    }
  });

  // Calculate completion percentage
  // Documents are "complete" if they're verified or expiring (but not expired/missing/rejected/pending)
  const completeCount = verified + expiring;
  const completionPercentage = totalDocuments > 0
    ? Math.round((completeCount / totalDocuments) * 100)
    : 0;

  return {
    totalDocuments,
    verified,
    pending,
    missing,
    expired,
    rejected,
    expiring,
    completionPercentage,
  };
}

/**
 * Determine compliance level based on completion percentage
 */
export function getComplianceLevel(completionPercentage: number): 'full' | 'partial' | 'non' {
  if (completionPercentage === 100) {
    return 'full';
  } else if (completionPercentage >= 50) {
    return 'partial';
  } else {
    return 'non';
  }
}

/**
 * Get progress bar color based on completion percentage
 */
export function getProgressBarColor(completionPercentage: number): string {
  if (completionPercentage === 100) {
    return 'bg-green-500';
  } else if (completionPercentage >= 75) {
    return 'bg-blue-500';
  } else if (completionPercentage >= 50) {
    return 'bg-yellow-500';
  } else if (completionPercentage >= 25) {
    return 'bg-orange-500';
  } else {
    return 'bg-red-500';
  }
}

/**
 * Calculate overall statistics across all contractors
 */
export function calculateOverallStatistics(contractors: Array<{ completionPercentage: number }>) {
  const totalContractors = contractors.length;
  let fullyCompliant = 0;
  let partiallyCompliant = 0;
  let nonCompliant = 0;

  contractors.forEach((contractor) => {
    const level = getComplianceLevel(contractor.completionPercentage);
    if (level === 'full') {
      fullyCompliant++;
    } else if (level === 'partial') {
      partiallyCompliant++;
    } else {
      nonCompliant++;
    }
  });

  return {
    totalContractors,
    fullyCompliant,
    partiallyCompliant,
    nonCompliant,
  };
}
