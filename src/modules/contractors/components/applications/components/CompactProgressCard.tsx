/**
 * Compact Progress Card Component
 * Minimal progress display for table views
 */

import React from 'react';
import { Building2, User, FileText, Calendar } from 'lucide-react';
import { ProgressStats, CompletionDays, ProgressStatus, getProgressTextColor } from '../utils/progressUtils';
import { ProgressStatusIcon } from './ProgressStatusIcon';

interface CompactProgressCardProps {
  companyName: string;
  contactPerson: string;
  progressStats: ProgressStats;
  statusInfo: ProgressStatus;
  completionDays: CompletionDays | null;
  onClick?: () => void;
  className?: string;
}

export function CompactProgressCard({
  companyName,
  contactPerson,
  progressStats,
  statusInfo,
  completionDays,
  onClick,
  className = ''
}: CompactProgressCardProps) {
  return (
    <div
      className={`flex items-center space-x-3 p-3 rounded-lg bg-white border hover:bg-gray-50 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <ProgressStatusIcon status={statusInfo.status} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <Building2 className="h-4 w-4 text-gray-400" />
          <p className="font-medium text-gray-900 truncate">{companyName}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <User className="h-3 w-3" />
          <span className="truncate">{contactPerson}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Progress Circle */}
        <ProgressCircle
          progress={progressStats.overall}
          color={statusInfo.color}
        />

        {/* Document status */}
        <DocumentStatusCard
          complete={progressStats.documentsComplete}
          required={progressStats.documentsRequired}
        />

        {/* Completion date */}
        {completionDays && (
          <CompletionDateCard completionDays={completionDays} />
        )}
      </div>
    </div>
  );
}

interface ProgressCircleProps {
  progress: number;
  color: ProgressStatus['color'];
}

function ProgressCircle({ progress, color }: ProgressCircleProps) {
  const circumference = 2 * Math.PI * 16;
  const offset = circumference * (1 - progress / 100);

  return (
    <div className="relative w-12 h-12">
      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="#e5e7eb"
          strokeWidth="3"
          fill="none"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-all duration-300 ${getProgressTextColor(color)}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-gray-700">
          {progress}%
        </span>
      </div>
    </div>
  );
}

interface DocumentStatusCardProps {
  complete: number;
  required: number;
}

function DocumentStatusCard({ complete, required }: DocumentStatusCardProps) {
  return (
    <div className="text-center">
      <div className="flex items-center space-x-1 text-sm">
        <FileText className="h-4 w-4 text-gray-400" />
        <span className="font-medium">{complete}/{required}</span>
      </div>
      <p className="text-xs text-gray-500">Documents</p>
    </div>
  );
}

interface CompletionDateCardProps {
  completionDays: CompletionDays;
}

function CompletionDateCard({ completionDays }: CompletionDateCardProps) {
  const getCompletionText = () => {
    if (completionDays.overdue) {
      return `${completionDays.days}d overdue`;
    } else if (completionDays.today) {
      return 'Due today';
    } else {
      return `${completionDays.days}d left`;
    }
  };

  const getCompletionColor = () => {
    if (completionDays.overdue) return 'text-red-600';
    if (completionDays.today) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className="text-center">
      <div className={`flex items-center space-x-1 text-sm ${getCompletionColor()}`}>
        <Calendar className="h-4 w-4" />
        <span className="font-medium">{getCompletionText()}</span>
      </div>
      <p className="text-xs text-gray-500">Estimated</p>
    </div>
  );
}