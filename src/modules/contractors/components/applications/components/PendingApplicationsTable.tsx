/**
 * Pending Applications Table Component
 * Table displaying pending applications with selection and actions
 * @module PendingApplicationsList
 */

import React from 'react';
import { Check, X, AlertTriangle, Clock, FileText, ExternalLink } from 'lucide-react';
import { ApplicationStatus } from '@/types/contractor.types';

interface PendingApplicationsTableProps {
  applications: any[];
  selectedIds: string[];
  onApplicationSelect: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onApplicationView: (application: any) => void;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-blue-100 text-blue-800',
    icon: FileText
  },
  documentation_incomplete: {
    label: 'Docs Incomplete',
    color: 'bg-red-100 text-red-800',
    icon: AlertTriangle
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800',
    icon: Check
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    icon: X
  }
};

export function PendingApplicationsTable({
  applications,
  selectedIds,
  onApplicationSelect,
  onSelectAll,
  onApplicationView
}: PendingApplicationsTableProps) {
  const handleSelectAll = (checked: boolean) => {
    onSelectAll(checked);
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={selectedIds.length === applications.length && applications.length > 0}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-900">
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select all'}
          </span>
        </div>
      </div>

      {/* Table Body */}
      {applications.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending applications</h3>
          <p className="text-gray-600">All applications have been processed.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === applications.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days in Review
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flags
                </th>
                <th className="relative px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(application.id)}
                      onChange={() => onApplicationSelect(application.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {application.companyName}
                      </div>
                      <div className="text-sm text-gray-500">
                        Applied {new Date(application.applicationDate).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {application.contactPerson}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(application.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {application.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              application.progress >= 80 ? 'bg-green-600' :
                              application.progress >= 50 ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${application.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {application.daysInReview}
                    </div>
                    <div className="text-sm text-gray-500">
                      days
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {application.urgentFlags.map((flag: string, index: number) => (
                        <span
                          key={index}
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            flag === 'High Risk' ? 'bg-red-100 text-red-800' :
                            flag === 'Delayed' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onApplicationView(application)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}