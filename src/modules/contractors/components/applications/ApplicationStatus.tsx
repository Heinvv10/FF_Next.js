/**
 * ApplicationStatus - Status badge component for applications
 */

import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface ApplicationStatusProps {
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  className?: string;
}

export function ApplicationStatus({ status, className = '' }: ApplicationStatusProps) {
  const statusConfig = {
    pending: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock,
      label: 'Pending',
    },
    approved: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      label: 'Approved',
    },
    rejected: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle,
      label: 'Rejected',
    },
    in_review: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: AlertCircle,
      label: 'In Review',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
      ${config.color} ${className}
    `}>
      <Icon size={12} className="mr-1" />
      {config.label}
    </span>
  );
}