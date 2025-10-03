/**
 * Contractor Compliance Utilities
 * Extracted helper functions for constitutional compliance
 */

import type {
  ComplianceIssue,
  ExpiringItem,
  InsurancePolicy,
  SafetyCertificate
} from './complianceTypes';

/**
 * Calculate days until expiry for a date
 */
export function calculateDaysUntilExpiry(expiryDate: Date): number {
  return Math.floor((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Create an expiring item from insurance policy
 */
export function createExpiringItemFromPolicy(policy: InsurancePolicy): ExpiringItem {
  const daysUntilExpiry = calculateDaysUntilExpiry(policy.expiryDate);
  
  return {
    id: policy.id,
    type: 'insurance_policy' as const,
    name: `${policy.policyType} - ${policy.policyNumber}`,
    expiryDate: policy.expiryDate,
    daysUntilExpiry,
    isExpired: daysUntilExpiry < 0,
    isExpiringSoon: daysUntilExpiry <= 30 && daysUntilExpiry >= 0,
    renewalRequired: true,
    documentUrl: policy.documentUrl || ''
  };
}

/**
 * Create an expiring item from safety certificate
 */
export function createExpiringItemFromSafetyCert(cert: SafetyCertificate): ExpiringItem {
  const daysUntilExpiry = calculateDaysUntilExpiry(cert.expiryDate);
  
  return {
    id: cert.id,
    type: 'safety_certificate' as const,
    name: `${cert.certificationType} - ${cert.issuingBody}`,
    expiryDate: cert.expiryDate,
    daysUntilExpiry,
    isExpired: daysUntilExpiry < 0,
    isExpiringSoon: daysUntilExpiry <= 30,
    renewalRequired: true,
    documentUrl: cert.documentUrl || ''
  };
}

/**
 * Create compliance issue from policy
 */
export function createIssueFromPolicy(
  policy: InsurancePolicy, 
  daysUntilExpiry: number
): ComplianceIssue {
  let severity: ComplianceIssue['severity'];
  let description: string;
  
  if (daysUntilExpiry < 0) {
    severity = 'critical';
    description = 'Policy has expired';
  } else if (daysUntilExpiry <= 7) {
    severity = 'high';
    description = 'Policy expires within 7 days';
  } else if (daysUntilExpiry <= 30) {
    severity = 'medium';
    description = 'Policy expires within 30 days';
  } else {
    severity = 'low';
    description = 'Policy needs attention';
  }

  return {
    id: `issue_insurance_${policy.id}`,
    type: 'insurance',
    title: `Insurance Policy Issue: ${policy.policyType}`,
    description,
    severity,
    source: 'insurance_policy',
    sourceId: policy.id,
    detectedDate: new Date(),
    requiresAction: daysUntilExpiry <= 30,
    suggestedActions: [
      daysUntilExpiry < 0 
        ? 'Renew expired policy immediately'
        : 'Contact insurer to renew policy',
      'Update policy documentation'
    ]
  };
}

/**
 * Create compliance issue from safety certificate
 */
export function createIssueFromSafetyCert(
  cert: SafetyCertificate,
  daysUntilExpiry: number
): ComplianceIssue {
  let severity: ComplianceIssue['severity'];
  let description: string;
  
  if (daysUntilExpiry < 0) {
    severity = 'critical';
    description = 'Safety certificate has expired';
  } else if (daysUntilExpiry <= 7) {
    severity = 'high';
    description = 'Safety certificate expires within 7 days';
  } else if (daysUntilExpiry <= 30) {
    severity = 'medium';
    description = 'Safety certificate expires within 30 days';
  } else {
    severity = 'low';
    description = 'Safety certificate needs attention';
  }

  return {
    id: `issue_safety_${cert.id}`,
    type: 'safety',
    title: `Safety Certificate Issue: ${cert.certificationType}`,
    description,
    severity,
    source: 'safety_certificate',
    sourceId: cert.id,
    detectedDate: new Date(),
    requiresAction: daysUntilExpiry <= 30,
    suggestedActions: [
      daysUntilExpiry < 0 
        ? 'Renew expired certificate immediately'
        : 'Contact issuing body to renew certificate',
      'Update certificate documentation'
    ]
  };
}

/**
 * Determine overall compliance status from issues
 */
export function determineOverallComplianceStatus(issues: ComplianceIssue[]): 'compliant' | 'under_review' | 'pending' | 'non_compliant' {
  const criticalIssues = issues.filter(issue => issue.severity === 'critical');
  const highIssues = issues.filter(issue => issue.severity === 'high');
  
  if (criticalIssues.length > 0) {
    return 'non_compliant';
  } else if (highIssues.length > 0) {
    return 'pending';
  } else if (issues.length > 0) {
    return 'under_review';
  } else {
    return 'compliant';
  }
}

/**
 * Sort expiring items by urgency (days until expiry)
 */
export function sortExpiringItemsByUrgency(items: ExpiringItem[]): ExpiringItem[] {
  return items.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

/**
 * Calculate compliance score from individual scores
 */
export function calculateAverageComplianceScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, score) => sum + score, 0);
  return Math.round(total / scores.length);
}

/**
 * Calculate insurance compliance score
 */
export function calculateInsuranceScore(policies: InsurancePolicy[]): number {
  if (policies.length === 0) return 0;
  
  const activePolicies = policies.filter(p => p.isActive && p.expiryDate > new Date());
  const verifiedPolicies = activePolicies.filter(p => p.verificationStatus === 'verified');
  
  return Math.round((verifiedPolicies.length / policies.length) * 100);
}