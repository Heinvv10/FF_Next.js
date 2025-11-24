/**
 * Bottlenecks Card Component
 */

import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BottlenecksCardProps {
  bottlenecks: string[];
}

export function BottlenecksCard({ bottlenecks }: BottlenecksCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        Common Bottlenecks
      </h3>

      <div className="space-y-3">
        {bottlenecks.map((bottleneck, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {bottleneck}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Affects multiple project phases
              </p>
            </div>
          </div>
        ))}
      </div>

      {bottlenecks.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No significant bottlenecks detected
          </p>
        </div>
      )}
    </div>
  );
}
