'use client';

/**
 * Compliance Dashboard Component
 * RAG status overview for staff document compliance
 */

import { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  ChevronRight,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import type { ComplianceStatus, DocumentType } from '@/types/staff-document.types';
import { DOCUMENT_TYPE_LABELS } from '@/types/staff-document.types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ComplianceDashboard');

interface StaffComplianceData extends ComplianceStatus {
  staffName: string;
}

interface ComplianceDashboardProps {
  complianceData: StaffComplianceData[];
  isLoading: boolean;
  onStaffClick: (staffId: string) => void;
}

type FilterOption = 'all' | 'compliant' | 'warning' | 'non_compliant';
type SortOption = 'status' | 'name' | 'percentage';

const STATUS_CONFIG = {
  compliant: {
    label: 'Compliant',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    Icon: CheckCircle,
  },
  warning: {
    label: 'Warning',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    Icon: AlertTriangle,
  },
  non_compliant: {
    label: 'Non-Compliant',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    Icon: XCircle,
  },
};

const STATUS_PRIORITY: Record<string, number> = {
  non_compliant: 0,
  warning: 1,
  compliant: 2,
};

export function ComplianceDashboard({
  complianceData,
  isLoading,
  onStaffClick,
}: ComplianceDashboardProps) {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('status');

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!complianceData.length) {
      return {
        total: 0,
        compliant: 0,
        warning: 0,
        nonCompliant: 0,
        avgCompliance: 0,
        totalExpiring30: 0,
        totalExpiring7: 0,
        totalExpired: 0,
      };
    }

    const compliant = complianceData.filter((d) => d.status === 'compliant').length;
    const warning = complianceData.filter((d) => d.status === 'warning').length;
    const nonCompliant = complianceData.filter((d) => d.status === 'non_compliant').length;
    const avgCompliance = Math.round(
      complianceData.reduce((sum, d) => sum + d.compliancePercentage, 0) / complianceData.length
    );
    const totalExpiring30 = complianceData.reduce((sum, d) => sum + d.expiringIn30Days, 0);
    const totalExpiring7 = complianceData.reduce((sum, d) => sum + d.expiringIn7Days, 0);
    const totalExpired = complianceData.reduce((sum, d) => sum + d.expiredDocuments, 0);

    return {
      total: complianceData.length,
      compliant,
      warning,
      nonCompliant,
      avgCompliance,
      totalExpiring30,
      totalExpiring7,
      totalExpired,
    };
  }, [complianceData]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...complianceData];

    // Apply filter
    if (filter !== 'all') {
      result = result.filter((d) => d.status === filter);
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.staffName.localeCompare(b.staffName);
        case 'percentage':
          return a.compliancePercentage - b.compliancePercentage;
        case 'status':
        default:
          return (STATUS_PRIORITY[a.status] ?? 3) - (STATUS_PRIORITY[b.status] ?? 3);
      }
    });

    return result;
  }, [complianceData, filter, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        <span className="sr-only">Loading compliance data...</span>
      </div>
    );
  }

  if (!complianceData.length) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No staff data available</p>
        <p className="text-sm text-gray-400 mt-1">Add staff members to view compliance status</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Compliance Dashboard</h2>
        <p className="text-sm text-gray-500">Document compliance overview for all staff</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
              <p className="text-xs text-gray-500">Total Staff</p>
            </div>
          </div>
        </div>

        {/* Overall Compliance */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.avgCompliance}%</p>
              <p className="text-xs text-gray-500">Avg Compliance</p>
            </div>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full" role="progressbar" aria-valuenow={summary.avgCompliance} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${summary.avgCompliance}%` }}
            />
          </div>
        </div>

        {/* Expiring 30 Days */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.totalExpiring30}</p>
              <p className="text-xs text-gray-500">Expiring in 30 days</p>
            </div>
          </div>
        </div>

        {/* Expiring 7 Days */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.totalExpiring7}</p>
              <p className="text-xs text-gray-500">Expiring in 7 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">{summary.compliant} Compliant</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">{summary.warning} Warning</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-800">{summary.nonCompliant} Non-Compliant</span>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterOption)}
            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Staff</option>
            <option value="compliant">Compliant Only</option>
            <option value="warning">Warning Only</option>
            <option value="non_compliant">Non-Compliant Only</option>
          </select>
        </div>
        <button
          onClick={() => setSortBy(sortBy === 'status' ? 'name' : 'status')}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowUpDown className="h-4 w-4" />
          Sort by {sortBy === 'status' ? 'Name' : 'Status'}
        </button>
      </div>

      {/* Staff List */}
      <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden" role="list">
        {filteredAndSortedData.map((staff) => {
          const config = STATUS_CONFIG[staff.status];
          const StatusIcon = config.Icon;

          return (
            <li
              key={staff.staffId}
              onClick={() => onStaffClick(staff.staffId)}
              className="p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              role="listitem"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <StatusIcon className={`h-5 w-5 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {staff.staffName}
                      </h4>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.bgColor} ${config.textColor}`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{staff.totalDocuments} documents</span>
                      <span>{staff.verifiedDocuments} verified</span>
                      {staff.pendingDocuments > 0 && (
                        <span className="text-yellow-600">{staff.pendingDocuments} pending</span>
                      )}
                      {staff.expiredDocuments > 0 && (
                        <span className="text-red-600">{staff.expiredDocuments} expired</span>
                      )}
                    </div>
                    {staff.missingRequired.length > 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        Missing: {staff.missingRequired.map((t) => DOCUMENT_TYPE_LABELS[t]).join(', ')}
                      </p>
                    )}
                    {(staff.expiringIn7Days > 0 || staff.expiringIn30Days > 0) && (
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        {staff.expiringIn7Days > 0 && (
                          <span className="text-orange-600">
                            {staff.expiringIn7Days} expiring in 7 days
                          </span>
                        )}
                        {staff.expiringIn30Days > 0 && (
                          <span className="text-amber-600">
                            {staff.expiringIn30Days} expiring in 30 days
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{staff.compliancePercentage}%</p>
                    <div className="w-20 h-2 bg-gray-200 rounded-full mt-1" role="progressbar" aria-valuenow={staff.compliancePercentage} aria-valuemin={0} aria-valuemax={100}>
                      <div
                        className={`h-full rounded-full ${
                          staff.compliancePercentage >= 80
                            ? 'bg-green-500'
                            : staff.compliancePercentage >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${staff.compliancePercentage}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
