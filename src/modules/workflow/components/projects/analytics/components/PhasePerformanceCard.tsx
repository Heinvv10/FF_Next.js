/**
 * Phase Performance Card Component
 */

import { AlertTriangle } from 'lucide-react';
import type { WorkflowAnalytics } from '../../../../types/workflow.types';

interface PhasePerformanceCardProps {
  phaseMetrics: WorkflowAnalytics['phaseMetrics'];
}

export function PhasePerformanceCard({ phaseMetrics }: PhasePerformanceCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        Phase Performance
      </h3>

      <div className="space-y-4">
        {phaseMetrics.slice(0, 6).map((phase, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${
                (phase.bottleneckRisk as string) === 'high' ? 'bg-red-500' : 'bg-green-500'
              }`} />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {phase.phaseName}
              </span>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{Math.round(phase.averageDuration)} days</span>
              <span>{Math.round(phase.completionRate)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
          <span>
            {phaseMetrics.filter(p => (p.bottleneckRisk as string) === 'high').length} phases need attention
          </span>
        </div>
      </div>
    </div>
  );
}
