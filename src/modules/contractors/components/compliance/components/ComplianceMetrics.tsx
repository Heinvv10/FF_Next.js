/**
 * ComplianceMetrics Component - Display overall compliance metrics and statistics
 * Extracted from ComplianceTracker.tsx for better maintainability
 */

import { TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { ComplianceMetrics as IComplianceMetrics } from '../utils/complianceUtils';
import { getStatusColor } from '../utils/complianceUtils';

interface ComplianceMetricsProps {
  /**
   * Compliance metrics data
   */
  complianceData: IComplianceMetrics;
  /**
   * Show detailed metrics
   */
  showDetailed?: boolean;
}

/**
 * ComplianceMetrics - Display compliance overview and key statistics
 */
export function ComplianceMetrics({ 
  complianceData, 
  showDetailed = false 
}: ComplianceMetricsProps) {
  const { overall, categories } = complianceData;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          Compliance Overview
        </h2>
        
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            getStatusColor('', overall.status)
          }`}>
            {overall.status.toUpperCase()}
          </span>
          
          {overall.trend !== 'stable' && (
            <div className="flex items-center gap-1">
              {overall.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Overall Score */}
      <div className="mb-6">
        <div className="flex items-end gap-4 mb-2">
          <div className="text-4xl font-bold text-gray-900">
            {overall.score}%
          </div>
          <div className="text-lg text-gray-600 mb-1">
            Overall Compliance Score
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              overall.score >= 90 ? 'bg-green-500' :
              overall.score >= 70 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${overall.score}%` }}
          />
        </div>
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(categories).map(([type, category]) => (
          <div 
            key={type}
            className="text-center p-3 border border-gray-100 rounded-lg"
          >
            <div className="text-lg font-semibold text-gray-900">
              {category.score}%
            </div>
            <div className="text-xs text-gray-600 capitalize">
              {type.replace('_', ' ')}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {category.compliant}/{category.total} docs
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Metrics (Optional) */}
      {showDetailed && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detailed Breakdown
          </h3>
          
          <div className="space-y-3">
            {Object.entries(categories).map(([type, category]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 capitalize">
                    {type.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {category.compliant} of {category.total} compliant
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${category.score}%` }}
                    />
                  </div>
                  <div className="text-sm font-medium text-gray-900 w-8 text-right">
                    {category.score}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}