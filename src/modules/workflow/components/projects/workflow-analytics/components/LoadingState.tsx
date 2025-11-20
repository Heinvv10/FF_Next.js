/**
 * LoadingState Component
 * Loading indicator for analytics dashboard
 */

import React from 'react';
import { RefreshCw } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center space-x-2">
        <RefreshCw className="w-5 h-5 animate-spin text-green-600" />
        <span className="text-gray-600 dark:text-gray-400">Loading analytics...</span>
      </div>
    </div>
  );
}
