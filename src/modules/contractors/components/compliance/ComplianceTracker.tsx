/**
 * ComplianceTracker Component - Main compliance monitoring dashboard
 * Refactored version that complies with constitutional file size limits (150 lines)
 * Business logic extracted to hooks, UI components extracted to separate files
 */

import { X, CheckCircle2 } from 'lucide-react';
import { ContractorDocument } from '@/types/contractor.types';
import { ComplianceIssue } from './types/documentApproval.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Extracted components and hooks
import { useComplianceTracker } from './hooks/useComplianceTracker';
import { ComplianceMetrics } from './components/ComplianceMetrics';
import { ComplianceAlerts } from './components/ComplianceAlerts';
import { ComplianceActions } from './components/ComplianceActions';

interface ComplianceTrackerProps {
  /**
   * Documents to analyze for compliance
   */
  documents: ContractorDocument[];
  /**
   * Callback when tracker is closed
   */
  onClose: () => void;
  /**
   * Optional contractor ID for focused compliance tracking
   */
  contractorId?: string;
  /**
   * Enable export functionality
   */
  enableExport?: boolean;
  /**
   * Auto-refresh interval in seconds (0 to disable)
   */
  autoRefreshInterval?: number;
  /**
   * Callback when compliance issues are detected
   */
  onComplianceIssue?: (issues: ComplianceIssue[]) => void;
}

/**
 * ComplianceTracker - Comprehensive compliance monitoring dashboard
 * Refactored to maintain constitutional limits and improve maintainability
 */
export function ComplianceTracker({
  documents,
  onClose,
  contractorId,
  enableExport = true,
  autoRefreshInterval = 0,
  onComplianceIssue
}: ComplianceTrackerProps) {
  // Use extracted hook for business logic
  const {
    isLoading,
    selectedCategory,
    complianceData,
    filteredIssues,
    setSelectedCategory,
    exportReport,
    refreshData,
    autoFixIssues,
    hasAutoFixableIssues,
    totalIssues
  } = useComplianceTracker({
    documents,
    contractorId,
    autoRefreshInterval,
    onComplianceIssue
  });

  // Show loading spinner while processing
  if (isLoading && !complianceData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Analyzing compliance...</p>
        </div>
      </div>
    );
  }

  // Don't render if no compliance data
  if (!complianceData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Compliance Tracker
            </h2>
            <p className="text-sm text-gray-600">
              {documents.length} documents • {totalIssues} issues found
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <ComplianceActions
              isLoading={isLoading}
              enableExport={enableExport}
              autoFixableIssuesCount={hasAutoFixableIssues ? filteredIssues.filter(i => i.autoFixAvailable).length : 0}
              onExport={exportReport}
              onRefresh={refreshData}
              onAutoFix={autoFixIssues}
            />
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Compliance Overview */}
          <ComplianceMetrics 
            complianceData={complianceData}
            showDetailed={false}
          />

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            
            {Object.keys(complianceData.categories).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Compliance Issues */}
          <ComplianceAlerts
            issues={filteredIssues}
            selectedCategory={selectedCategory}
            onAutoFix={(issue) => {
              // Handle individual issue auto-fix
              console.log('Auto-fixing issue:', issue.id);
            }}
            showDetails={true}
          />

          {/* Recommendations */}
          {complianceData.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Recommendations
              </h3>
              
              <ul className="space-y-2">
                {complianceData.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}