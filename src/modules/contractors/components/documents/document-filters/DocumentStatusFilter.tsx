/**
 * Document Status Filter Component
 * Handles status filtering with icons
 * @module DocumentFilters
 */

import React from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ChevronDown
} from 'lucide-react';

interface DocumentStatusFilterProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const ICONS = {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText
} as const;

export function DocumentStatusFilter({ statusFilter, onStatusFilterChange }: DocumentStatusFilterProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
      case 'verified':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="relative">
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="all">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="expired">Expired</option>
      </select>
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        {getStatusIcon(statusFilter)}
      </div>
      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}