/**
 * Compliance Utilities - Helper functions for compliance calculations and data processing
 * Extracted from ComplianceTracker.tsx to maintain constitutional file size limits
 */

import { ContractorDocument } from '@/types/contractor.types';
import { ComplianceIssue } from '../types/documentApproval.types';

/**
 * Compliance metric categories interface
 */
export interface ComplianceMetrics {
  overall: {
    score: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    trend: 'up' | 'down' | 'stable';
  };
  categories: {
    [key: string]: {
      score: number;
      total: number;
      compliant: number;
      issues: ComplianceIssue[];
    };
  };
  timeline: {
    date: string;
    score: number;
    issues: number;
  }[];
  recommendations: string[];
}

/**
 * Calculate comprehensive compliance metrics for documents
 */
export const calculateComplianceMetrics = (documents: ContractorDocument[]): ComplianceMetrics => {
  const now = new Date();
  const categories: { [key: string]: any } = {};
  const allIssues: ComplianceIssue[] = [];

  // Group documents by type
  const documentsByType = documents.reduce((acc, doc) => {
    if (!acc[doc.documentType]) {
      acc[doc.documentType] = [];
    }
    acc[doc.documentType].push(doc);
    return acc;
  }, {} as { [key: string]: ContractorDocument[] });

  // Analyze each document type
  Object.entries(documentsByType).forEach(([type, docs]) => {
    const typeIssues: ComplianceIssue[] = [];
    let compliantCount = 0;

    docs.forEach(doc => {
      let isCompliant = true;
      
      // Check verification status
      if (doc.verificationStatus === 'pending') {
        typeIssues.push({
          id: `${doc.id}-pending`,
          type: 'quality_check_failed',
          severity: 'medium',
          message: `Document pending approval: ${doc.documentName}`,
          suggestedAction: 'Review and approve document',
          autoFixAvailable: false
        });
        isCompliant = false;
      } else if (doc.verificationStatus === 'rejected') {
        typeIssues.push({
          id: `${doc.id}-rejected`,
          type: 'regulatory_compliance',
          severity: 'high',
          message: `Document rejected: ${doc.rejectionReason || 'No reason provided'}`,
          suggestedAction: 'Re-upload compliant document',
          autoFixAvailable: false
        });
        isCompliant = false;
      }

      // Check expiry
      if (doc.expiryDate) {
        const expiryDate = new Date(doc.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          typeIssues.push({
            id: `${doc.id}-expired`,
            type: 'regulatory_compliance',
            severity: 'high',
            message: `Document expired ${Math.abs(daysUntilExpiry)} days ago`,
            suggestedAction: 'Upload renewed document',
            autoFixAvailable: false
          });
          isCompliant = false;
        } else if (daysUntilExpiry <= 30) {
          typeIssues.push({
            id: `${doc.id}-expiring`,
            type: 'regulatory_compliance', 
            severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
            message: `Document expires in ${daysUntilExpiry} days`,
            suggestedAction: 'Schedule document renewal',
            autoFixAvailable: false
          });
          isCompliant = false;
        }
      }

      if (isCompliant) {
        compliantCount++;
      }
    });

    categories[type] = {
      score: docs.length > 0 ? Math.round((compliantCount / docs.length) * 100) : 100,
      total: docs.length,
      compliant: compliantCount,
      issues: typeIssues
    };

    allIssues.push(...typeIssues);
  });

  // Calculate overall metrics
  const totalDocs = documents.length;
  const totalCompliant = Object.values(categories).reduce((sum: number, cat: any) => sum + cat.compliant, 0);
  const overallScore = totalDocs > 0 ? Math.round((totalCompliant / totalDocs) * 100) : 100;

  return {
    overall: {
      score: overallScore,
      status: getComplianceStatus(overallScore),
      trend: 'stable' // Would need historical data to calculate actual trend
    },
    categories,
    timeline: [], // Would need historical data
    recommendations: generateRecommendations(allIssues, categories)
  };
};

/**
 * Get compliance status based on score
 */
export const getComplianceStatus = (score: number): 'excellent' | 'good' | 'warning' | 'critical' => {
  if (score >= 95) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 60) return 'warning';
  return 'critical';
};

/**
 * Generate recommendations based on compliance issues
 */
export const generateRecommendations = (issues: ComplianceIssue[], categories: any): string[] => {
  const recommendations: string[] = [];
  
  // Count issues by type
  const issuesByType = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // Generate targeted recommendations
  if (issuesByType['regulatory_compliance']) {
    recommendations.push(`Address ${issuesByType['regulatory_compliance']} regulatory compliance issues immediately`);
  }

  if (issuesByType['quality_check_failed']) {
    recommendations.push(`Review ${issuesByType['quality_check_failed']} pending documents for approval`);
  }

  // Category-specific recommendations
  Object.entries(categories).forEach(([type, data]: [string, any]) => {
    if (data.score < 80) {
      recommendations.push(`Improve ${type.replace('_', ' ')} compliance (currently ${data.score}%)`);
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('Excellent compliance! Maintain current document management practices.');
  }

  return recommendations;
};

/**
 * Get status color class for UI components
 */
export const getStatusColor = (status: string, severity?: string): string => {
  if (severity) {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  switch (status) {
    case 'excellent': return 'bg-green-100 text-green-800';
    case 'good': return 'bg-blue-100 text-blue-800';
    case 'warning': return 'bg-yellow-100 text-yellow-800';
    case 'critical': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};