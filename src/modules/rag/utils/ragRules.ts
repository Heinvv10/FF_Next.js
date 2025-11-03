/**
 * RAG Scoring Rules
 * Business logic for calculating Red/Amber/Green status
 *
 * These rules can be easily adjusted without touching other code
 */

import type {
  RagStatus,
  RagCategoryDetails,
  FinancialData,
  ComplianceData,
  PerformanceData,
  SafetyData,
} from '../types/rag.types';

// ==================== FINANCIAL RULES ====================

/**
 * Calculate Financial RAG status
 *
 * Rules:
 * 🟢 Green: No overdue payments, good credit
 * 🟡 Amber: 1-30 days overdue OR 1-2 late payments in last 12 months
 * 🔴 Red: 31+ days overdue OR 3+ late payments
 */
export function calculateFinancialRag(data: FinancialData): RagCategoryDetails {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  let status: RagStatus = 'green';
  let score = 100;

  // Check overdue payments
  if (data.overduePayments > 30) {
    status = 'red';
    score -= 50;
    issues.push(`Payments overdue by ${data.overduePayments} days`);
    recommendations.push('Immediate payment resolution required');
  } else if (data.overduePayments > 0) {
    status = status === 'green' ? 'amber' : status;
    score -= 20;
    warnings.push(`Payments overdue by ${data.overduePayments} days`);
    recommendations.push('Request payment update');
  }

  // Check late payment history
  if (data.latePaymentCount >= 3) {
    status = 'red';
    score -= 30;
    issues.push(`${data.latePaymentCount} late payments in last 12 months`);
    recommendations.push('Review payment terms and credit policy');
  } else if (data.latePaymentCount > 0) {
    status = status === 'green' ? 'amber' : status;
    score -= 10;
    warnings.push(`${data.latePaymentCount} late payment(s) this year`);
  }

  // Check outstanding invoices
  if (data.outstandingInvoices > 100000) {
    warnings.push(`High outstanding balance: R ${data.outstandingInvoices.toLocaleString()}`);
    score -= 10;
  }

  if (status === 'green') {
    recommendations.push('Maintain current payment standards');
  }

  return {
    status,
    score: Math.max(0, score),
    issues,
    warnings,
    recommendations,
    lastChecked: new Date(),
  };
}

// ==================== COMPLIANCE RULES ====================

/**
 * Calculate Compliance RAG status
 *
 * Rules:
 * 🟢 Green: All documents valid (>30 days until expiry)
 * 🟡 Amber: 1-2 documents expire within 30 days
 * 🔴 Red: Any expired documents OR 3+ documents expiring soon OR missing critical docs
 */
export function calculateComplianceRag(data: ComplianceData): RagCategoryDetails {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  let status: RagStatus = 'green';
  let score = 100;

  // Check expired documents (CRITICAL)
  if (data.expiredDocuments > 0) {
    status = 'red';
    score -= 60;
    issues.push(`${data.expiredDocuments} expired document(s)`);
    recommendations.push('Renew expired documents immediately');
    recommendations.push('Cannot assign to new projects until compliant');
  }

  // Check documents expiring soon
  if (data.expiringIn30Days >= 3) {
    status = status === 'green' ? 'red' : status;
    score -= 30;
    issues.push(`${data.expiringIn30Days} documents expire within 30 days`);
    recommendations.push('Schedule urgent document renewals');
  } else if (data.expiringIn30Days > 0) {
    status = status === 'green' ? 'amber' : status;
    score -= 15;
    warnings.push(`${data.expiringIn30Days} document(s) expire soon`);
    recommendations.push('Send document renewal reminders');
  }

  // Check missing documents
  if (data.missingDocuments.length > 0) {
    status = 'red';
    score -= 40;
    issues.push(`Missing ${data.missingDocuments.length} required document(s)`);
    data.missingDocuments.forEach(doc => {
      issues.push(`  - ${doc}`);
    });
    recommendations.push('Request missing documents from contractor');
  }

  // Calculate completion percentage
  const completionRate = ((data.totalRequiredDocuments - data.missingDocuments.length) / data.totalRequiredDocuments) * 100;
  if (completionRate < 100) {
    warnings.push(`Document completion: ${completionRate.toFixed(0)}%`);
  }

  if (status === 'green') {
    recommendations.push('All documents compliant - maintain regular reviews');
  }

  return {
    status,
    score: Math.max(0, score),
    issues,
    warnings,
    recommendations,
    lastChecked: new Date(),
  };
}

// ==================== PERFORMANCE RULES ====================

/**
 * Calculate Performance RAG status
 *
 * Rules:
 * 🟢 Green: 90%+ on-time completion, avg quality 4.0+/5
 * 🟡 Amber: 70-89% on-time, quality 3.0-3.9/5
 * 🔴 Red: <70% on-time OR quality <3.0/5 OR failed projects
 */
export function calculatePerformanceRag(data: PerformanceData): RagCategoryDetails {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  let status: RagStatus = 'green';
  let score = 100;

  // Special case: No projects yet (new contractor)
  if (data.totalProjects === 0) {
    warnings.push('No project history yet');
    recommendations.push('Assign to first project to establish performance baseline');
    return {
      status: 'amber',
      score: 50,
      issues,
      warnings,
      recommendations,
      lastChecked: new Date(),
    };
  }

  // Check failed projects (CRITICAL)
  if (data.failedProjects > 0) {
    status = 'red';
    score -= 50;
    issues.push(`${data.failedProjects} failed project(s)`);
    recommendations.push('Review failure causes and mitigation plans');
  }

  // Check on-time completion rate (only if we have projects)
  if (data.totalProjects > 0 && data.onTimeCompletionRate < 70) {
    status = 'red';
    score -= 30;
    issues.push(`Only ${data.onTimeCompletionRate.toFixed(0)}% on-time completion`);
    recommendations.push('Investigate delays and improve planning');
  } else if (data.totalProjects > 0 && data.onTimeCompletionRate < 90) {
    status = status === 'green' ? 'amber' : status;
    score -= 15;
    warnings.push(`${data.onTimeCompletionRate.toFixed(0)}% on-time completion (target: 90%+)`);
    recommendations.push('Focus on meeting project deadlines');
  }

  // Check quality score
  if (data.averageQualityScore < 3.0) {
    status = 'red';
    score -= 30;
    issues.push(`Low quality score: ${data.averageQualityScore.toFixed(1)}/5.0`);
    recommendations.push('Quality improvement plan required');
  } else if (data.averageQualityScore < 4.0) {
    status = status === 'green' ? 'amber' : status;
    score -= 15;
    warnings.push(`Quality score ${data.averageQualityScore.toFixed(1)}/5.0 (target: 4.0+)`);
    recommendations.push('Implement quality enhancement measures');
  }

  // Check delayed projects
  if (data.delayedProjects > 0) {
    const delayRate = (data.delayedProjects / data.totalProjects) * 100;
    warnings.push(`${data.delayedProjects} delayed project(s) - ${delayRate.toFixed(0)}% delay rate`);
  }

  if (status === 'green') {
    recommendations.push('Excellent performance - maintain standards');
  }

  return {
    status,
    score: Math.max(0, score),
    issues,
    warnings,
    recommendations,
    lastChecked: new Date(),
  };
}

// ==================== SAFETY RULES ====================

/**
 * Calculate Safety RAG status
 *
 * Rules:
 * 🟢 Green: Zero incidents in last 12 months
 * 🟡 Amber: 1-2 minor incidents (no injuries)
 * 🔴 Red: Major incident OR 3+ minor incidents OR overdue safety training
 */
export function calculateSafetyRag(data: SafetyData): RagCategoryDetails {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  let status: RagStatus = 'green';
  let score = 100;

  // Check major incidents (CRITICAL)
  if (data.majorIncidents > 0) {
    status = 'red';
    score -= 60;
    issues.push(`${data.majorIncidents} major safety incident(s) in last 12 months`);
    recommendations.push('Immediate safety review and corrective actions required');
    recommendations.push('Cannot assign to new projects until investigation complete');
  }

  // Check total incidents
  if (data.incidentsLast12Months >= 3) {
    status = status === 'green' ? 'red' : status;
    score -= 40;
    issues.push(`${data.incidentsLast12Months} safety incidents in last 12 months`);
    recommendations.push('Comprehensive safety program review needed');
  } else if (data.incidentsLast12Months > 0) {
    status = status === 'green' ? 'amber' : status;
    score -= 20;
    warnings.push(`${data.incidentsLast12Months} minor incident(s) this year`);
    recommendations.push('Reinforce safety protocols');
  }

  // Check safety training
  if (!data.safetyTrainingCurrent) {
    status = status === 'green' ? 'amber' : status;
    score -= 25;
    warnings.push('Safety training certifications not current');
    recommendations.push('Schedule safety training renewal');
  }

  // Check last audit
  if (data.lastSafetyAuditDate) {
    const daysSinceAudit = Math.floor((new Date().getTime() - new Date(data.lastSafetyAuditDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceAudit > 365) {
      warnings.push(`Last safety audit was ${daysSinceAudit} days ago`);
      recommendations.push('Schedule safety audit');
    }
  }

  if (status === 'green' && data.incidentsLast12Months === 0) {
    recommendations.push('Excellent safety record - continue safety-first approach');
  }

  return {
    status,
    score: Math.max(0, score),
    issues,
    warnings,
    recommendations,
    lastChecked: new Date(),
  };
}

// ==================== OVERALL STATUS ====================

/**
 * Calculate Overall RAG status
 *
 * Rule: Overall = WORST of the 4 category statuses
 * If ANY category is red → Overall is red
 * If ANY category is amber (and none red) → Overall is amber
 * Only if ALL are green → Overall is green
 */
export function calculateOverallRag(
  financial: RagStatus,
  compliance: RagStatus,
  performance: RagStatus,
  safety: RagStatus
): RagStatus {
  const statuses = [financial, compliance, performance, safety];

  // If any red → overall is red
  if (statuses.includes('red')) {
    return 'red';
  }

  // If any amber → overall is amber
  if (statuses.includes('amber')) {
    return 'amber';
  }

  // All green → overall is green
  return 'green';
}
