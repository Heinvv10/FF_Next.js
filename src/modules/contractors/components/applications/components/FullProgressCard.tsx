/**
 * Full Progress Card Component
 * Complete progress display with detailed information
 */

import React from 'react';
import { ProgressStats, CompletionDays, ProgressStatus, getProgressBarClass, getStatusBadgeClasses } from '../utils/progressUtils';
import { ProgressStatusIcon } from './ProgressStatusIcon';
import { ProgressAlerts } from './ProgressAlerts';
import { ProgressStages } from './ProgressStages';

interface FullProgressCardProps {
  companyName: string;
  contactPerson: string;
  progressStats: ProgressStats;
  statusInfo: ProgressStatus;
  completionDays: CompletionDays | null;
  stages?: any[];
  lastActivity?: string;
  showStages?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FullProgressCard({
  companyName,
  contactPerson,
  progressStats,
  statusInfo,
  completionDays,
  stages = [],
  lastActivity,
  showStages = false,
  onClick,
  className = ''
}: FullProgressCardProps) {
  return (
    <div
      className={`ff-card hover:shadow-lg transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <ProgressStatusIcon status={statusInfo.status} />
            <div>
              <h3 className="font-semibold text-gray-900">{companyName}</h3>
              <p className="text-sm text-gray-500">{contactPerson}</p>
            </div>
          </div>
          <div className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeClasses(statusInfo.color)}`}>
            {statusInfo.label}
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          progress={progressStats.overall}
          progressColor={statusInfo.color}
        />

        {/* Stats Grid */}
        <StatsGrid
          completed={progressStats.completed}
          total={progressStats.total}
          documentsComplete={progressStats.documentsComplete}
          documentsRequired={progressStats.documentsRequired}
        />

        {/* Alerts */}
        <ProgressAlerts
          documentsExpired={progressStats.documentsExpired}
          documentsExpiring={progressStats.documentsExpiring}
        />

        {/* Completion Estimate */}
        {completionDays && (
          <CompletionEstimate completionDays={completionDays} />
        )}

        {/* Stage Details */}
        {showStages && stages.length > 0 && (
          <ProgressStages stages={stages} />
        )}

        {/* Last Activity */}
        {lastActivity && (
          <LastActivity activity={lastActivity} />
        )}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
  progressColor: ProgressStatus['color'];
}

function ProgressBar({ progress, progressColor }: ProgressBarProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
        <span className="text-sm font-semibold text-gray-900">
          {progress}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarClass(progressColor)}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

interface StatsGridProps {
  completed: number;
  total: number;
  documentsComplete: number;
  documentsRequired: number;
}

function StatsGrid({ completed, total, documentsComplete, documentsRequired }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="text-center p-3 bg-gray-50 rounded-lg">
        <div className="text-2xl font-bold text-gray-900">
          {completed}/{total}
        </div>
        <div className="text-xs text-gray-500">Stages Complete</div>
      </div>
      <div className="text-center p-3 bg-gray-50 rounded-lg">
        <div className="text-2xl font-bold text-gray-900">
          {documentsComplete}/{documentsRequired}
        </div>
        <div className="text-xs text-gray-500">Documents</div>
      </div>
    </div>
  );
}

interface CompletionEstimateProps {
  completionDays: CompletionDays;
}

function CompletionEstimate({ completionDays }: CompletionEstimateProps) {
  const getCompletionText = () => {
    if (completionDays.overdue) {
      return `${completionDays.days} days overdue`;
    } else if (completionDays.today) {
      return 'Due today';
    } else {
      return `${completionDays.days} days remaining`;
    }
  };

  const getCompletionColor = () => {
    if (completionDays.overdue) return 'text-red-600';
    if (completionDays.today) return 'text-orange-600';
    return 'text-gray-900';
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">Estimated completion:</span>
      <span className={`font-medium ${getCompletionColor()}`}>
        {getCompletionText()}
      </span>
    </div>
  );
}

interface LastActivityProps {
  activity: string;
}

function LastActivity({ activity }: LastActivityProps) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Last activity:</span>
        <span>{new Date(activity).toLocaleDateString()}</span>
      </div>
    </div>
  );
}