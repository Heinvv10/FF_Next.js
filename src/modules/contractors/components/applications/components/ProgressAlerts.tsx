/**
 * Progress Alerts Component
 * Displays document expiration and other important alerts
 */

import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface ProgressAlertsProps {
  documentsExpired: number;
  documentsExpiring: number;
}

export function ProgressAlerts({ documentsExpired, documentsExpiring }: ProgressAlertsProps) {
  if (documentsExpired === 0 && documentsExpiring === 0) {
    return null;
  }

  return (
    <div className="mb-4 space-y-2">
      {documentsExpired > 0 && (
        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
          <AlertTriangle className="h-4 w-4" />
          <span>{documentsExpired} expired document(s)</span>
        </div>
      )}
      {documentsExpiring > 0 && (
        <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 p-2 rounded-lg">
          <Clock className="h-4 w-4" />
          <span>{documentsExpiring} document(s) expiring soon</span>
        </div>
      )}
    </div>
  );
}