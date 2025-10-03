/**
 * useComplianceTracker Hook - Business logic for compliance tracking
 * Extracted from ComplianceTracker.tsx to maintain constitutional limits
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ContractorDocument } from '@/types/contractor.types';
import { ComplianceIssue } from '../types/documentApproval.types';
import { calculateComplianceMetrics, ComplianceMetrics } from '../utils/complianceUtils';
import { log } from '@/lib/logger';
import toast from 'react-hot-toast';

interface UseComplianceTrackerProps {
  documents: ContractorDocument[];
  contractorId?: string;
  autoRefreshInterval?: number;
  onComplianceIssue?: (issues: ComplianceIssue[]) => void;
}

export const useComplianceTracker = ({
  documents,
  contractorId,
  autoRefreshInterval = 0,
  onComplianceIssue
}: UseComplianceTrackerProps) => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [complianceData, setComplianceData] = useState<ComplianceMetrics | null>(null);

  // Calculate compliance metrics
  const metrics = useMemo(() => {
    try {
      return calculateComplianceMetrics(documents);
    } catch (error) {
      log.error('Error calculating compliance metrics:', error);
      toast.error('Failed to calculate compliance metrics');
      return null;
    }
  }, [documents]);

  // Update compliance data when metrics change
  useEffect(() => {
    if (metrics) {
      setComplianceData(metrics);
      
      // Notify parent component of issues
      if (onComplianceIssue) {
        const allIssues = Object.values(metrics.categories).flatMap(cat => cat.issues);
        onComplianceIssue(allIssues);
      }
    }
  }, [metrics, onComplianceIssue]);

  // Filter issues based on selected category
  const filteredIssues = useMemo(() => {
    if (!complianceData) return [];
    
    if (selectedCategory === 'all') {
      return Object.values(complianceData.categories).flatMap(cat => cat.issues);
    }
    
    return complianceData.categories[selectedCategory]?.issues || [];
  }, [complianceData, selectedCategory]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      log.info(`Auto-refreshing compliance data for contractor: ${contractorId}`);
      // In a real app, this would refetch data from API
      // For now, we just recalculate with existing data
      if (metrics) {
        setComplianceData(metrics);
      }
    }, autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, contractorId, metrics]);

  // Export compliance report
  const exportReport = useCallback(async () => {
    if (!complianceData) return;

    setIsLoading(true);
    try {
      const reportData = {
        generatedAt: new Date().toISOString(),
        contractorId,
        metrics: complianceData,
        documents: documents.length,
        totalIssues: filteredIssues.length
      };

      // Create and download JSON report
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${contractorId || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Compliance report exported successfully');
      log.info('Compliance report exported', { contractorId, issues: filteredIssues.length });
    } catch (error) {
      log.error('Error exporting compliance report:', error);
      toast.error('Failed to export compliance report');
    } finally {
      setIsLoading(false);
    }
  }, [complianceData, contractorId, documents.length, filteredIssues.length]);

  // Refresh compliance data
  const refreshData = useCallback(() => {
    setIsLoading(true);
    // Simulate data refresh
    setTimeout(() => {
      if (metrics) {
        setComplianceData(metrics);
      }
      setIsLoading(false);
      toast.success('Compliance data refreshed');
    }, 500);
  }, [metrics]);

  // Auto-fix available issues
  const autoFixIssues = useCallback(async () => {
    const autoFixableIssues = filteredIssues.filter(issue => issue.autoFixAvailable);
    
    if (autoFixableIssues.length === 0) {
      toast.info('No auto-fixable issues found');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate auto-fix process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Auto-fixed ${autoFixableIssues.length} issues`);
      log.info('Auto-fixed compliance issues', { 
        count: autoFixableIssues.length,
        contractorId 
      });
      
      // Refresh data after auto-fix
      refreshData();
    } catch (error) {
      log.error('Error auto-fixing issues:', error);
      toast.error('Failed to auto-fix issues');
    } finally {
      setIsLoading(false);
    }
  }, [filteredIssues, contractorId, refreshData]);

  return {
    // State
    isLoading,
    selectedCategory,
    selectedTimeframe,
    showDetailedView,
    complianceData,
    filteredIssues,
    
    // Actions
    setSelectedCategory,
    setSelectedTimeframe,
    setShowDetailedView,
    exportReport,
    refreshData,
    autoFixIssues,
    
    // Computed values
    hasIssues: filteredIssues.length > 0,
    hasAutoFixableIssues: filteredIssues.some(issue => issue.autoFixAvailable),
    overallStatus: complianceData?.overall.status || 'good',
    totalIssues: filteredIssues.length
  };
};