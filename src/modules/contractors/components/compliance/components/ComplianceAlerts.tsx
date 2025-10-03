/**
 * ComplianceAlerts Component - Display compliance issues and alerts
 * Extracted from ComplianceTracker.tsx for better maintainability
 */

import { AlertTriangle } from 'lucide-react';
import { ComplianceIssue } from '../types/documentApproval.types';
import { getStatusColor } from '../utils/complianceUtils';

interface ComplianceAlertsProps {
  /**
   * List of compliance issues to display
   */
  issues: ComplianceIssue[];
  /**
   * Selected category filter
   */
  selectedCategory: string;
  /**
   * Callback when auto-fix is triggered for an issue
   */
  onAutoFix?: (issue: ComplianceIssue) => void;
  /**
   * Show detailed issue information
   */
  showDetails?: boolean;
}

/**
 * ComplianceAlerts - Display and manage compliance issues
 */
export function ComplianceAlerts({ 
  issues, 
  selectedCategory, 
  onAutoFix,
  showDetails = true 
}: ComplianceAlertsProps) {
  if (issues.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-green-900">
              No Compliance Issues Found
            </h3>
            <p className="text-sm text-green-700 mt-1">
              {selectedCategory === 'all' 
                ? 'All documents are compliant with current requirements'
                : `All ${selectedCategory.replace('_', ' ')} documents are compliant`
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedCategory === 'all' ? 'All Issues' : `${selectedCategory.replace('_', ' ')} Issues`}
          </h3>
          <span className="text-sm text-gray-500">
            {issues.length} issue{issues.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {issues.map((issue) => (
          <div key={issue.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    getStatusColor('', issue.severity)
                  }`}>
                    {issue.severity.toUpperCase()}
                  </span>
                  
                  <span className="text-xs text-gray-500 capitalize">
                    {issue.type.replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-sm text-gray-900 mb-1">
                  {issue.message}
                </p>
                
                {showDetails && (
                  <p className="text-xs text-gray-600">
                    <strong>Suggested Action:</strong> {issue.suggestedAction}
                  </p>
                )}
              </div>
              
              {issue.autoFixAvailable && onAutoFix && (
                <button 
                  className="ml-4 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  onClick={() => onAutoFix(issue)}
                >
                  Auto Fix
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}