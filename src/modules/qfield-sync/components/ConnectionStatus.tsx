/**
 * Connection Status Component
 * Displays the connection status for QFieldCloud or FibreFlow
 */

import React from 'react';
import { LucideIcon, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ConnectionStatusProps {
  title: string;
  icon: LucideIcon;
  status: 'connected' | 'disconnected' | 'error';
  url: string;
  lastCheck: string;
}

export function ConnectionStatus({
  title,
  icon: Icon,
  status,
  url,
  lastCheck,
}: ConnectionStatusProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'disconnected':
        return 'text-gray-600 bg-gray-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return CheckCircle;
      case 'disconnected':
        return AlertCircle;
      case 'error':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${getStatusColor()}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{url}</p>
          </div>
        </div>
        <div className="flex items-center">
          <StatusIcon className={`h-5 w-5 ${status === 'connected' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-gray-400'}`} />
          <span className={`ml-2 text-sm font-medium ${status === 'connected' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
            {status === 'connected' ? 'Connected' : status === 'error' ? 'Error' : 'Disconnected'}
          </span>
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Last checked: {new Date(lastCheck).toLocaleTimeString()}
      </div>
    </div>
  );
}