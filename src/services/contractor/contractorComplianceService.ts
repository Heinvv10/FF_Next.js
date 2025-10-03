/**
 * Contractor Compliance Service - Main aggregator for compliance services
 * Refactored for constitutional compliance (<300 lines)
 */

import { insuranceService } from './compliance/insuranceService';
import { safetyService } from './compliance/safetyService';
import { bbbeeService } from './compliance/bbbeeService';
import {
  ComplianceStatus,
  ComplianceIssue,
  ExpiringItem,
  ProjectComplianceRequirement,
  ContractorComplianceRecord,
  ComplianceDashboardData
} from './compliance/complianceTypes';
import {
  calculateDaysUntilExpiry,
  createExpiringItemFromPolicy,
  createExpiringItemFromSafetyCert,
  createIssueFromPolicy,
  createIssueFromSafetyCert,
  determineOverallComplianceStatus,
  sortExpiringItemsByUrgency,
  calculateAverageComplianceScore,
  calculateInsuranceScore
} from './compliance/contractorComplianceUtils';

export * from './compliance/complianceTypes';

export const contractorComplianceService = {
  async getComplianceStatus(contractorId: string, _projectId?: string): Promise<ComplianceStatus> {
    const [insurancePolicies, safetyCerts, bbbeeStatus] = await Promise.all([
      insuranceService.getInsurancePolicies(contractorId),
      safetyService.getSafetyCertifications(contractorId),
      bbbeeService.getCurrentBBBEELevel(contractorId)
    ]);

    const issues: ComplianceIssue[] = [];
    const expiringItems: ExpiringItem[] = [];

    // Process insurance policies
    const expiringInsurance = await insuranceService.getExpiringPolicies(contractorId, 30);
    expiringInsurance.forEach(policy => {
      const daysUntilExpiry = calculateDaysUntilExpiry(policy.expiryDate);
      
      expiringItems.push(createExpiringItemFromPolicy(policy));
      
      if (daysUntilExpiry <= 7) {
        issues.push(createIssueFromPolicy(policy, daysUntilExpiry));
      }
    });

    // Process safety certificates
    const expiringSafety = await safetyService.getExpiringSafetyCerts(contractorId, 30);
    expiringSafety.forEach(cert => {
      const daysUntilExpiry = calculateDaysUntilExpiry(cert.expiryDate);
      
      expiringItems.push(createExpiringItemFromSafetyCert(cert));
      
      if (daysUntilExpiry <= 14) {
        issues.push(createIssueFromSafetyCert(cert, daysUntilExpiry));
      }
    });

    // Determine overall status
    const overallStatus = determineOverallComplianceStatus(issues);

    return {
      overall: overallStatus,
      issues,
      expiringItems: sortExpiringItemsByUrgency(expiringItems),
      lastReviewDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  },

  async getProjectRequirements(projectId: string): Promise<ProjectComplianceRequirement[]> {
    return [
      {
        id: 'req_001',
        projectId,
        requirementType: 'insurance',
        requirement: 'Public Liability Insurance minimum R10 million',
        isMandatory: true,
        minimumStandard: { amount: 10000000, currency: 'ZAR' },
        verificationMethod: 'document_review',
        renewalFrequency: 'annually',
        effectiveDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'req_002',
        projectId,
        requirementType: 'safety',
        requirement: 'Construction Safety Certificate',
        isMandatory: true,
        minimumStandard: { validCertification: true },
        verificationMethod: 'document_review',
        renewalFrequency: 'annually',
        effectiveDate: new Date()
      },
      {
        id: 'req_003',
        projectId,
        requirementType: 'bbbee',
        requirement: 'BBBEE Level 4 or better',
        isMandatory: false,
        minimumStandard: { minLevel: 4 },
        verificationMethod: 'certificate_review',
        renewalFrequency: 'annually',
        effectiveDate: new Date()
      }
    ];
  },

  async getContractorRecord(contractorId: string): Promise<ContractorComplianceRecord> {
    const [complianceStatus, requirements] = await Promise.all([
      this.getComplianceStatus(contractorId),
      this.getProjectRequirements('default')
    ]);

    return {
      contractorId,
      complianceStatus,
      projectRequirements: requirements,
      documents: [],
      auditTrail: [],
      performanceMetrics: {
        complianceScore: await this.calculateComplianceScore(contractorId),
        trendsLast12Months: [85, 87, 82, 89, 91, 88, 90, 92, 89, 87, 90, 93],
        averageResolutionTime: 5.2,
        recurringIssues: 2
      }
    };
  },

  async getUpcomingRenewals(contractorId: string, daysAhead: number): Promise<ExpiringItem[]> {
    const [expiringInsurance, expiringSafety] = await Promise.all([
      insuranceService.getExpiringPolicies(contractorId, daysAhead),
      safetyService.getExpiringSafetyCerts(contractorId, daysAhead)
    ]);

    const renewals: ExpiringItem[] = [];

    // Process insurance renewals
    expiringInsurance.forEach(policy => {
      renewals.push(createExpiringItemFromPolicy(policy));
    });

    // Process safety renewals
    expiringSafety.forEach(cert => {
      renewals.push(createExpiringItemFromSafetyCert(cert));
    });

    return sortExpiringItemsByUrgency(renewals);
  },

  async calculateComplianceScore(contractorId: string): Promise<number> {
    const [insuranceScore, safetyScore, bbbeeScore] = await Promise.all([
      this.calculateInsuranceScore(contractorId),
      safetyService.getSafetyComplianceScore(contractorId),
      bbbeeService.getBBBEEComplianceScore(contractorId)
    ]);

    return calculateAverageComplianceScore([insuranceScore, safetyScore, bbbeeScore]);
  },

  async calculateInsuranceScore(contractorId: string): Promise<number> {
    const policies = await insuranceService.getInsurancePolicies(contractorId);
    return calculateInsuranceScore(policies);
  }
};